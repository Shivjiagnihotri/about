// A lightweight, depth-sorted point sculpture. No graphics library on the landing page.
export function initNeural(canvas, initialReduced = false) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const coarse = matchMedia("(pointer:coarse)").matches;
  const points = [],
    segments = coarse ? 150 : 220,
    rings = 20;
  const curve = (t) => [
    (2 + 0.72 * Math.cos(3 * t)) * Math.cos(2 * t),
    (2 + 0.72 * Math.cos(3 * t)) * Math.sin(2 * t),
    0.9 * Math.sin(3 * t),
  ];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2,
      p = curve(t),
      n = curve(t + 0.001);
    let tangent = n.map((v, j) => v - p[j]);
    const tl = Math.hypot(...tangent);
    tangent = tangent.map((v) => v / tl);
    let u = [-tangent[1], tangent[0], 0];
    const ul = Math.hypot(...u);
    u = u.map((v) => v / ul);
    const v = [
      tangent[1] * u[2] - tangent[2] * u[1],
      tangent[2] * u[0] - tangent[0] * u[2],
      tangent[0] * u[1] - tangent[1] * u[0],
    ];
    for (let j = 0; j < rings; j++) {
      const a = (j / rings) * Math.PI * 2;
      points.push({
        p: p.map(
          (n, k) => n + 0.43 * (u[k] * Math.cos(a) + v[k] * Math.sin(a)),
        ),
        gold: Math.sin(t * 2 + 0.6) > 0.63,
        i: i * rings + j,
      });
    }
  }
  let width = 1,
    height = 1,
    visible = true,
    reduced = initialReduced,
    raf = 0,
    last = 0,
    angle = 0.6,
    mx = 0,
    my = 0,
    px = 0,
    py = 0;
  function size() {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * d);
    canvas.height = Math.round(height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cx = width * 0.5,
      cy = height * 0.5,
      scale = Math.min(width, height) * 0.15;
    ctx.strokeStyle = "#90947d20";
    ctx.lineWidth = 0.7;
    for (const radius of [1.2, 1.45]) {
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        scale * 3.0 * radius,
        scale * 0.82 * radius,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    const ay = angle + px * 0.25,
      ax = 0.8 + py * 0.2,
      cyaw = Math.cos(ay),
      syaw = Math.sin(ay),
      cp = Math.cos(ax),
      sp = Math.sin(ax);
    const projected = points
      .map((point) => {
        const p = point.p,
          x = p[0] * cyaw + p[2] * syaw,
          z = -p[0] * syaw + p[2] * cyaw,
          y = p[1] * cp - z * sp,
          zz = p[1] * sp + z * cp;
        const perspective = 7 / (7 - zz);
        return {
          x: cx + x * scale * perspective,
          y: cy + y * scale * perspective,
          z: zz,
          size: perspective * 0.92,
          point,
        };
      })
      .sort((a, b) => a.z - b.z);
    for (const p of projected) {
      const alpha = 0.24 + ((p.z + 3.5) / 7) * 0.65;
      ctx.fillStyle = p.point.gold
        ? "rgba(169,115,46," + alpha + ")"
        : "rgba(38,48,34," + alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.55, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#bd965a";
    for (let i = 0; i < 7; i++) {
      const p = projected[(i * 631 + 150) % projected.length];
      ctx.fillRect(p.x - 1.6, p.y - 1.6, 3.2, 3.2);
    }
  }
  function frame(time) {
    raf = 0;
    if (!visible || reduced || document.hidden) return;
    const dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    angle += dt * 0.1;
    px += (mx - px) * 0.05;
    py += (my - py) * 0.05;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (visible && !reduced && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else draw();
  }
  canvas.addEventListener(
    "pointermove",
    (e) => {
      const r = canvas.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    },
    { passive: true },
  );
  canvas.addEventListener("pointerleave", () => {
    mx = my = 0;
  });
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  addEventListener("portfolio-motion", (e) => {
    reduced = e.detail;
    sync();
  });
  size();
  sync();
}
