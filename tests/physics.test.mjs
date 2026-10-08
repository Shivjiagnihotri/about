import assert from "node:assert/strict";
import { stepPlayer, jumpPlayer, rayBox } from "../js/physics.js";
import { ROOFTOPS as roofs } from "../js/level-data.js";
const dt = 1 / 120;
const box = (x, y, z, w, d) => ({
  minX: x - w / 2,
  maxX: x + w / 2,
  minY: -5,
  maxY: y,
  minZ: z - d / 2,
  maxZ: z + d / 2,
});
const ground = box(0, 0, 0, 40, 40);
function player() {
  return {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    jumps: 2,
    grounded: true,
  };
}
let p = player();
jumpPlayer(p, true);
let highest = 0;
for (let i = 0; i < 160; i++) {
  stepPlayer(p, {}, [ground], dt);
  highest = Math.max(highest, p.y);
}
assert(highest > 1.6);
assert.equal(p.y, 0);
assert.equal(p.grounded, true);
assert.equal(p.jumps, 2);
p = player();
assert(jumpPlayer(p, true));
assert(jumpPlayer(p, true));
assert(!jumpPlayer(p, true));
p = player();
const wall = { minX: -2, maxX: 2, minY: 0, maxY: 4, minZ: -5, maxZ: -4 };
for (let i = 0; i < 240; i++)
  stepPlayer(p, { forward: true }, [ground, wall], dt);
assert(p.z >= -3.69, "Player must not pass through cover");
assert.equal(rayBox({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, wall), 4);
assert.equal(
  rayBox({ x: 3, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, wall),
  Infinity,
);
assert.equal(
  rayBox({ x: 0, y: 5, z: 0 }, { x: 0, y: 0, z: -1 }, wall),
  Infinity,
);
// Exercise the shipped six-jump rooftop course, including diagonal and rising jumps.
const solids = roofs.map((r) => box(r.x, r.y, r.z, r.w, r.d));
for (let i = 1; i < roofs.length; i++) {
  const a = roofs[i - 1],
    b = roofs[i];
  p = { ...player(), x: a.x, y: a.y, z: a.z };
  let first = false,
    second = false,
    landed = false;
  for (let frame = 0; frame < 1000; frame++) {
    const dx = b.x - p.x,
      dz = b.z - p.z;
    p.yaw = Math.atan2(-dx, -dz);
    const distEdge = Math.min(
      a.w / 2 - Math.abs(p.x - a.x),
      a.d / 2 - Math.abs(p.z - a.z),
    );
    if (!first && distEdge < 1.1) {
      jumpPlayer(p, true);
      first = true;
    }
    if (first && !second && p.vy < 0.6) {
      jumpPlayer(p, true);
      second = true;
    }
    stepPlayer(p, { forward: true, sprint: true }, solids, dt);
    if (
      p.grounded &&
      Math.hypot(p.x - b.x, p.z - b.z) < Math.min(b.w, b.d) / 2 - 1 &&
      Math.abs(p.y - b.y) < 0.1
    ) {
      landed = true;
      break;
    }
    if (p.y < 5) break;
  }
  assert(
    landed,
    "Rooftop " + i + " must be reachable with sprint and double jump",
  );
}
console.log(
  "PASS: jump, landing, jump reset, air-jump limit, wall collisions, bullet occlusion, all 6 rooftop transitions.",
);
