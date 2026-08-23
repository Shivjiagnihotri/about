import * as THREE from 'three'

const canvas = document.getElementById('webgl')
if (canvas) init()

function init() {
  const stage = canvas.parentElement
  const section = document.getElementById('neural')
  const loader = document.getElementById('loader')

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(pointer: fine)').matches
  const lowPower = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768

  const PARTICLES = lowPower ? 2600 : 6500
  const ANCHORS = lowPower ? 60 : 120
  const MAX_SEGMENTS = lowPower ? 180 : 480

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch (err) {
    fail()
    return
  }

  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 240)
  camera.position.set(0, 0, 30)

  const universe = new THREE.Group()
  let particleMat = null
  let innerCore = null
  let coreGroupRef = null

  const palette = [
    { c: new THREE.Color('#6c63ff'), w: 0.42 },
    { c: new THREE.Color('#00d4ff'), w: 0.34 },
    { c: new THREE.Color('#ff6b9d'), w: 0.14 },
    { c: new THREE.Color('#e8e8ff'), w: 0.1 },
  ]

  function pickColor() {
    let t = Math.random()
    for (const p of palette) {
      t -= p.w
      if (t <= 0) return p.c
    }
    return palette[palette.length - 1].c
  }

  function makeGlowTexture() {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  function buildParticles() {
    const positions = new Float32Array(PARTICLES * 3)
    const colors = new Float32Array(PARTICLES * 3)
    const scales = new Float32Array(PARTICLES)
    const phases = new Float32Array(PARTICLES)

    for (let i = 0; i < PARTICLES; i++) {
      const r = 11 + Math.pow(Math.random(), 0.65) * 15
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * 2.4
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.82 + (Math.random() - 0.5) * 2.4
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 2.4

      const col = pickColor()
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b

      scales[i] = 0.6 + Math.random() * Math.random() * 2.2
      phases[i] = Math.random() * Math.PI * 2
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute vec3 aColor;
        attribute float aScale;
        attribute float aPhase;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vec3 p = position;
          p += normalize(p) * sin(uTime * 0.35 + aPhase * 0.5) * 0.45;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPixelRatio * aScale * (150.0 / max(1.0, -mv.z));
          vColor = aColor;
          vTwinkle = 0.62 + 0.38 * sin(uTime * 1.4 + aPhase);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.04, d) * vTwinkle;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    })

    particleMat = mat
    return new THREE.Points(geo, mat)
  }

  function buildConnections(pointsObj) {
    const src = pointsObj.geometry.getAttribute('position')
    const pts = []
    const total = src.count
    const step = Math.max(1, Math.floor(total / ANCHORS))
    for (let i = 0; i < total && pts.length < ANCHORS; i += step) {
      pts.push(new THREE.Vector3().fromBufferAttribute(src, i))
    }
    const segs = []
    const maxDist = 5.4
    outer: for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < maxDist) {
          segs.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
          if (segs.length >= MAX_SEGMENTS * 6) break outer
        }
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3))
    const mat = new THREE.LineBasicMaterial({
      color: 0x4fd8ff,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.LineSegments(geo, mat)
  }

  function buildCore() {
    const group = new THREE.Group()

    const outer = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(7.2, 1)),
      new THREE.LineBasicMaterial({
        color: 0x6c63ff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )

    innerCore = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(4.1, 0)),
      new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        color: 0x7b74ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    glow.scale.setScalar(26)

    group.add(glow, outer, innerCore)
    return group
  }

  const particlePoints = buildParticles()
  universe.add(particlePoints)
  universe.add(buildConnections(particlePoints))
  coreGroupRef = buildCore()
  universe.add(coreGroupRef)
  scene.add(universe)

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  const state = { spin: 0, scrollT: 0, scrollP: 0, visT: 1, lastOpacity: -1 }
  let running = false
  let rafId = 0
  let lastTime = performance.now()
  let sceneVisible = true
  let docVisible = !document.hidden
  let firstFrameDone = false
  let resizeTimer = 0

  function clamp01(v) {
    return Math.min(1, Math.max(0, v))
  }

  function measureSection() {
    if (!section) return
    const rect = section.getBoundingClientRect()
    const vh = window.innerHeight
    state.scrollT = clamp01((vh - rect.top) / (rect.height + vh))
    const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
    state.visT = clamp01(visiblePx / Math.min(rect.height, vh))
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (particleMat) particleMat.uniforms.uPixelRatio.value = renderer.getPixelRatio()
    if (!running) renderStatic()
  }

  function applyScene(dt, t) {
    state.spin += dt * 0.05
    mouse.x += (mouse.tx - mouse.x) * 0.045
    mouse.y += (mouse.ty - mouse.y) * 0.045
    state.scrollP += (state.scrollT - state.scrollP) * Math.min(1, dt * 6)

    universe.rotation.y = state.spin + mouse.x * 0.28 + state.scrollP * 1.6
    universe.rotation.x = -0.12 + mouse.y * 0.16
    universe.position.y = state.scrollP * 4 - 1.5

    camera.position.z = 30 + state.scrollP * 14
    camera.position.x = mouse.x * 1.4
    camera.position.y = -mouse.y * 1.0
    camera.lookAt(0, 0, 0)

    coreGroupRef.rotation.y += dt * 0.14
    coreGroupRef.rotation.x += dt * 0.07
    innerCore.rotation.y -= dt * 0.22
    innerCore.rotation.z += dt * 0.1
    coreGroupRef.scale.setScalar(1 + Math.sin(t * 0.8) * 0.035)

    if (particleMat) particleMat.uniforms.uTime.value = t

    const op = 0.15 + 0.85 * clamp01(state.visT * 1.4)
    const rounded = Math.round(op * 200) / 200
    if (rounded !== state.lastOpacity) {
      state.lastOpacity = rounded
      stage.style.opacity = rounded.toFixed(2)
    }
  }

  function renderStatic() {
    applyScene(0, 2.5)
    renderer.render(scene, camera)
    markFirstFrame()
  }

  function frame(now) {
    if (!running) return
    rafId = requestAnimationFrame(frame)
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    applyScene(dt, now / 1000)
    renderer.render(scene, camera)
    markFirstFrame()
  }

  function markFirstFrame() {
    if (firstFrameDone) return
    firstFrameDone = true
    requestAnimationFrame(() => {
      if (loader) loader.classList.add('is-done')
    })
  }

  function updateRunning() {
    const shouldRun = !reducedMotion && docVisible && sceneVisible
    if (shouldRun && !running) {
      running = true
      lastTime = performance.now()
      rafId = requestAnimationFrame(frame)
    } else if (!shouldRun && running) {
      running = false
      cancelAnimationFrame(rafId)
    }
  }

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 150)
    },
    { passive: true }
  )

  window.addEventListener(
    'scroll',
    () => {
      measureSection()
      if (!running) renderStatic()
    },
    { passive: true }
  )

  if (finePointer && !reducedMotion) {
    window.addEventListener(
      'pointermove',
      e => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1
      },
      { passive: true }
    )
  }

  if ('IntersectionObserver' in window && section) {
    new IntersectionObserver(
      entries => {
        sceneVisible = entries[0].isIntersecting
        updateRunning()
      },
      { threshold: 0.02, rootMargin: '80px' }
    ).observe(section)
  } else if (!section) {
    sceneVisible = false
  }

  document.addEventListener('visibilitychange', () => {
    docVisible = !document.hidden
    updateRunning()
  })

  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault()
    running = false
    cancelAnimationFrame(rafId)
  })
  canvas.addEventListener('webglcontextrestored', () => updateRunning())

  resize()
  measureSection()
  state.scrollP = state.scrollT
  updateRunning()
  if (!running) renderStatic()

  function fail() {
    if (stage) stage.classList.add('no-webgl')
    if (loader) loader.classList.add('is-done')
  }
}
