const HS = {
  get(key) {
    try { return parseInt(localStorage.getItem('sa_' + key) || '0', 10) || 0 } catch (e) { return 0 }
  },
  set(key, v) {
    try { localStorage.setItem('sa_' + key, String(v)) } catch (e) {}
  },
}

const C = {
  bg: '#0d0d1f',
  text: '#e8e8f0',
  muted: '#8888aa',
  accent: '#6c63ff',
  cyan: '#00d4ff',
  pink: '#ff6b9d',
  green: '#00ffaa',
}

function fitLogical(canvas, LW, LH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || LW
  canvas.style.aspectRatio = LW + ' / ' + LH
  const w = Math.max(1, Math.round(cssW * dpr))
  const h = Math.max(1, Math.round((cssW * LH / LW) * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const s = w / LW
  const ctx = canvas.getContext('2d')
  ctx.setTransform(s, 0, 0, s, 0, 0)
  return ctx
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function monoText(ctx, text, x, y, size, color, align) {
  ctx.font = size + 'px monospace'
  ctx.fillStyle = color
  ctx.textAlign = align || 'left'
  ctx.fillText(text, x, y)
}

function overlay(ctx, LW, LH, title, sub) {
  ctx.fillStyle = 'rgba(6,6,18,0.74)'
  ctx.fillRect(0, 0, LW, LH)
  monoText(ctx, title, LW / 2, LH / 2 - 6, 17, '#fff', 'center')
  if (sub) monoText(ctx, sub, LW / 2, LH / 2 + 20, 13, C.muted, 'center')
}

function bindInput(canvas, handlers) {
  let activePointer = null
  const down = e => {
    e.preventDefault()
    if (activePointer !== null) return
    activePointer = e.pointerId
    canvas.focus()
    handlers.down(e)
  }
  const move = e => { if (activePointer === null || e.pointerId === activePointer) handlers.move(e) }
  const up = e => { if (activePointer === null || e.pointerId === activePointer) { activePointer = null; handlers.up(e) } }
  canvas.addEventListener('pointerdown', down, { passive: false })
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  return () => {
    canvas.removeEventListener('pointerdown', down)
    canvas.removeEventListener('pointermove', move)
    canvas.removeEventListener('pointerup', up)
    canvas.removeEventListener('pointercancel', up)
  }
}

function gameLoopCtl(game, canvas, step) {
  let active = false
  let raf = 0
  let last = 0
  function loop(now) {
    if (!active) return
    raf = requestAnimationFrame(loop)
    const dt = Math.min((now - last) / 1000, 0.033)
    last = now
    step(dt, now / 1000)
  }
  return {
    get active() { return active },
    start() {
      if (active) return
      active = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    },
    stop() {
      active = false
      cancelAnimationFrame(raf)
    },
    refit() {
      cancelAnimationFrame(raf)
      game.refitCtx()
      last = performance.now()
      raf = requestAnimationFrame(loop)
    },
  }
}

function baseGame(canvas) {
  const listeners = []
  function listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts)
    listeners.push(() => target.removeEventListener(type, fn))
  }
  return {
    _listen: listen,
    _cleanup() { listeners.forEach(off => off()); listeners.length = 0 },
  }
}

function makeRunner(canvas) {
  const LW = 800
  const LH = 240
  const GROUND = LH - 34
  const G = 3240
  const JV = -840
  const labels = ['bug', 'null', 'undefined', '500', 'NaN', 'segfault', 'merge conflict', 'todo']
  const game = baseGame(canvas)
  let ctx = null
  let player, obstacles, speed, scoreF, over, running, spawnT, speedT
  let best = HS.get('bugrun')

  function reset() {
    player = { x: 60, y: GROUND - 30, w: 26, h: 30, vy: 0, jumping: false }
    obstacles = []
    speed = 5.5
    scoreF = 0
    over = false
    running = false
    spawnT = 0
    speedT = 0
  }

  function jump() {
    if (over) { reset(); running = true; return }
    if (!running) { running = true; return }
    if (!player.jumping) { player.vy = JV; player.jumping = true }
  }

  function spawn() {
    const text = labels[Math.floor(Math.random() * labels.length)]
    ctx.font = '13px monospace'
    obstacles.push({ x: LW + 20, y: GROUND - 26, w: ctx.measureText(text).width + 20, h: 26, text })
  }

  function update(dt) {
    player.vy += G * dt
    player.y += player.vy * dt
    if (player.y >= GROUND - player.h) {
      player.y = GROUND - player.h
      player.vy = 0
      player.jumping = false
    }
    spawnT -= dt
    if (spawnT <= 0) {
      spawn()
      spawnT = Math.max(0.55, (70 - speed * 3) / 60)
    }
    speedT += dt
    if (speedT >= 5) { speedT -= 5; speed += 0.5 }
    obstacles.forEach(o => { o.x -= speed * 60 * dt })
    obstacles = obstacles.filter(o => o.x + o.w > 0)
    for (const o of obstacles) {
      if (player.x < o.x + o.w - 6 && player.x + player.w > o.x + 6 && player.y + player.h > o.y + 4) {
        over = true
        running = false
        const sc = Math.floor(scoreF)
        if (sc > best) { best = sc; HS.set('bugrun', best) }
        break
      }
    }
    scoreF += dt * 12
  }

  function draw() {
    ctx.clearRect(0, 0, LW, LH)
    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, LW, LH)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(0, GROUND)
    ctx.lineTo(LW, GROUND)
    ctx.stroke()
    ctx.setLineDash([])
    const grad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h)
    grad.addColorStop(0, C.accent)
    grad.addColorStop(1, C.cyan)
    ctx.fillStyle = grad
    rr(ctx, player.x, player.y, player.w, player.h, 6)
    ctx.fill()
    monoText(ctx, '</>', player.x + player.w / 2, player.y + player.h / 2 + 5, 13, '#060612', 'center')
    obstacles.forEach(o => {
      ctx.fillStyle = 'rgba(255,107,157,0.15)'
      ctx.strokeStyle = C.pink
      ctx.lineWidth = 1.5
      rr(ctx, o.x, o.y, o.w, o.h, 6)
      ctx.fill()
      ctx.stroke()
      monoText(ctx, o.text, o.x + o.w / 2, o.y + o.h / 2 + 4, 13, C.pink, 'center')
    })
    const score = Math.floor(scoreF)
    monoText(ctx, 'score: ' + score, 14, 24, 13, C.text)
    monoText(ctx, 'best: ' + best, 14, 42, 13, C.muted)
    if (!running) {
      overlay(ctx, LW, LH,
        over ? 'Game over — tap or press Space to retry' : 'Tap or press Space to start',
        over ? 'score: ' + score + '   best: ' + best : null)
    }
  }

  const ctl = gameLoopCtl({ refitCtx() { ctx = fitLogical(canvas, LW, LH) } }, canvas, dt => {
    if (running) update(dt)
    draw()
  })

  return Object.assign(game, {
    label: 'Bug Runner',
    hint() { return 'Tap / click / Space to jump · Best: ' + best },
    enter() {
      ctl.refit()
      reset()
      game._listen(canvas, 'pointerdown', () => jump(), { passive: false })
      game._listen(canvas, 'keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() }
      })
      ctl.start()
    },
    exit() {
      ctl.stop()
      game._cleanup()
    },
  })
}

