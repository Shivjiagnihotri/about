export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function overlapsBody(x, y, z, box, r = 0.32, height = 1.72) {
  return (
    x + r > box.minX &&
    x - r < box.maxX &&
    z + r > box.minZ &&
    z - r < box.maxZ &&
    y + height > box.minY + 0.04 &&
    y < box.maxY - 0.08
  );
}
export function stepPlayer(p, input, colliders, dt) {
  dt = Math.min(dt, 0.035);
  let strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0),
    forward = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
  const length = Math.hypot(strafe, forward) || 1;
  strafe /= length;
  forward /= length;
  const speed = input.crouch ? 2.6 : input.sprint ? 9.5 : 5.3,
    blend = 1 - Math.exp(-14 * dt);
  p.vx +=
    ((strafe * Math.cos(p.yaw) - forward * Math.sin(p.yaw)) * speed - p.vx) *
    blend;
  p.vz +=
    ((-strafe * Math.sin(p.yaw) - forward * Math.cos(p.yaw)) * speed - p.vz) *
    blend;
  const x = p.x + p.vx * dt;
  if (!colliders.some((b) => overlapsBody(x, p.y, p.z, b))) p.x = x;
  else p.vx = 0;
  const z = p.z + p.vz * dt;
  if (!colliders.some((b) => overlapsBody(p.x, p.y, z, b))) p.z = z;
  else p.vz = 0;
  const oldY = p.y;
  p.vy -= 20 * dt;
  p.y += p.vy * dt;
  p.grounded = false;
  for (const b of colliders) {
    if (
      p.x + 0.22 < b.minX ||
      p.x - 0.22 > b.maxX ||
      p.z + 0.22 < b.minZ ||
      p.z - 0.22 > b.maxZ
    )
      continue;
    if (p.vy <= 0 && oldY >= b.maxY - 0.12 && p.y <= b.maxY) {
      p.y = b.maxY;
      p.vy = 0;
      p.grounded = true;
      p.jumps = 2;
    } else if (
      p.vy > 0 &&
      oldY + 1.72 <= b.minY + 0.03 &&
      p.y + 1.72 >= b.minY
    ) {
      p.y = b.minY - 1.73;
      p.vy = 0;
    }
  }
  p.moving = Math.hypot(p.vx, p.vz);
}
export function jumpPlayer(p, parkour = true) {
  if (p.grounded || (parkour && p.jumps > 0)) {
    p.vy = 8.3;
    p.jumps = Math.max(0, p.jumps - 1);
    p.grounded = false;
    return true;
  }
  return false;
}
export function rayBox(origin, direction, box, maxDistance = Infinity) {
  let near = 0,
    far = maxDistance;
  for (const [axis, min, max] of [
    ["x", "minX", "maxX"],
    ["y", "minY", "maxY"],
    ["z", "minZ", "maxZ"],
  ]) {
    if (Math.abs(direction[axis]) < 1e-8) {
      if (origin[axis] < box[min] || origin[axis] > box[max]) return Infinity;
      continue;
    }
    let a = (box[min] - origin[axis]) / direction[axis],
      b = (box[max] - origin[axis]) / direction[axis];
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far) return Infinity;
  }
  return near;
}
