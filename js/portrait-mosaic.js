export function initPortraitMosaic(canvas, control) {
  if (!canvas || !control) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const portrait = new Image();
  portrait.src = new URL("../assets/portrait.jpg", import.meta.url).href;
  let width = 0,
    height = 0,
    radius = 18,
    imageX = 0,
    imageY = 0,
    imageW = 1,
    imageH = 1;
  let px = 0.5,
    py = 0.5,
    time = 0,
    previous = 0,
    raf = 0;
  let active = false,
    held = false,
    visible = false;
  let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hex(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      if (!i) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radius = Math.max(12, Math.min(24, width / 17));
    if (portrait.naturalWidth) {
      const scale = Math.max(
        width / portrait.naturalWidth,
        height / portrait.naturalHeight,
      );
      imageW = portrait.naturalWidth * scale;
      imageH = portrait.naturalHeight * scale;
      imageX = (width - imageW) / 2;
      imageY = (height - imageH) / 2;
    }
    draw();
  }

  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const t = reduced ? 0 : time;
    const stepX = Math.sqrt(3) * radius,
      stepY = 1.5 * radius;
    const focusX = px * width,
      focusY = py * height;

    const space = ctx.createRadialGradient(
      width * 0.52,
      height * 0.49,
      0,
      width * 0.52,
      height * 0.49,
      width * 0.68,
    );
    space.addColorStop(0, "#102e54");
    space.addColorStop(0.56, "#0a1d33");
    space.addColorStop(1, "#070f1a");
    ctx.fillStyle = space;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width * 0.52, height * 0.49);
    ctx.rotate(-t * 0.025);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "rgba(70, 180, 255, .19)";
    for (let ring = 0; ring < 4; ring++) {
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        width * (0.18 + ring * 0.115),
        height * (0.12 + ring * 0.088),
        0,
        0.2 + ring * 0.45,
        4.3 + ring * 0.5,
      );
      ctx.stroke();
    }
    ctx.restore();

    for (let col = -1; col * stepX < width + radius; col++) {
      for (let row = -1; row * stepY < height + radius; row++) {
        const n0 = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
        const n1 = Math.sin(col * 269.5 + row * 183.3) * 24634.6345;
        const seed = n0 - Math.floor(n0),
          seedY = n1 - Math.floor(n1);
        const gx = col * stepX,
          gy = row * stepY + ((Math.abs(col) % 2) * stepY) / 2;
        const driftX =
          (seed - 0.5) * radius * 0.76 +
          (reduced
            ? 0
            : Math.sin(t * 0.65 + col * 0.67 + row * 0.39) * radius * 0.12);
        const driftY =
          (seedY - 0.5) * radius * 0.7 +
          (reduced
            ? 0
            : Math.cos(t * 0.4 + col * 0.39 - row * 0.53) * radius * 0.11);
        const x = gx + driftX,
          y = gy + driftY;
        const focus = active
          ? Math.max(0, 1 - Math.hypot(x - focusX, y - focusY) / (radius * 3.6))
          : 0;
        const settle = focus * 0.68,
          drawX = x - driftX * settle,
          drawY = y - driftY * settle;
        const turn =
          (seed - 0.5) * 0.25 * (1 - settle * 0.9) +
          (reduced ? 0 : Math.sin(t * 0.2 + row) * 0.018);
        const diagonal = ((col + row) % 2 ? -1 : 1) * (seed * 0.05 + 0.025);

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(turn + diagonal);
        hex(0, 0, radius * 0.94);
        ctx.clip();
        if (portrait.naturalWidth) {
          // Permanent gaps and rotations keep the scattered face from ever re-forming.
          ctx.filter =
            focus > 0.08
              ? `brightness(${1 + focus * 0.55}) saturate(${1.15 + focus * 0.75}) contrast(${1.08 + focus * 0.18})`
              : "brightness(.58) saturate(.72) contrast(1.08)";
          ctx.drawImage(portrait, imageX - gx, imageY - gy, imageW, imageH);
          ctx.filter = "none";
          ctx.fillStyle =
            focus > 0.05
              ? `rgba(76, 188, 255, ${0.11 - focus * 0.065})`
              : "rgba(4, 15, 28, .48)";
          ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = "rgba(48, 130, 203, .28)";
          ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        }
        ctx.restore();

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(turn + diagonal);
        hex(0, 0, radius * 0.9);
        ctx.strokeStyle =
          focus > 0.05
            ? `rgba(128, 229, 255, ${0.38 + focus * 0.58})`
            : "rgba(52, 142, 221, .45)";
        ctx.lineWidth = 0.55 + focus * 0.8;
        ctx.shadowColor = "#41bdff";
        ctx.shadowBlur = 2 + focus * 14;
        ctx.stroke();
        if ((col * 3 + row * 7) % 13 === 0) {
          ctx.fillStyle = `rgba(140, 230, 255, ${0.34 + 0.4 * Math.abs(Math.sin(t + seed * 14))})`;
          ctx.shadowBlur = 5 + focus * 9;
          ctx.beginPath();
          ctx.arc(0, 0, 0.8 + focus, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (active) {
      const glow = ctx.createRadialGradient(
        focusX,
        focusY,
        0,
        focusX,
        focusY,
        width * 0.29,
      );
      glow.addColorStop(0, "rgba(62, 174, 255, .17)");
      glow.addColorStop(1, "rgba(62, 174, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function frame(now) {
    raf = 0;
    if (!visible || reduced || document.hidden) return;
    time += Math.min((now - previous) / 1000, 0.05);
    previous = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (visible && !reduced && !document.hidden) {
      previous = performance.now();
      raf = requestAnimationFrame(frame);
    } else draw();
  }
  function move(event) {
    if (held) return;
    const box = control.getBoundingClientRect();
    px = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    py = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
    active = true;
    if (reduced || !raf) draw();
  }
  function clearFocus() {
    active = held;
    if (reduced || !raf) draw();
  }

  control.addEventListener("pointermove", move, { passive: true });
  control.addEventListener("pointerdown", move, { passive: true });
  control.addEventListener("pointerleave", clearFocus);
  control.addEventListener("click", () => {
    held = !held;
    active = held || control.matches(":hover");
    control.setAttribute("aria-pressed", String(held));
    control.setAttribute(
      "aria-label",
      held ? "Release portrait fragment focus" : "Focus the portrait fragments",
    );
    control.title = held
      ? "Focus held · activate again to release"
      : "Hover or tap the shards to focus them";
    if (reduced || !raf) draw();
  });
  control.addEventListener("focus", () => {
    active = true;
    if (!held) {
      px = 0.5;
      py = 0.5;
    }
    if (reduced || !raf) draw();
  });
  control.addEventListener("blur", () => {
    if (!held) clearFocus();
  });
  control.addEventListener("keydown", (event) => {
    const step = 0.065;
    if (event.key === "ArrowLeft") px = Math.max(0, px - step);
    else if (event.key === "ArrowRight") px = Math.min(1, px + step);
    else if (event.key === "ArrowUp") py = Math.max(0, py - step);
    else if (event.key === "ArrowDown") py = Math.min(1, py + step);
    else return;
    event.preventDefault();
    active = true;
    if (reduced || !raf) draw();
  });

  portrait.addEventListener("load", resize, { once: true });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  addEventListener("portfolio-motion", (event) => {
    reduced =
      event.detail || matchMedia("(prefers-reduced-motion: reduce)").matches;
    sync();
  });
  resize();
}