function makeBird(canvas) {
  const LW = 800
  const LH = 450
  const GROUND = LH - 36
  const G = 1500
  const FLAP = -430
  const BIRD_X = LW * 0.28
  const game = baseGame(canvas)
  let ctx = null
  let bird, pipes, score, over, running, distToNext
  let best = HS.get('flappy')

  function reset() {
    bird = { y: LH / 2, vy: 0, r: 14 }
    pipes = []
    score = 0
    over = false
    running = false
    distToNext = 200
  }

  function flap() {
    if (over) { reset(); running = true; return }
    if (!running) { running = true; return }
    bird.vy = FLAP
  }

  function die() {
    over = true
    running = false
    if (score > best) { best = score; HS.set('flappy', best) }
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw))
    const ny = Math.max(ry, Math.min(cy, ry + rh))
    const dx = cx - nx
    const dy = cy - ny
    return dx * dx + dy * dy < r * r
  }

  function update(dt) {
    const spd = 175 + Math.min(score * 5, 95)
    bird.vy = Math.min(bird.vy + G * dt, 680)
    bird.y += bird.vy * dt
    distToNext -= spd * dt
    if (distToNext <= 0) {
      const gap = Math.max(132, 172 - score * 2)
      pipes.push({ x: LW + 40, gy: 70 + Math.random() * (GROUND - 140 - gap), gap, passed: false })
      distToNext = 272
    }
    pipes.forEach(p => { p.x -= spd * dt })
    pipes = pipes.filter(p => p.x > -80)
    for (const p of pipes) {
      if (!p.passed && BIRD_X > p.x + 66) {
        p.passed = true
        score++
      }
      if (circleRect(BIRD_X, bird.y, bird.r - 2, p.x, 0, 66, p.gy) ||
          circleRect(BIRD_X, bird.y, bird.r - 2, p.x, p.gy + p.gap, 66, GROUND - p.gy - p.gap)) {
        die()
        return
      }
    }
    if (bird.y + bird.r >= GROUND || bird.y - bird.r <= 2) die()
  }

  function draw(t) {
    ctx.clearRect(0, 0, LW, LH)
    const sky = ctx.createLinearGradient(0, 0, 0, LH)
    sky.addColorStop(0, '#10102a')
    sky.addColorStop(1, C.bg)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, LW, LH)
    ctx.fillStyle = 'rgba(108,99,255,0.25)'
    for (let i = 0; i < 26; i++) {
      const sx = ((i * 137 + t * 18) % (LW + 40)) - 20
      const sy = (i * 89) % (GROUND - 20)
      ctx.fillRect(LW - sx, sy, 2, 2)
    }
    pipes.forEach(p => {
      ctx.fillStyle = 'rgba(255,107,157,0.13)'
      ctx.strokeStyle = C.pink
      ctx.lineWidth = 2
      rr(ctx, p.x, -8, 66, p.gy + 8, 8)
      ctx.fill()
      ctx.stroke()
      rr(ctx, p.x - 5, p.gy - 14, 76, 14, 5)
      ctx.fill()
      ctx.stroke()
      rr(ctx, p.x, p.gy + p.gap, 66, GROUND - p.gy - p.gap + 8, 8)
      ctx.fill()
      ctx.stroke()
      rr(ctx, p.x - 5, p.gy + p.gap, 76, 14, 5)
      ctx.fill()
      ctx.stroke()
    })
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(0, GROUND)
    ctx.lineTo(LW, GROUND)
    ctx.stroke()
    ctx.setLineDash([])
    const bob = running ? 0 : Math.sin(t * 4) * 6
    const by = bird.y + bob
    const body = ctx.createRadialGradient(BIRD_X - 4, by - 5, 2, BIRD_X, by, bird.r + 4)
    body.addColorStop(0, C.cyan)
    body.addColorStop(1, C.accent)
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(BIRD_X, by, bird.r, 0, Math.PI * 2)
    ctx.fill()
    const wingDir = running ? Math.sin(t * 22) : Math.sin(t * 6)
    ctx.fillStyle = 'rgba(232,232,240,0.9)'
    ctx.beginPath()
    ctx.ellipse(BIRD_X - 5, by + 2, 7, 4, wingDir * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = C.green
    ctx.beginPath()
    ctx.moveTo(BIRD_X + bird.r - 2, by - 3)
    ctx.lineTo(BIRD_X + bird.r + 8, by)
    ctx.lineTo(BIRD_X + bird.r - 2, by + 3)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(BIRD_X + 5, by - 5, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#060612'
    ctx.beginPath()
    ctx.arc(BIRD_X + 6, by - 5, 1.4, 0, Math.PI * 2)
    ctx.fill()
    monoText(ctx, 'score: ' + score, 14, 28, 15, C.text)
    monoText(ctx, 'best: ' + best, 14, 48, 13, C.muted)
    if (!running) {
      overlay(ctx, LW, LH,
        over ? 'Game over — tap or press Space to retry' : 'Tap / click / Space to fly',
        over ? 'score: ' + score + '   best: ' + best : 'thread the neon gaps')
    }
  }

  const ctl = gameLoopCtl({ refitCtx() { ctx = fitLogical(canvas, LW, LH) } }, canvas, (dt, t) => {
    if (running) update(dt)
    draw(t)
  })

  return Object.assign(game, {
    label: 'Bird Fly',
    hint() { return 'Tap / click / Space to flap · Best: ' + best },
    enter() {
      ctl.refit()
      reset()
      game._listen(canvas, 'pointerdown', () => flap(), { passive: false })
      game._listen(canvas, 'keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap() }
      })
      ctl.start()
    },
    exit() {
      ctl.stop()
      game._cleanup()
    },
  })
}

