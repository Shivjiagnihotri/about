import {
  THREE,
  loadMaterials,
  createWorld,
  createDrone,
  createWeapon,
} from "./worlds.js";
import { clamp, stepPlayer, jumpPlayer, rayBox } from "./physics.js";

const $ = (id) => document.getElementById(id);
const titles = { parkour: "Rooftop Protocol", shooter: "Resistance Zero" };
const instructions = {
  parkour: {
    label: "EXPERIENCE 01 / PARKOUR",
    title: "The horizon<br>is yours.",
    description:
      "Follow the amber signals across six rooftops. Sprint and double jump to cross the gaps. Each signal saves a checkpoint; a missed leap adds five seconds.",
    guide: [
      ["WASD", "Move"],
      ["MOUSE", "Look"],
      ["SPACE ×2", "Double jump"],
      ["SHIFT", "Sprint"],
    ],
    hint: "WASD / arrows move · Mouse look · Space double jump · Shift sprint · Esc pause",
  },
  shooter: {
    label: "EXPERIENCE 02 / COMBAT",
    title: "Take back<br>the district.",
    description:
      "Survive three waves of armed security drones. Use the barricades as cover. Aim for their red sensors, keep your rifle loaded, and clear the sector.",
    guide: [
      ["WASD", "Move"],
      ["CLICK", "Fire"],
      ["RIGHT CLICK", "Aim"],
      ["R", "Reload"],
      ["C", "Crouch"],
    ],
    hint: "WASD / arrows move · Mouse look · Click / Space fire · Right click aim · R reload · C crouch · Esc pause",
  },
};
const storage = {
  get(k) {
    try {
      return Number(localStorage.getItem("sa_3d_" + k)) || 0;
    } catch {
      return 0;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("sa_3d_" + k, String(v));
    } catch {}
  },
};
export function initArcade() {
  const dialog = $("gameDialog"),
    canvas = $("gameCanvas"),
    viewport = $("gameViewport");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(78, 1, 0.06, 400);
  const viewCamera = new THREE.PerspectiveCamera(60, 1, 0.01, 5);
  const viewScene = new THREE.Scene();
  viewScene.add(new THREE.HemisphereLight(0xffffff, 0x4f5144, 2));
  const weaponLight = new THREE.DirectionalLight(0xffe7c4, 3);
  weaponLight.position.set(-2, 3, 2);
  viewScene.add(weaponLight);
  const direction = new THREE.Vector3(),
    origin = new THREE.Vector3();
  const touch = matchMedia("(pointer:coarse)").matches;
  const radar = $("gameRadar").getContext("2d");
  let low = touch,
    world,
    assets,
    mode = "parkour",
    state = "closed",
    p,
    weapon,
    checkpoint,
    signals = 0,
    wave = 1,
    kills = 0,
    score = 0,
    health = 100,
    ammo = 24,
    reload = 0,
    shotCooldown = 0,
    elapsed = 0,
    waveWait = 0,
    raf = 0,
    last = 0,
    walking = 0,
    recoil = 0,
    damage = 0,
    notifyTimer = 0,
    hitTimer = 0,
    opening = false,
    opener = null;
  let enemies = [],
    effects = [],
    keys = new Set(),
    firing = false,
    aiming = false,
    drag = null,
    frameCount = 0;
  let audio = null,
    sound = false,
    footTimer = 0;
  renderer.shadowMap.enabled = !low;
  const reduced = () =>
    document.body.classList.contains("motion-off") ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  function soundEffect(type) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume().catch(() => {});
      const gain = audio.createGain();
      gain.connect(audio.destination);
      const now = audio.currentTime;
      if (type === "shot" || type === "step" || type === "hit") {
        const duration = type === "shot" ? 0.16 : 0.09,
          buffer = audio.createBuffer(
            1,
            Math.ceil(audio.sampleRate * duration),
            audio.sampleRate,
          ),
          channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++)
          channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
        const source = audio.createBufferSource();
        source.buffer = buffer;
        const filter = audio.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = type === "shot" ? 1600 : 450;
        source.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(type === "shot" ? 0.13 : 0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        source.start();
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
      } else {
        const osc = audio.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(type === "signal" ? 660 : 280, now);
        osc.frequency.exponentialRampToValueAtTime(
          type === "signal" ? 1320 : 140,
          now + 0.2,
        );
        osc.connect(gain);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start();
        osc.stop(now + 0.3);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
    } catch {
      sound = false;
      updateSound();
    }
  }
  function updateSound() {
    $("soundToggle").textContent = sound ? "Sound on" : "Sound off";
    $("soundToggle").setAttribute("aria-pressed", String(sound));
    $("soundToggle").setAttribute(
      "aria-label",
      sound ? "Disable game sound" : "Enable game sound",
    );
  }
  function notify(message, seconds = 2.8) {
    $("gameNotification").textContent = message;
    notifyTimer = seconds;
  }
  function setState(next) {
    state = next;
    dialog.dataset.state = next;
    canvas.dataset.game = mode;
  }
  function formatTime(t) {
    return (
      String(Math.floor(t / 60)).padStart(2, "0") +
      ":" +
      String(Math.floor(t % 60)).padStart(2, "0")
    );
  }
  function setBest() {
    const best = storage.get(mode);
    $("gameBest").textContent =
      mode === "parkour"
        ? "BEST " + (best ? formatTime(best) : "NOT SET")
        : "BEST " + (best ? best.toLocaleString() : "NOT SET");
  }
  function setScreen(kind) {
    const info = instructions[mode];
    $("gameHud").hidden = kind === "menu";
    $("gameScreen").hidden = false;
    $("pauseGame").hidden = true;
    $("touchControls").hidden = true;
    $("gameScreenLabel").textContent =
      kind === "menu"
        ? info.label
        : kind === "paused"
          ? "MISSION PAUSED"
          : kind === "won"
            ? "MISSION COMPLETE"
            : "MISSION ENDED";
    $("gameScreenTitle").innerHTML =
      kind === "menu"
        ? info.title
        : kind === "paused"
          ? "Take a breath."
          : kind === "won"
            ? mode === "parkour"
              ? "Perfect<br>synchronization."
              : "District<br>secured."
            : "Signal<br>lost.";
    $("gameScreenDescription").textContent =
      kind === "menu"
        ? info.description
        : kind === "paused"
          ? "Your progress is saved for this session. Resume when you’re ready."
          : kind === "won"
            ? mode === "parkour"
              ? "All six signals recovered in " +
                formatTime(elapsed) +
                ". The city is yours."
              : "All three waves cleared. " +
                score.toLocaleString() +
                " points. Sector control restored."
            : "The drones overwhelmed your position. Try using the barricades to break their line of sight.";
    $("controlGuide").innerHTML = touch
      ? "<span>Left controls: move</span><span>Drag the view: look</span><span>Right controls: act</span>"
      : info.guide
          .map(
            ([key, label]) =>
              "<span><kbd>" + key + "</kbd>" + label + "</span>",
          )
          .join("");
    $("startGame").hidden = false;
    $("startGame").disabled = false;
    $("startGame").innerHTML =
      (kind === "paused"
        ? "Resume mission"
        : kind === "menu"
          ? "Start mission"
          : "Play again") + ' <span aria-hidden="true">↗</span>';
    $("restartGame").hidden = kind !== "paused";
    $("gameScreenNote").textContent = touch
      ? "Drag with your right thumb to look. Rotate your device for a wider view."
      : "Click Start to capture your mouse · Esc to pause · Best results are stored on this device.";
  }
  function resize() {
    if (!dialog.open) return;
    const w = Math.max(1, viewport.clientWidth),
      h = Math.max(1, viewport.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.65));
    renderer.setSize(w, h, false);
    camera.aspect = viewCamera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewCamera.updateProjectionMatrix();
    if (world) render();
  }
  function clearEffects() {
    for (const e of effects) {
      world?.scene.remove(e.mesh);
      e.mesh.geometry.dispose();
      e.mesh.material.dispose();
    }
    effects = [];
  }
  function removeEnemy(enemy) {
    world.scene.remove(enemy.group);
    enemy.group.traverse((o) => {
      if (o.isMesh && o.geometry.type === "TorusGeometry") o.geometry.dispose();
    });
  }
  function reset() {
    clearEffects();
    enemies.forEach(removeEnemy);
    enemies = [];
    if (weapon) {
      viewScene.remove(weapon);
      weapon.traverse((o) => {
        if (
          o.geometry &&
          (o.userData.weaponGeometry ||
            ["TorusGeometry", "ConeGeometry"].includes(o.geometry.type))
        )
          o.geometry.dispose();
      });
      weapon.userData.ownedMaterials.forEach((material) => material.dispose());
    }
    p = {
      ...world.spawn,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      pitch: mode === "parkour" ? -0.06 : 0,
      grounded: true,
      jumps: 2,
      moving: 0,
    };
    checkpoint = { ...world.spawn };
    signals = 0;
    wave = 1;
    kills = 0;
    score = 0;
    health = 100;
    ammo = 24;
    reload = 0;
    shotCooldown = 0;
    elapsed = 0;
    waveWait = 0;
    recoil = 0;
    damage = 0;
    walking = 0;
    footTimer = 0;
    keys.clear();
    firing = aiming = false;
    world.beacons.forEach((b) => {
      b.active = true;
      b.group.visible = true;
    });
    weapon = createWeapon(world.materials, mode === "parkour");
    viewScene.add(weapon);
    if (mode === "parkour") weapon.scale.setScalar(0.85);
    if (mode === "shooter") spawnWave();
    updateHud();
    updateCamera(0);
    render();
  }
  function spawnWave() {
    const count = wave * 2 + 1;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.5,
        drone = createDrone(world.materials);
      drone.group.position.set(
        Math.cos(angle) * 22,
        2.2 + world.random() * 0.6,
        Math.sin(angle) * 22,
      );
      const enemy = {
        ...drone,
        hp: 3,
        cooldown: 2.2 + i * 0.5,
        phase: world.random() * 6.28,
        flash: 0,
      };
      world.scene.add(enemy.group);
      enemies.push(enemy);
    }
    if (state === "playing")
      notify("WAVE " + wave + " / 3 · " + count + " HOSTILE DRONES", 3);
  }
  function updateHud() {
    $("missionLabel").textContent =
      mode === "parkour"
        ? "ROOFTOP PROTOCOL"
        : "RESISTANCE ZERO / WAVE " + wave;
    $("missionObjective").textContent =
      mode === "parkour"
        ? "Follow the amber signals · sprint + double jump"
        : "Clear wave " + wave + " of 3 · use cover";
    $("gameProgress").textContent =
      mode === "parkour" ? signals + " / 6" : enemies.length + " HOSTILES";
    $("gameTimer").textContent = formatTime(elapsed);
    drawRadar();
    $("healthLabel").textContent = mode === "parkour" ? "SYNC" : "HEALTH";
    $("healthValue").textContent = String(Math.ceil(health));
    $("healthBar").style.width = health + "%";
    $("gameAmmo").textContent =
      mode === "parkour"
        ? p.jumps > 0
          ? "AIR JUMP READY"
          : "LAND TO RECHARGE"
        : reload > 0
          ? "RELOADING…"
          : String(ammo).padStart(2, "0") + " / ∞";
  }
  function drawRadar() {
    radar.clearRect(0, 0, 220, 220);
    radar.fillStyle = "rgba(15,28,24,.6)";
    radar.fillRect(0, 0, 220, 220);
    radar.strokeStyle = "#aabb9840";
    radar.lineWidth = 1;
    radar.strokeRect(1, 1, 218, 218);
    const scale = mode === "parkour" ? 2 : 3,
      centerX = p.x,
      centerZ = p.z;
    radar.save();
    radar.beginPath();
    radar.rect(3, 3, 214, 214);
    radar.clip();
    radar.fillStyle = "#90a08c50";
    for (const b of world.colliders) {
      if (b.maxY < 0 || b.maxX - b.minX > 80) continue;
      radar.fillRect(
        110 + (b.minX - centerX) * scale,
        110 + (b.minZ - centerZ) * scale,
        (b.maxX - b.minX) * scale,
        (b.maxZ - b.minZ) * scale,
      );
    }
    const targets =
      mode === "parkour"
        ? world.beacons.filter((b) => b.active).map((b) => b.roof)
        : enemies.map((e) => e.group.position);
    radar.fillStyle = mode === "parkour" ? "#ffd18a" : "#ff9277";
    for (const target of targets) {
      radar.beginPath();
      radar.arc(
        110 + (target.x - centerX) * scale,
        110 + (target.z - centerZ) * scale,
        4,
        0,
        Math.PI * 2,
      );
      radar.fill();
    }
    radar.translate(110, 110);
    radar.rotate(-p.yaw);
    radar.fillStyle = "#f4f3dd";
    radar.beginPath();
    radar.moveTo(0, -8);
    radar.lineTo(6, 6);
    radar.lineTo(0, 3);
    radar.lineTo(-6, 6);
    radar.closePath();
    radar.fill();
    radar.restore();
    const degrees = ((((-p.yaw * 180) / Math.PI) % 360) + 360) % 360;
    const cardinal = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
      Math.round(degrees / 45) % 8
    ];
    $("gameCompass").textContent = cardinal + " / " + Math.round(degrees) + "°";
  }
  function nearestBlock(o, d, limit = 200) {
    let distance = limit;
    for (const b of world.colliders)
      distance = Math.min(distance, rayBox(o, d, b, distance));
    return distance;
  }
  function tracer(from, to, color = 0xfad18a) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]),
      material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
    const mesh = new THREE.Line(geo, material);
    world.scene.add(mesh);
    effects.push({ mesh, life: 0.1, max: 0.1 });
  }
  function burst(pos, color) {
    const coords = [];
    for (let i = 0; i < 12; i++) {
      coords.push(
        pos.x,
        pos.y,
        pos.z,
        pos.x + (Math.random() - 0.5) * 0.65,
        pos.y + (Math.random() - 0.5) * 0.65,
        pos.z + (Math.random() - 0.5) * 0.65,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
    const mesh = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    );
    world.scene.add(mesh);
    effects.push({ mesh, life: 0.25, max: 0.25 });
  }
  function reloadWeapon() {
    if (mode !== "shooter" || reload > 0 || ammo === 24 || state !== "playing")
      return;
    reload = 1.5;
    soundEffect("reload");
    updateHud();
  }
  function fire() {
    if (
      mode !== "shooter" ||
      state !== "playing" ||
      shotCooldown > 0 ||
      reload > 0
    )
      return;
    if (ammo <= 0) {
      reloadWeapon();
      return;
    }
    ammo--;
    shotCooldown = 0.16;
    recoil = 0.075;
    soundEffect("shot");
    weapon.userData.flash.visible = true;
    camera.getWorldPosition(origin);
    camera.getWorldDirection(direction);
    const obstacle = nearestBlock(origin, direction),
      end = origin.clone().addScaledVector(direction, Math.min(obstacle, 100));
    let closest = null,
      closestDistance = obstacle;
    for (const enemy of enemies) {
      const vector = enemy.group.position.clone().sub(origin),
        along = vector.dot(direction);
      // The rotor volume provides a forgiving silhouette without shooting through walls.
      if (
        along > 0 &&
        along < closestDistance &&
        vector.lengthSq() - along * along < 0.7 * 0.7
      ) {
        closest = enemy;
        closestDistance = along;
      }
    }
    if (closest) {
      closest.hp--;
      closest.flash = 0.1;
      end.copy(origin).addScaledVector(direction, closestDistance);
      burst(end, 0xffcf7a);
      $("hitMarker").classList.add("hit");
      hitTimer = 0.12;
      soundEffect("hit");
      if (closest.hp <= 0) {
        burst(closest.group.position, 0xffb357);
        removeEnemy(closest);
        enemies = enemies.filter((e) => e !== closest);
        kills++;
        score += 100;
        health = Math.min(100, health + 4);
      }
    } else if (obstacle < 100) burst(end, 0xd1bb91);
    const start = origin
      .clone()
      .add(
        new THREE.Vector3(0.23, -0.12, -0.6).applyQuaternion(camera.quaternion),
      );
    tracer(start, end);
    if (ammo === 0) notify("MAGAZINE EMPTY · PRESS R TO RELOAD", 1.5);
    updateHud();
  }
  function primary() {
    if (state !== "playing") return;
    if (mode === "parkour") {
      if (jumpPlayer(p, true)) soundEffect("jump");
    } else fire();
  }
  function updateEnemies(dt, time) {
    for (const enemy of enemies) {
      const pos = enemy.group.position,
        dx = p.x - pos.x,
        dz = p.z - pos.z,
        dist = Math.hypot(dx, dz) || 1;
      const approach = dist > 10 ? 1.7 : dist < 6 ? -1 : 0;
      const strafe = Math.sin(time * 0.65 + enemy.phase) * 1.25;
      const nx = pos.x + ((dx / dist) * approach + (dz / dist) * strafe) * dt,
        nz = pos.z + ((dz / dist) * approach - (dx / dist) * strafe) * dt;
      const blocked = world.colliders.some(
        (b) =>
          b.maxY > 1 &&
          nx > b.minX - 0.9 &&
          nx < b.maxX + 0.9 &&
          nz > b.minZ - 0.9 &&
          nz < b.maxZ + 0.9,
      );
      if (!blocked) {
        pos.x = clamp(nx, -25, 25);
        pos.z = clamp(nz, -29, 29);
      }
      pos.y = 2.35 + Math.sin(time * 1.2 + enemy.phase) * 0.3;
      enemy.group.lookAt(p.x, pos.y, p.z);
      enemy.group.rotation.z = Math.sin(time + enemy.phase) * 0.035;
      enemy.rotors.forEach((r) => (r.rotation.y += dt * 90));
      enemy.cooldown -= dt;
      enemy.flash = Math.max(0, enemy.flash - dt);
      if (enemy.cooldown <= 0 && dist < 33) {
        enemy.cooldown = 1.8 + world.random() * 1.3;
        const target = new THREE.Vector3(
            p.x,
            p.y + (keys.has("KeyC") ? 0.82 : 1.45),
            p.z,
          ),
          toward = target.clone().sub(pos),
          length = toward.length();
        toward.normalize();
        if (nearestBlock(pos, toward, length) >= length - 0.2) {
          // The first shot is deliberately slower; moving and cover improve survivability.
          const hit = world.random() < (p.moving > 3 ? 0.46 : 0.78);
          if (!hit) target.x += 1.2;
          tracer(pos.clone(), target, 0xff7661);
          if (hit) {
            health = Math.max(0, health - (5 + wave));
            damage = 0.3;
            soundEffect("hit");
          }
        }
      }
    }
  }
  function updateCamera(dt) {
    walking += p.moving * dt;
    const motion = reduced() ? 0 : 1;
    const bob =
      (p.grounded
        ? Math.sin(walking * 1.7) * Math.min(p.moving / 8, 1) * 0.035
        : 0) * motion;
    const eyeHeight = mode === "shooter" && keys.has("KeyC") ? 0.92 : 1.67;
    camera.position.set(p.x, p.y + eyeHeight + bob, p.z);
    camera.rotation.set(
      p.pitch + recoil * 0.12,
      p.yaw,
      Math.sin(walking * 0.85) * 0.003 * motion,
      "YXZ",
    );
    const desiredFov =
      aiming && mode === "shooter"
        ? 55
        : keys.has("ShiftLeft") && p.moving > 4
          ? 85
          : 78;
    camera.fov += (desiredFov - camera.fov) * Math.min(1, dt * 10);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (mode === "shooter") {
      const zoom = aiming ? 0 : 0.25;
      weapon.position.x += (zoom - weapon.position.x) * Math.min(1, dt * 14);
      weapon.position.y =
        -0.22 +
        bob * 0.4 -
        (reload > 0 ? Math.sin((reload / 1.5) * Math.PI) * 0.24 : 0);
      weapon.position.z = -0.46 + recoil;
      weapon.rotation.z =
        reload > 0
          ? -0.35 * Math.sin((reload / 1.5) * Math.PI)
          : Math.sin(walking * 0.8) * 0.015 * motion;
      weapon.userData.flash.visible = shotCooldown > 0.1;
    } else {
      weapon.position.y = bob * 1.7 + (p.grounded ? -0.08 : -0.02);
      weapon.rotation.z = Math.sin(walking) * 0.025 * motion;
    }
  }
  function render() {
    if (!world) return;
    renderer.autoClear = true;
    renderer.render(world.scene, camera);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(viewScene, viewCamera);
    renderer.autoClear = true;
  }
  function frame(now) {
    raf = 0;
    if (state !== "playing") return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt;
    frameCount++;
    const input = {
      crouch: keys.has("KeyC"),
      forward: keys.has("KeyW") || keys.has("ArrowUp"),
      back: keys.has("KeyS") || keys.has("ArrowDown"),
      left: keys.has("KeyA") || keys.has("ArrowLeft"),
      right: keys.has("KeyD") || keys.has("ArrowRight"),
      sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"),
    };
    if (keys.has("KeyJ")) p.yaw += dt * 1.6;
    if (keys.has("KeyL")) p.yaw -= dt * 1.6;
    if (keys.has("KeyI")) p.pitch = clamp(p.pitch + dt, -1.35, 1.35);
    if (keys.has("KeyK")) p.pitch = clamp(p.pitch - dt, -1.35, 1.35);
    // Substeps keep collisions stable without slowing movement at modest frame rates.
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    for (let i = 0; i < steps; i++)
      stepPlayer(p, input, world.colliders, dt / steps);
    shotCooldown = Math.max(0, shotCooldown - dt);
    recoil = Math.max(0, recoil - dt * 0.7);
    damage = Math.max(0, damage - dt);
    if (reload > 0) {
      reload -= dt;
      if (reload <= 0) {
        reload = 0;
        ammo = 24;
      }
    }
    if (firing || (keys.has("Space") && mode === "shooter")) fire();
    if (mode === "parkour") {
      for (const beacon of world.beacons) {
        if (
          beacon.active &&
          Math.hypot(p.x - beacon.roof.x, p.z - beacon.roof.z) < 1.9 &&
          Math.abs(p.y - beacon.roof.y) < 2.5
        ) {
          beacon.active = false;
          beacon.group.visible = false;
          signals++;
          checkpoint = { x: beacon.roof.x, y: beacon.roof.y, z: beacon.roof.z };
          soundEffect("signal");
          notify("SIGNAL " + signals + " / 6 · CHECKPOINT SAVED");
        }
      }
      if (p.y < 7) {
        Object.assign(p, checkpoint, {
          vx: 0,
          vy: 0,
          vz: 0,
          grounded: true,
          jumps: 2,
        });
        elapsed += 5;
        notify("CHECKPOINT RESTORED · +5 SECONDS");
      }
      if (signals === 6) {
        finish(true);
        return;
      }
    } else {
      updateEnemies(dt, elapsed);
      if (health <= 0) {
        finish(false);
        return;
      }
      if (enemies.length === 0) {
        if (wave === 3) {
          score += Math.max(0, 500 - Math.floor(elapsed));
          finish(true);
          return;
        }
        if (waveWait === 0) {
          waveWait = 4;
          notify("WAVE CLEARED · REINFORCEMENTS INBOUND", 4);
          health = Math.min(100, health + 25);
          ammo = 24;
        }
        waveWait -= dt;
        if (waveWait <= 0) {
          wave++;
          waveWait = 0;
          spawnWave();
        }
      }
    }
    for (const effect of [...effects]) {
      effect.life -= dt;
      effect.mesh.material.opacity = Math.max(0, effect.life / effect.max);
      if (effect.life <= 0) {
        world.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
        effects.splice(effects.indexOf(effect), 1);
      }
    }
    if (notifyTimer > 0) {
      notifyTimer -= dt;
      if (notifyTimer <= 0) $("gameNotification").textContent = "";
    }
    if (hitTimer > 0) {
      hitTimer -= dt;
      if (hitTimer <= 0) $("hitMarker").classList.remove("hit");
    }
    footTimer -= dt;
    if (p.grounded && p.moving > 1 && footTimer <= 0) {
      footTimer = input.sprint ? 0.25 : 0.38;
      soundEffect("step");
    }
    document.querySelector(".game-vignette").style.boxShadow =
      damage > 0 ? "inset 0 0 70px rgba(125,33,20," + damage + ")" : "";
    if (!reduced()) world.animate(elapsed, dt);
    updateCamera(dt);
    if (frameCount % 4 === 0) updateHud();
    render();
    raf = requestAnimationFrame(frame);
  }
  function finish(won) {
    setState(won ? "won" : "lost");
    cancelAnimationFrame(raf);
    keys.clear();
    firing = false;
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    if (won && mode === "parkour") {
      const best = storage.get(mode);
      if (!best || elapsed < best) storage.set(mode, Math.floor(elapsed));
    }
    if (mode === "shooter" && score > storage.get(mode))
      storage.set(mode, score);
    updateHud();
    setBest();
    render();
    setScreen(won ? "won" : "lost");
  }
  function pause() {
    if (state !== "playing") return;
    setState("paused");
    cancelAnimationFrame(raf);
    keys.clear();
    firing = aiming = false;
    drag = null;
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    setScreen("paused");
    audio?.suspend().catch(() => {});
  }
  function start() {
    if (!world || opening) return;
    if (state === "won" || state === "lost") reset();
    setState("playing");
    $("gameScreen").hidden = true;
    $("gameHud").hidden = false;
    $("pauseGame").hidden = false;
    $("touchControls").hidden = !touch;
    keys.clear();
    canvas.focus({ preventScroll: true });
    if (!touch && canvas.requestPointerLock) {
      try {
        const promise = canvas.requestPointerLock();
        promise?.catch(() =>
          notify("Mouse capture unavailable. Drag to look, or use I J K L", 5),
        );
      } catch {
        notify("Drag to look, or use I J K L", 5);
      }
    }
    if (sound) audio?.resume().catch(() => {});
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  function close() {
    cancelAnimationFrame(raf);
    setState("closed");
    keys.clear();
    firing = aiming = false;
    drag = null;
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    exitGameFullscreen().catch(() => {});
    audio?.suspend().catch(() => {});
    if (dialog.open) dialog.close();
    opener?.focus({ preventScroll: true });
  }
  async function open(id, source) {
    if (opening) return;
    opening = true;
    opener = source;
    mode = id;
    try {
      assets = await loadMaterials(renderer);
      if (world) {
        clearEffects();
        enemies.forEach(removeEnemy);
        enemies = [];
        world.dispose();
      }
      world = createWorld(mode, assets, renderer);
      viewScene.environment = assets.hdr;
      viewScene.environmentIntensity = 0.5;
      renderer.toneMappingExposure = mode === "parkour" ? 1.03 : 1.05;
      setState("menu");
      $("gameTitle").textContent = titles[mode];
      $("gameControlHint").textContent =
        instructions[mode].hint + " · IJKL keyboard look";
      $("touchPrimary").textContent = mode === "parkour" ? "Jump" : "Fire";
      $("touchReload").hidden = mode === "parkour";
      $("touchCrouch").hidden = mode === "parkour";
      if (!dialog.open) dialog.showModal();
      setScreen("menu");
      reset();
      setBest();
      resize();
      $("startGame").focus({ preventScroll: true });
    } finally {
      opening = false;
    }
  }
  function look(dx, dy) {
    if (state !== "playing") return;
    p.yaw -= dx * 0.0024;
    p.pitch = clamp(p.pitch - dy * 0.0024, -1.35, 1.35);
  }
  $("startGame").onclick = start;
  $("restartGame").onclick = () => {
    reset();
    start();
  };
  $("closeGame").onclick = close;
  $("pauseGame").onclick = pause;
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (isGameFullscreen()) {
      exitGameFullscreen().catch(() => {});
      if (state === "playing") pause();
      return;
    }
    if (state === "playing") pause();
    else close();
  });
  dialog.addEventListener("close", () => {
    if (state !== "closed") close();
  });
  $("soundToggle").onclick = () => {
    sound = !sound;
    updateSound();
    if (sound) soundEffect("signal");
    else audio?.suspend().catch(() => {});
  };
  $("qualityToggle").textContent = "Quality: " + (low ? "balanced" : "high");
  $("qualityToggle").onclick = () => {
    low = !low;
    $("qualityToggle").textContent = "Quality: " + (low ? "balanced" : "high");
    renderer.shadowMap.enabled = !low;
    renderer.shadowMap.needsUpdate = true;
    world?.scene.traverse((o) => {
      if (o.material) o.material.needsUpdate = true;
    });
    resize();
  };
  const gameShell = $("gameShell"),
    fullscreenButton = $("fullscreenToggle");
  function isGameFullscreen() {
    return (
      document.fullscreenElement === gameShell ||
      dialog.classList.contains("is-expanded")
    );
  }
  function syncFullscreen() {
    const expanded = isGameFullscreen();
    const label = expanded ? "Exit full screen" : "Enter full screen";
    fullscreenButton.setAttribute("aria-pressed", String(expanded));
    fullscreenButton.setAttribute("aria-label", label);
    fullscreenButton.title = label;
    resize();
  }
  async function exitGameFullscreen() {
    dialog.classList.remove("is-expanded");
    if (document.fullscreenElement === gameShell)
      await document.exitFullscreen();
    syncFullscreen();
  }
  fullscreenButton.onclick = async () => {
    fullscreenButton.disabled = true;
    try {
      if (isGameFullscreen()) {
        await exitGameFullscreen();
      } else {
        // Fullscreen must target an ordinary element, not the modal dialog.
        try {
          if (
            !gameShell.requestFullscreen ||
            document.fullscreenEnabled === false
          ) {
            dialog.classList.add("is-expanded");
          } else {
            await gameShell.requestFullscreen();
          }
        } catch {
          // Mobile browsers and embedded previews can still fill the viewport.
          if (dialog.open) dialog.classList.add("is-expanded");
        }
      }
    } finally {
      fullscreenButton.disabled = false;
      syncFullscreen();
    }
  };
  document.addEventListener("fullscreenchange", syncFullscreen);
  syncFullscreen();
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "playing") return;
    canvas.focus({ preventScroll: true });
    if (e.pointerType === "touch") {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    } else {
      if (document.pointerLockElement !== canvas) {
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      }
      if (e.button === 0 && mode === "shooter") {
        firing = true;
        fire();
      }
      if (e.button === 2) aiming = true;
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag && drag.id === e.pointerId) {
      look(
        (e.clientX - drag.x) * (touch ? 1.65 : 1),
        (e.clientY - drag.y) * (touch ? 1.65 : 1),
      );
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  });
  function releasePointer(e) {
    if (drag?.id === e.pointerId) drag = null;
    firing = false;
    aiming = false;
  }
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("lostpointercapture", releasePointer);
  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) look(e.movementX, e.movementY);
  });
  document.addEventListener("mouseup", () => {
    firing = aiming = false;
  });
  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement !== canvas && state === "playing") pause();
  });
  document.addEventListener("pointerlockerror", () => {
    if (state === "playing")
      notify("Drag to look, or use I J K L. Esc pauses.", 4);
  });
  const controlled = [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyI",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Space",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ShiftLeft",
    "ShiftRight",
    "KeyR",
    "KeyP",
    "KeyC",
  ];
  document.addEventListener("keydown", (e) => {
    if (state !== "playing" || !dialog.open) return;
    if (controlled.includes(e.code)) e.preventDefault();
    if (e.code === "Escape" || e.code === "KeyP") {
      pause();
      return;
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === "Space") primary();
    if (e.code === "KeyR") reloadWeapon();
  });
  document.addEventListener("keyup", (e) => keys.delete(e.code));
  document.querySelectorAll("#touchControls button").forEach((button) => {
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      if (button.dataset.key) keys.add(button.dataset.key);
      if (button.dataset.action === "primary") {
        primary();
        if (mode === "shooter") firing = true;
      }
      if (button.dataset.action === "reload") reloadWeapon();
    });
    const release = () => {
      if (button.dataset.key) keys.delete(button.dataset.key);
      if (button.dataset.action === "primary") firing = false;
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  addEventListener("blur", pause);
  new ResizeObserver(resize).observe(viewport);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    pause();
    $("gameScreenTitle").textContent = "Graphics interrupted.";
    $("gameScreenDescription").textContent =
      "The graphics context was lost. Close this experience and reload the page to restore it.";
    $("startGame").hidden = true;
  });
  return { open, close };
}
