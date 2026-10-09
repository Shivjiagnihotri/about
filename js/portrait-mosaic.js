// The historic export and element IDs stay stable; this field contains no photo.
export function initPortraitMosaic(canvas, control) {
  if (!canvas || !control) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  const backdrop = document.createElement("canvas");
  const scene = document.createElement("canvas");
  const base = backdrop.getContext("2d", { alpha: false });
  const art = scene.getContext("2d", { alpha: false });
  if (!ctx || !base || !art) return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const TAU = Math.PI * 2;
  let width = 0, height = 0, dpr = 1, radius = 18;
  let px = 0.5, py = 0.46, focusX = px, focusY = py;
  let time = 0, previous = 0, lastDraw = 0, raf = 0, intensity = 0;
  let active = false, held = false, visible = false;
  let reduced = motion.matches || document.body.classList.contains("motion-off");
  let cells = [];

  const random = (n) => {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  function glow(context, x, y, size, color) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(4, 16, 26, 0)");
    context.fillStyle = gradient;
    context.fillRect(x - size, y - size, size * 2, size * 2);
  }

  function star(context, x, y, size, opacity = 1) {
    context.save();
    context.translate(x, y);
    context.globalAlpha = opacity;
    context.fillStyle = "#d9f6e9";
    context.beginPath();
    context.moveTo(0, -size);
    context.quadraticCurveTo(size * 0.12, -size * 0.12, size, 0);
    context.quadraticCurveTo(size * 0.12, size * 0.12, 0, size);
    context.quadraticCurveTo(-size * 0.12, size * 0.12, -size, 0);
    context.quadraticCurveTo(-size * 0.12, -size * 0.12, 0, -size);
    context.fill();
    context.restore();
  }

  function fern(x, y, length, angle, color, leafColor) {
    base.save();
    base.translate(x, y);
    base.rotate(angle);
    base.strokeStyle = color;
    base.lineWidth = 1.4;
    base.beginPath();
    base.moveTo(0, 0);
    base.quadraticCurveTo(-length * 0.13, -length * 0.52, 0, -length);
    base.stroke();
    for (let i = 1; i < 13; i++) {
      const fraction = i / 13;
      const yy = -length * fraction;
      const xx = -Math.sin(fraction * Math.PI) * length * 0.066;
      const leaf = Math.sin(fraction * Math.PI) * length * 0.19;
      for (const side of [-1, 1]) {
        base.beginPath();
        base.moveTo(xx, yy);
        base.bezierCurveTo(xx + leaf * side * 0.6, yy + leaf * 0.05,
          xx + leaf * side, yy - leaf * 0.7, xx + leaf * side, yy - leaf * 0.95);
        base.bezierCurveTo(xx + leaf * side * 0.48, yy - leaf * 0.8,
          xx + leaf * side * 0.15, yy - leaf * 0.3, xx, yy);
        base.fillStyle = leafColor;
        base.fill();
      }
    }
    base.restore();
  }

  function paintBackdrop() {
    // A 600-unit coordinate space keeps the garden sharp at any size.
    const h = (height / width) * 600;
    base.setTransform(backdrop.width / 600, 0, 0, backdrop.width / 600, 0, 0);
    const night = base.createLinearGradient(0, 0, 600, h);
    night.addColorStop(0, "#061322");
    night.addColorStop(0.48, "#102e36");
    night.addColorStop(1, "#041f22");
    base.fillStyle = night;
    base.fillRect(0, 0, 600, h);
    glow(base, 370, h * 0.34, 290, "rgba(68, 126, 141, .29)");
    glow(base, 170, h * 0.66, 240, "rgba(54, 134, 108, .26)");
    glow(base, 440, h * 0.7, 180, "rgba(181, 142, 68, .1)");

    // Thin nested curves form a river-like nebula around the central planet.
    base.save();
    base.globalCompositeOperation = "screen";
    for (let i = 0; i < 34; i++) {
      const offset = (i - 17) * 3.1;
      base.beginPath();
      base.moveTo(-90, h * 0.77 + offset);
      base.bezierCurveTo(290, h * 0.79 + offset, 70, h * 0.24 - offset,
        360, h * 0.38 + offset * 0.8);
      base.bezierCurveTo(550, h * 0.5 + offset, 510, h * 0.18 + offset, 690, h * 0.16);
      base.strokeStyle = `rgba(102, 196, 174, ${0.016 + Math.sin((i / 34) * Math.PI) * 0.042})`;
      base.lineWidth = 1 + random(i) * 2;
      base.stroke();
    }
    base.restore();

    for (let i = 0; i < 205; i++) {
      const x = random(i + 1) * 600;
      const y = random(i + 405) * h * 0.91;
      const size = 0.25 + random(i + 925) * 1.25;
      base.fillStyle = i % 5 === 0 ? "rgba(232, 200, 135, .74)" : "rgba(195, 229, 224, .59)";
      base.beginPath();
      base.arc(x, y, size, 0, TAU);
      base.fill();
      if (i % 31 === 0) star(base, x, y, size * 4, 0.75);
    }

    const moonX = 345, moonY = h * 0.34, moonR = 73;
    glow(base, moonX, moonY, 125, "rgba(153, 206, 174, .18)");
    const planet = base.createRadialGradient(moonX - 26, moonY - 27, 3, moonX + 8, moonY + 5, 90);
    planet.addColorStop(0, "#d7dfb2");
    planet.addColorStop(0.45, "#94bba6");
    planet.addColorStop(0.79, "#2c625e");
    planet.addColorStop(1, "#0c3039");
    base.fillStyle = planet;
    base.beginPath();
    base.arc(moonX, moonY, moonR, 0, TAU);
    base.fill();
    base.save();
    base.clip();
    for (let i = 0; i < 36; i++) {
      const x = moonX + (random(i + 52) - 0.5) * 160;
      const y = moonY + (random(i + 92) - 0.5) * 160;
      glow(base, x, y, 3 + random(i + 81) * 15, "rgba(34, 87, 78, .18)");
    }
    const shadow = base.createLinearGradient(moonX - 22, moonY - 40, moonX + 65, moonY + 40);
    shadow.addColorStop(0, "rgba(5, 22, 34, 0)");
    shadow.addColorStop(0.55, "rgba(5, 22, 34, .35)");
    shadow.addColorStop(1, "rgba(5, 22, 34, .92)");
    base.fillStyle = shadow;
    base.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
    base.restore();

    for (let ring = 0; ring < 3; ring++) {
      base.beginPath();
      base.ellipse(moonX, moonY, 123 + ring * 27, 43 + ring * 14, -0.48, 0.17, 5.92);
      base.strokeStyle = ring === 0 ? "rgba(204, 189, 122, .48)" : "rgba(146, 202, 178, .2)";
      base.lineWidth = ring === 0 ? 1.3 : 0.6;
      base.stroke();
    }

    // Ferns grow into the star field, linking the garden to its imagined sky.
    fern(40, h + 14, h * 0.48, -0.19, "#3b7464", "#17493e");
    fern(-12, h * 0.92, h * 0.46, 0.47, "#438276", "#276455");
    fern(586, h + 15, h * 0.51, -0.46, "#498571", "#235745");
    fern(617, h * 0.85, h * 0.34, -0.75, "#54856f", "#387159");
    fern(105, h + 40, h * 0.29, 0.4, "#55907a", "#326954");
    fern(486, h + 33, h * 0.31, -0.23, "#4b846c", "#184a3d");

    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 60;
      const y = h * (0.8 + random(i + 620) * 0.13);
      base.strokeStyle = "rgba(148, 173, 111, .45)";
      base.lineWidth = 1;
      base.beginPath();
      base.moveTo(x + 15, h + 5);
      base.quadraticCurveTo(x - 12, y + 40, x, y);
      base.stroke();
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * TAU;
        base.fillStyle = "rgba(208, 175, 104, .7)";
        base.beginPath();
        base.ellipse(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4, 3.5, 1.8, angle, 0, TAU);
        base.fill();
      }
      glow(base, x, y, 15, "rgba(227, 186, 99, .13)");
    }
  }

  function bee(x, y, scale, angle, t) {
    art.save();
    art.translate(x, y);
    art.rotate(angle);
    art.scale(scale, scale);
    glow(art, 0, 0, 25, "rgba(234, 185, 84, .12)");
    const wing = reduced ? 1 : 0.68 + Math.abs(Math.sin(t * 17)) * 0.32;
    art.fillStyle = "rgba(205, 233, 217, .64)";
    for (const side of [-1, 1]) {
      art.beginPath();
      art.ellipse(-1, side * 6, 7, 3.2 * wing, side * 0.6, 0, TAU);
      art.fill();
    }
    art.fillStyle = "#e3bc69";
    art.beginPath();
    art.ellipse(0, 0, 7, 4.4, 0, 0, TAU);
    art.fill();
    art.save();
    art.clip();
    art.fillStyle = "#383c30";
    art.fillRect(-4, -5, 2.1, 10);
    art.fillRect(0, -5, 2.1, 10);
    art.restore();
    art.fillStyle = "#dcc993";
    art.beginPath();
    art.arc(7, 0, 2.6, 0, TAU);
    art.fill();
    art.restore();
  }

  function paintScene(t) {
    art.setTransform(1, 0, 0, 1, 0, 0);
    art.drawImage(backdrop, 0, 0);
    art.setTransform(scene.width / 600, 0, 0, scene.width / 600, 0, 0);
    const h = (height / width) * 600;
    for (let i = 0; i < 24; i++) {
      const x = random(i + 611) * 600 + Math.sin(t * 0.3 + i) * 8;
      const y = h * (0.44 + random(i + 711) * 0.44) + Math.cos(t * 0.22 + i) * 7;
      const alpha = 0.2 + (Math.sin(t * 0.7 + i) + 1) * 0.19;
      art.fillStyle = `rgba(231, 199, 125, ${alpha})`;
      art.beginPath();
      art.arc(x, y, 0.7 + random(i + 99), 0, TAU);
      art.fill();
    }
    const orbit = t * 0.085 + 2.6;
    const ox = Math.cos(orbit) * 123, oy = Math.sin(orbit) * 43;
    const sx = 345 + ox * Math.cos(-0.48) - oy * Math.sin(-0.48);
    const sy = h * 0.34 + ox * Math.sin(-0.48) + oy * Math.cos(-0.48);
    glow(art, sx, sy, 15, "rgba(234, 208, 139, .32)");
    star(art, sx, sy, 5, 0.95);
    bee(225 + Math.sin(t * 0.31) * 28, h * 0.55 + Math.cos(t * 0.4) * 15, 1.15, -0.3, t);
    bee(405 + Math.cos(t * 0.26 + 2) * 23, h * 0.69 + Math.sin(t * 0.35) * 18, 0.85, -0.75, t + 0.5);
    bee(145 + Math.cos(t * 0.19) * 19, h * 0.76 + Math.sin(t * 0.32 + 3) * 14, 0.7, 0.27, t + 0.9);
  }

  function hex(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      const xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r;
      if (!i) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.closePath();
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    if (!width || !height) return;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    for (const surface of [canvas, backdrop, scene]) {
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radius = Math.max(12, Math.min(24, width / 17));
    const stepX = Math.sqrt(3) * radius, stepY = 1.5 * radius;
    cells = [];
    for (let row = -1; row * stepY < height + radius; row++) {
      for (let col = -1; col * stepX < width + radius; col++) {
        cells.push({
          x: col * stepX + ((Math.abs(row) % 2) * stepX) / 2,
          y: row * stepY,
          seed: random(col * 13 + row * 291),
          seedY: random(col * 71 + row * 193),
        });
      }
    }
    paintBackdrop();
    draw();
  }

  function draw() {
    if (!width || !height) return;
    const t = reduced ? 0 : time;
    paintScene(t);
    ctx.fillStyle = "#071923";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.22;
    ctx.drawImage(scene, 0, 0, width, height);
    ctx.globalAlpha = 1;
    for (const cell of cells) {
      const { x: gx, y: gy, seed, seedY } = cell;
      const driftX = (seed - 0.5) * radius * 0.42 + Math.sin(t * 0.42 + seed * 15) * radius * 0.06;
      const driftY = (seedY - 0.5) * radius * 0.4 + Math.cos(t * 0.33 + seedY * 15) * radius * 0.07;
      const distance = Math.hypot(gx - focusX * width, gy - focusY * height);
      const focus = intensity * Math.max(0, 1 - distance / (radius * 4.7));
      const settle = focus * 0.93;
      const drawX = gx + driftX * (1 - settle);
      const drawY = gy + driftY * (1 - settle);
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate((seed - 0.5) * 0.14 * (1 - settle));
      hex(0, 0, radius * (0.945 + focus * 0.045));
      ctx.save();
      ctx.clip();
      ctx.drawImage(scene, -gx, -gy, width, height);
      ctx.fillStyle = `rgba(5, 20, 29, ${0.22 * (1 - focus)})`;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.strokeStyle = focus > 0.04
        ? `rgba(213, 213, 147, ${0.18 + focus * 0.55})`
        : `rgba(111, 173, 157, ${0.08 + seed * 0.09})`;
      ctx.lineWidth = 0.5 + focus * 0.45;
      ctx.stroke();
      ctx.restore();
    }
    if (intensity > 0.01) {
      glow(ctx, focusX * width, focusY * height, radius * 5,
        `rgba(157, 213, 183, ${intensity * 0.075})`);
    }
  }

  function frame(now) {
    raf = 0;
    if (!visible || reduced || document.hidden) return;
    const delta = Math.min((now - previous) / 1000, 0.05);
    time += delta;
    previous = now;
    const ease = 1 - Math.exp(-delta * 10);
    focusX += (px - focusX) * ease;
    focusY += (py - focusY) * ease;
    intensity += ((active ? 1 : 0) - intensity) * ease;
    // Cap artwork at 30fps while input interpolation stays frame-smooth.
    if (now - lastDraw >= 1000 / 30) {
      draw();
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  }

  function refresh() {
    if (reduced || !raf) {
      focusX = px;
      focusY = py;
      intensity = active ? 1 : 0;
      draw();
    }
  }

  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (visible && !reduced && !document.hidden) {
      previous = performance.now();
      lastDraw = 0;
      raf = requestAnimationFrame(frame);
    } else refresh();
  }

  function move(event) {
    if (held) return;
    const box = control.getBoundingClientRect();
    if (!box.width || !box.height) return;
    px = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    py = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
    active = true;
    refresh();
  }

  function clearFocus() {
    active = held || control.matches(":focus-visible");
    refresh();
  }

  control.addEventListener("pointermove", move, { passive: true });
  control.addEventListener("pointerdown", move, { passive: true });
  control.addEventListener("pointerleave", clearFocus);
  control.addEventListener("click", () => {
    held = !held;
    active = held || control.matches(":hover") || control.matches(":focus-visible");
    control.setAttribute("aria-pressed", String(held));
    control.setAttribute("aria-label", held ? "Release celestial garden focus" : "Explore the celestial garden");
    control.title = held ? "Focus held; activate again to release" : "Hover or tap to explore the celestial garden";
    refresh();
  });
  control.addEventListener("focus", () => {
    active = true;
    if (!held) { px = 0.5; py = 0.46; }
    refresh();
  });
  control.addEventListener("blur", clearFocus);
  control.addEventListener("keydown", (event) => {
    const step = 0.065;
    if (event.key === "ArrowLeft") px = Math.max(0, px - step);
    else if (event.key === "ArrowRight") px = Math.min(1, px + step);
    else if (event.key === "ArrowUp") py = Math.max(0, py - step);
    else if (event.key === "ArrowDown") py = Math.min(1, py + step);
    else return;
    event.preventDefault();
    active = true;
    refresh();
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", (event) => {
    reduced = event.matches || document.body.classList.contains("motion-off");
    sync();
  });
  addEventListener("portfolio-motion", (event) => {
    reduced = Boolean(event.detail) || motion.matches;
    sync();
  });
  resize();
}