function makeArcher(canvas) {
  const LW = 800
  const LH = 450
  const BOW = { x: 110, y: 300 }
  const G = 900
  const ROUND_TIME = 60
  const game = baseGame(canvas)
  let ctx = null
  let targets, arrows, bursts, floaters
  let score, combo, lastHitAt, timeLeft, phase, startedAt, shake, missFlash
  let aim, dragging, chargeT, charging
  let best = HS.get('archer')

  const targetColors = [C.accent, C.cyan, C.pink, C.green]

  function newTarget(xMin) {
    return {
      x: xMin !== undefined ? xMin : LW + 70,
      y: 60 + Math.random() * (LH - 200),
      r: 22 + Math.random() * 16,
      vx: -(65 + Math.random() * 85),
      ph: Math.random() * Math.PI * 2,
      color: targetColors[Math.floor(Math.random() * targetColors.length)],
    }
  }

  function reset() {
    targets = [newTarget(320), newTarget(520), newTarget(700)]
    arrows = []
    bursts = []
    floaters = []
    score = 0
    combo = 1
    lastHitAt = -9999
    timeLeft = ROUND_TIME
    phase = 'idle'
    startedAt = 0
    aim = { angle: -Math.PI / 5, len: 0 }
    dragging = false
    charging = false
    chargeT = 0
    shake = 0
    missFlash = 0
  }

  function beginRound(now) {
    if (phase === 'playing') return true
    const keepBest = best
    reset()
    best = keepBest
    phase = 'playing'
    startedAt = now
    return true
  }

  function endRound(now) {
    phase = 'over'
    if (score > best) { best = score; HS.set('archer', best) }
  }

  function shotVector() {
    const power = dragging ? Math.min(aim.len / 180, 1) : (charging ? 0.35 + 0.6 * (0.5 - 0.5 * Math.cos(chargeT * 8.8)) : 0.55)
    return { dirX: Math.cos(aim.angle + Math.PI), dirY: Math.sin(aim.angle + Math.PI), power }
  }

  function fire(now) {
    if (phase !== 'playing') return
    if (arrows.length > 5) return
    const { dirX, dirY, power } = shotVector()
    arrows.push({ x: BOW.x, y: BOW.y, vx: dirX * (380 + power * 560), vy: dirY * (380 + power * 560), hit: false })
  }

  function toLocal(e) {
    const r = canvas.getBoundingClientRect()
    const sx = LW / r.width
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sx }
  }

  function onDown(e) {
    const p = toLocal(e)
    beginRound(performance.now())
    if (phase !== 'playing') return
    if (p.x < LW * 0.45 || p.y > LH * 0.55) {
      dragging = true
      updateAim(p)
    } else {
      updateAim(p)
      fire(performance.now())
    }
  }

  function updateAim(p) {
    const dx = p.x - BOW.x
    const dy = p.y - BOW.y
    const len = Math.hypot(dx, dy)
    aim.angle = Math.atan2(dy, dx)
    aim.len = Math.min(len, 220)
  }

  function onMove(e) {
    if (!dragging) return
    updateAim(toLocal(e))
  }

  function onUp() {
    if (!dragging) return
    dragging = false
    fire(performance.now())
  }

  function burst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 60 + Math.random() * 160
      bursts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.7, color })
    }
  }

  function floater(x, y, text, color) {
    floaters.push({ x, y, text, color, life: 1 })
  }

  function update(dt, now) {
    if (charging && phase === 'playing') chargeT += dt
    if (shake > 0) shake = Math.max(0, shake - dt * 30)
    if (missFlash > 0) missFlash -= dt

    if (phase === 'playing') {
      timeLeft = ROUND_TIME - (now * 1000 - startedAt) / 1000
      if (timeLeft <= 0) {
        timeLeft = 0
        endRound(now * 1000)
      }
    }

    targets.forEach(tg => {
      tg.x += tg.vx * dt
      tg.ph += dt * 2
      const wy = tg.y + Math.sin(tg.ph) * 12
      tg.drawY = wy
      if (tg.x < -tg.r - 20) Object.assign(tg, newTarget())
    })

    arrows.forEach(a => {
      a.vy += G * dt
      a.x += a.vx * dt
      a.y += a.vy * dt
      if (!a.hit) {
        for (const tg of targets) {
          const ty = tg.drawY !== undefined ? tg.drawY : tg.y
          if ((a.x - tg.x) ** 2 + (a.y - ty) ** 2 < tg.r * tg.r) {
            a.hit = true
            const nowMs = now * 1000
            combo = nowMs - lastHitAt < 2500 ? Math.min(combo + 1, 6) : 1
            lastHitAt = nowMs
            const pts = Math.round(120 - tg.r + 10)
            const total = pts * combo
            score += total
            burst(tg.x, ty, tg.color)
            floater(tg.x, ty - tg.r - 8, '+' + total + (combo > 1 ? ' x' + combo : ''), C.green)
            shake = 5
            Object.assign(tg, newTarget())
            break
          }
        }
      }
    })
    let missed = false
    arrows.forEach(a => {
      if (!a.hit && (a.x < -40 || a.x > LW + 60 || a.y > LH + 60)) a.gone = true
    })
    if (arrows.some(a => a.gone)) {
      missFlash = 0.3
      combo = 1
    }
    arrows = arrows.filter(a => !a.hit && !a.gone)

    bursts.forEach(p => {
      p.life -= dt
      p.vy += G * 0.4 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    })
    bursts = bursts.filter(p => p.life > 0)

    floaters.forEach(f => {
      f.life -= dt * 1.2
      f.y -= 34 * dt
    })
    floaters = floaters.filter(f => f.life > 0)
  }

  function drawBow() {
    const { dirX, dirY, power } = shotVector()
    const perpX = -dirY
    const perpY = dirX
    const pull = dragging ? Math.min(aim.len, 140) : power * 120
    const nx = BOW.x - dirX * pull
    const ny = BOW.y - dirY * pull
    const tipA = { x: BOW.x + perpX * 40 + dirX * 10, y: BOW.y + perpY * 40 + dirY * 10 }
    const tipB = { x: BOW.x - perpX * 40 + dirX * 10, y: BOW.y - perpY * 40 + dirY * 10 }
    const ctrl = { x: BOW.x - dirX * 52, y: BOW.y - dirY * 52 }

    ctx.strokeStyle = C.accent
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tipA.x, tipA.y)
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, BOW.x, BOW.y)
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, tipB.x, tipB.y)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(232,232,240,0.75)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(tipA.x, tipA.y)
    ctx.lineTo(nx, ny)
    ctx.lineTo(tipB.x, tipB.y)
    ctx.stroke()

    const ax = nx + dirX * 26
    const ay = ny + dirY * 26
    ctx.strokeStyle = C.text
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(nx, ny)
    ctx.lineTo(ax, ay)
    ctx.stroke()
    ctx.fillStyle = C.pink
    ctx.beginPath()
    ctx.moveTo(ax + dirX * 9, ay + dirY * 9)
    ctx.lineTo(ax + perpX * 4, ay + perpY * 4)
    ctx.lineTo(ax - perpX * 4, ay - perpY * 4)
    ctx.closePath()
    ctx.fill()
  }

  function drawPreview() {
    const { dirX, dirY, power } = shotVector()
    let x = BOW.x
    let y = BOW.y
    let vx = dirX * (380 + power * 560)
    let vy = dirY * (380 + power * 560)
    const step = 1 / 24
    for (let i = 0; i < 26; i++) {
      vy += G * step
      x += vx * step
      y += vy * step
      if (x > LW || y > LH || y < 0) break
      ctx.fillStyle = 'rgba(0,212,255,' + (0.5 * (1 - i / 26)).toFixed(2) + ')'
      ctx.beginPath()
      ctx.arc(x, y, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function draw(t) {
    ctx.save()
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
    ctx.clearRect(-10, -10, LW + 20, LH + 20)
    const sky = ctx.createLinearGradient(0, 0, 0, LH)
    sky.addColorStop(0, '#10102a')
    sky.addColorStop(1, C.bg)
    ctx.fillStyle = sky
    ctx.fillRect(-10, -10, LW + 20, LH + 20)

    ctx.fillStyle = 'rgba(108,99,255,0.18)'
    for (let i = 0; i < 20; i++) {
      const gx = (i * 173 + t * 10) % LW
      const gy = (i * 97) % LH
      ctx.fillRect(LW - gx, gy, 2, 2)
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(0, LH - 28)
    ctx.lineTo(LW, LH - 28)
    ctx.stroke()
    ctx.setLineDash([])

    targets.forEach(tg => {
      const ty = tg.drawY !== undefined ? tg.drawY : tg.y
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.strokeStyle = tg.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(tg.x, ty, tg.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(tg.x, ty, tg.r * 0.55, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = tg.color
      ctx.beginPath()
      ctx.arc(tg.x, ty, 3.5, 0, Math.PI * 2)
      ctx.fill()
    })

    arrows.forEach(a => {
      const m = Math.hypot(a.vx, a.vy) || 1
      const ux = a.vx / m
      const uy = a.vy / m
      const tailX = a.x - ux * 34
      const tailY = a.y - uy * 34
      ctx.strokeStyle = C.text
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(a.x, a.y)
      ctx.stroke()
      ctx.fillStyle = a.hit ? C.green : C.pink
      ctx.beginPath()
      ctx.moveTo(a.x + ux * 8, a.y + uy * 8)
      ctx.lineTo(a.x - uy * 4, a.y + ux * 4)
      ctx.lineTo(a.x + uy * 4, a.y - ux * 4)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = C.muted
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(tailX - uy * 6, tailY + ux * 6)
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(tailX + uy * 6, tailY - ux * 6)
      ctx.stroke()
    })

    bursts.forEach(p => {
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, p.life / 0.7)
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
      ctx.globalAlpha = 1
    })

    drawBow(t)
    if ((dragging || charging) && phase === 'playing') drawPreview()

    floaters.forEach(f => {
      ctx.globalAlpha = Math.max(0, f.life)
      monoText(ctx, f.text, f.x, f.y, 16, f.color, 'center')
      ctx.globalAlpha = 1
    })

    monoText(ctx, 'score: ' + score, 14, 28, 15, C.text)
    monoText(ctx, 'best: ' + best, 14, 48, 13, C.muted)
    if (combo > 1 && phase === 'playing' && performance.now() / 1000 - lastHitAt / 1000 < 2.5) {
      monoText(ctx, 'combo x' + combo, LW / 2, 30, 15, C.green, 'center')
    }
    if (phase === 'playing') {
      monoText(ctx, 'time: ' + Math.ceil(timeLeft) + 's', LW - 14, 28, 15, timeLeft < 10 ? C.pink : C.text, 'right')
    }
    if (missFlash > 0) {
      ctx.fillStyle = 'rgba(255,107,157,' + (missFlash * 0.25).toFixed(2) + ')'
      ctx.fillRect(-10, -10, LW + 20, LH + 20)
    }
    ctx.restore()

    if (phase !== 'playing') {
      overlay(ctx, LW, LH,
        phase === 'over' ? "Time's up — tap or press Space again" : 'Drag from the bow to aim & release · Space charges',
        phase === 'over' ? 'score: ' + score + '   best: ' + best : 'pop the rings before the clock runs out')
    }
  }

  const ctl = gameLoopCtl({ refitCtx() { ctx = fitLogical(canvas, LW, LH) } }, canvas, (dt, t) => {
    update(dt, t)
    draw(t)
  })

  return Object.assign(game, {
    label: 'Arrow Shooter',
    hint() { return 'Touch/mouse: drag from bow, release to shoot · Keys: ←→ aim, hold Space, release · Best: ' + best },
    enter() {
      ctl.refit()
      reset()
      game._listen(canvas, 'pointerdown', onDown, { passive: false })
      game._listen(canvas, 'pointermove', onMove)
      game._listen(canvas, 'pointerup', onUp)
      game._listen(canvas, 'pointercancel', onUp)
      const keys = new Set()
      game._listen(canvas, 'keydown', e => {
        if (['Space', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
        if (e.code === 'Space' && !keys.has('Space')) {
          keys.add('Space')
          beginRound(performance.now())
          charging = true
          chargeT = 0
        }
        if (e.code === 'ArrowLeft') keys.add('ArrowLeft')
        if (e.code === 'ArrowRight') keys.add('ArrowRight')
      })
      game._listen(canvas, 'keyup', e => {
        if (e.code === 'Space' && keys.has('Space')) {
          keys.delete('Space')
          charging = false
          fire(performance.now())
        }
        if (e.code === 'ArrowLeft') keys.delete('ArrowLeft')
        if (e.code === 'ArrowRight') keys.delete('ArrowRight')
      })
      game._keyLoopTimer = setInterval(() => {
        if (keys.has('ArrowLeft')) aim.angle = Math.max(-Math.PI + 0.4, aim.angle - 0.05)
        if (keys.has('ArrowRight')) aim.angle = Math.min(-0.08, aim.angle + 0.05)
      }, 16)
      this._stopKeys = () => clearInterval(game._keyLoopTimer)
      ctl.start()
    },
    exit() {
      ctl.stop()
      game._cleanup()
      if (this._stopKeys) this._stopKeys()
    },
  })
}

const GAME_FACTORIES = { runner: makeRunner, bird: makeBird, archer: makeArcher }

export function initArcade(canvas, hintEl, tabsEl) {
  if (!canvas || !GAME_FACTORIES) return
  const games = {}
  for (const key of Object.keys(GAME_FACTORIES)) games[key] = GAME_FACTORIES[key](canvas)

  let current = null

  function activate(id) {
    if (!games[id] || current === games[id]) return
    if (current) current.exit()
    current = games[id]
    if (tabsEl) {
      tabsEl.querySelectorAll('[data-game]').forEach(btn => {
        const isActive = btn.dataset.game === id
        btn.classList.toggle('active', isActive)
        btn.setAttribute('aria-selected', String(isActive))
      })
    }
    current.enter()
    if (hintEl) hintEl.textContent = current.hint()
  }

  if (tabsEl) {
    tabsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-game]')
      if (btn) activate(btn.dataset.game)
    })
  }

  let resizeTimer = 0
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (!current) return
      current.exit()
      current.enter()
    }, 150)
  }, { passive: true })

  activate('runner')
}
