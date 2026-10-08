import * as THREE from "../assets/vendor/three.module.min.js";
import { RGBELoader } from "../assets/vendor/RGBELoader.js";
import { RoundedBoxGeometry } from "../assets/vendor/RoundedBoxGeometry.js";

export { THREE };
import { ROOFTOPS } from "./level-data.js";
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const sphereGeo = new THREE.SphereGeometry(0.5, 24, 16);
const domeGeo = new THREE.SphereGeometry(
  0.5,
  40,
  24,
  0,
  Math.PI * 2,
  0,
  Math.PI / 2,
);
const roofGeo = new THREE.ConeGeometry(0.707, 1, 4);
const assetsURL = new URL("../assets/textures/", import.meta.url);
let texturePromise;
export function loadMaterials(renderer) {
  if (texturePromise) return texturePromise;
  texturePromise = (async () => {
    const loader = new THREE.TextureLoader();
    const bundles = {};
    await Promise.all(
      ["bricks", "concrete", "asphalt"].map(async (name) => {
        const maps = await Promise.all(
          ["color", "normalgl", "roughness"].map((kind) =>
            loader.loadAsync(
              new URL(name + "-" + kind + ".webp", assetsURL).href,
            ),
          ),
        );
        maps.forEach((t, i) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(
            name === "asphalt" ? 16 : name === "bricks" ? 10 : 4,
            name === "asphalt" ? 16 : name === "bricks" ? 12 : 4,
          );
          t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          if (i === 0) t.colorSpace = THREE.SRGBColorSpace;
        });
        bundles[name] = {
          map: maps[0],
          normalMap: maps[1],
          roughnessMap: maps[2],
        };
      }),
    );
    let hdr = null;
    try {
      hdr = await new RGBELoader().loadAsync(
        new URL("venice_sunset_1k.hdr", assetsURL).href,
      );
      hdr.mapping = THREE.EquirectangularReflectionMapping;
    } catch (error) {
      console.warn("Sky unavailable; using atmosphere fallback.", error);
    }
    return { bundles, hdr };
  })().catch((error) => {
    texturePromise = null;
    throw error;
  });
  return texturePromise;
}
function mat(color, other = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...other });
}
export function createWorld(mode, assets, renderer) {
  const scene = new THREE.Scene();
  const warm = mode === "parkour";
  scene.background = assets.hdr || new THREE.Color(warm ? 0xc0bcaa : 0x8a9aa1);
  if (assets.hdr) {
    scene.environment = assets.hdr;
    scene.environmentIntensity = warm ? 0.4 : 0.32;
    scene.backgroundIntensity = warm ? 0.38 : 0.53;
    scene.backgroundRotation.y = warm ? 1.5 : 0.7;
  }
  scene.fog = new THREE.FogExp2(
    warm ? 0xb8b3a2 : 0x8a9595,
    warm ? 0.0055 : 0.009,
  );
  scene.add(
    new THREE.HemisphereLight(
      warm ? 0xffeed1 : 0xbed6e1,
      0x38443b,
      warm ? 1.4 : 1.45,
    ),
  );
  const sun = new THREE.DirectionalLight(
    warm ? 0xffdcaa : 0xffe3bf,
    warm ? 3.1 : 2.1,
  );
  sun.position.set(-35, 65, warm ? -35 : 20);
  sun.target.position.set(0, 0, warm ? -38 : 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -83,
    right: 83,
    top: 83,
    bottom: -83,
    near: 1,
    far: 180,
  });
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  const materials = {
    brick: mat(warm ? 0xc6ab8e : 0x847b6d, {
      ...assets.bundles.bricks,
      normalScale: new THREE.Vector2(0.5, 0.5),
    }),
    plaster: mat(warm ? 0xc8c0a7 : 0xb5b4a5, {
      ...assets.bundles.concrete,
      normalScale: new THREE.Vector2(0.5, 0.5),
    }),
    concrete: mat(0x96968b, {
      ...assets.bundles.concrete,
      normalScale: new THREE.Vector2(0.75, 0.75),
    }),
    road: mat(0x909589, {
      ...assets.bundles.asphalt,
      roughness: warm ? 0.94 : 0.58,
      normalScale: new THREE.Vector2(0.35, 0.35),
    }),
    dark: mat(0x222f30, { metalness: 0.5, roughness: 0.43 }),
    trim: mat(warm ? 0xbcb79f : 0x8d948d, { roughness: 0.82 }),
    glass: mat(warm ? 0x263c3b : 0x273941, { metalness: 0.8, roughness: 0.2 }),
    window: mat(0xd8bb7e, {
      emissive: 0xbb7f31,
      emissiveIntensity: 0.18,
      roughness: 0.4,
    }),
    metal: mat(0x677474, { metalness: 0.78, roughness: 0.38 }),
    rust: mat(0x77734e, { metalness: 0.35, roughness: 0.65 }),
    roof: mat(0x8c664b, {
      ...assets.bundles.bricks,
      normalScale: new THREE.Vector2(0.35, 0.35),
    }),
    yellow: mat(0xe1c68c, { roughness: 0.75 }),
    foliage: mat(0x626d45, { roughness: 1 }),
    glow: mat(0xf4d38b, { emissive: 0xffb52d, emissiveIntensity: 3 }),
    red: mat(0xbe6c4e, { emissive: 0xe84924, emissiveIntensity: 1 }),
  };
  let seed = mode === "parkour" ? 9143 : 5191;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const batches = new Map(),
    colliders = [],
    beacons = [],
    props = [],
    drones = [],
    effects = [];
  function shape(
    kind,
    material,
    x,
    y,
    z,
    w,
    h,
    d,
    rotation = 0,
    collision = false,
  ) {
    const key = kind + ":" + material;
    if (!batches.has(key))
      batches.set(key, {
        geo:
          kind === "cylinder"
            ? cylinderGeo
            : kind === "sphere"
              ? sphereGeo
              : kind === "dome"
                ? domeGeo
                : kind === "roof"
                  ? roofGeo
                  : boxGeo,
        material: materials[material],
        items: [],
      });
    const object = new THREE.Object3D();
    object.position.set(x, y, z);
    object.scale.set(w, h, d);
    object.rotation.y = rotation;
    object.updateMatrix();
    batches.get(key).items.push(object.matrix.clone());
    if (collision)
      colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
      });
  }
  function box(material, x, y, z, w, h, d, collision = false) {
    shape("box", material, x, y, z, w, h, d, 0, collision);
  }
  function cylinder(material, x, y, z, w, h, d = w) {
    shape("cylinder", material, x, y, z, w, h, d);
  }
  function building(x, z, w, d, h, index, detailed = true, solid = true) {
    const material = index % 3 === 0 ? "brick" : "plaster";
    box(material, x, h / 2 - 2, z, w, h + 4, d, solid);
    box("trim", x, h - 0.25, z, w + 0.4, 0.5, d + 0.4);
    box("concrete", x, 0.3, z, w + 0.2, 0.6, d + 0.2);
    for (const side of [-1, 1]) {
      box(
        "trim",
        x + side * (w / 2 - 0.17),
        h / 2,
        z + d / 2 + 0.03,
        0.24,
        h,
        0.1,
      );
      box(
        "trim",
        x + side * (w / 2 - 0.17),
        h / 2,
        z - d / 2 - 0.03,
        0.24,
        h,
        0.1,
      );
    }
    if (!detailed && warm)
      shape("roof", "roof", x, h + 1.4, z, w + 1, 2.8, d + 1, Math.PI / 4);
    box("concrete", x, h + 0.08, z, w, 0.16, d);
    if (detailed) {
      const spacing = 2.7;
      for (let level = 2; level < h - 1.3; level += 3.1) {
        if (level > 3.5)
          box("trim", x, level - 1.5, z, w + 0.12, 0.11, d + 0.12);
        for (let side of [-1, 1]) {
          for (let wx = -w / 2 + 1.4; wx < w / 2 - 0.6; wx += spacing) {
            box(
              "dark",
              x + wx,
              level,
              z + side * (d / 2 + 0.025),
              1.25,
              1.8,
              0.13,
            );
            box(
              random() > 0.94 ? "window" : "glass",
              x + wx,
              level,
              z + side * (d / 2 + 0.105),
              0.98,
              1.48,
              0.045,
            );
            box(
              "trim",
              x + wx,
              level - 0.86,
              z + side * (d / 2 + 0.14),
              1.46,
              0.12,
              0.32,
            );
            box(
              "metal",
              x + wx,
              level,
              z + side * (d / 2 + 0.15),
              0.04,
              1.5,
              0.025,
            );
          }
          for (let wz = -d / 2 + 1.4; wz < d / 2 - 0.6; wz += spacing) {
            box(
              "dark",
              x + side * (w / 2 + 0.025),
              level,
              z + wz,
              0.13,
              1.8,
              1.25,
            );
            box(
              "glass",
              x + side * (w / 2 + 0.105),
              level,
              z + wz,
              0.045,
              1.48,
              0.98,
            );
          }
        }
      }
      // Roof equipment, antennas, pipes, and a water tank give the skyline scale.
      box("metal", x + w * 0.27, h + 0.45, z + d * 0.25, 1.6, 0.75, 1.8);
      for (let i = 0; i < 6; i++)
        box(
          "dark",
          x + w * 0.27 - 0.6 + i * 0.24,
          h + 0.84,
          z + d * 0.25,
          0.08,
          0.025,
          1.45,
        );
      cylinder("metal", x - w * 0.28, h + 1.7, z + d * 0.29, 0.06, 3.2);
      box("metal", x - w * 0.28, h + 2.8, z + d * 0.29, 1.8, 0.035, 0.035);
      if (index % 4 === 0) {
        cylinder("rust", x - w * 0.2, h + 1.2, z - d * 0.2, 1.5, 2);
        box("metal", x - w * 0.2, h + 0.1, z - d * 0.2, 1.8, 0.2, 1.8);
      }
    }
  }
  function plant(x, y, z) {
    cylinder("concrete", x, y + 0.28, z, 0.6, 0.55);
    shape("sphere", "foliage", x, y + 0.9, z, 1.3, 1.5, 1.3);
    cylinder("rust", x, y + 0.6, z, 0.12, 0.8);
  }
  let platforms = [];
  if (warm) {
    platforms = ROOFTOPS.map((roof) => ({ ...roof }));
    box("road", 0, -4.3, -40, 190, 0.6, 240, true);
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      building(p.x, p.z, p.w, p.d, p.y, i, true, true);
      // Clear central landing routes; low edges and side details remain traversable.
      box("trim", p.x - p.w / 2 + 0.15, p.y + 0.3, p.z, 0.3, 0.6, p.d);
      box("trim", p.x + p.w / 2 - 0.15, p.y + 0.3, p.z, 0.3, 0.6, p.d);
      box("yellow", p.x, p.y + 0.17, p.z + p.d / 2 - 0.6, 1.5, 0.025, 0.12);
      plant(p.x - p.w * 0.31, p.y, p.z + p.d * 0.27);
      if (i > 0) {
        const group = new THREE.Group();
        group.position.set(p.x, p.y + 1.65, p.z);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.57, 0.028, 10, 44),
          materials.glow,
        );
        group.add(ring);
        const inner = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.22),
          materials.glow,
        );
        group.add(inner);
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.025, 40),
          new THREE.MeshBasicMaterial({
            color: 0xf0bd62,
            transparent: true,
            opacity: 0.42,
          }),
        );
        disc.position.y = -1.53;
        group.add(disc);
        scene.add(group);
        beacons.push({ group, ring, inner, roof: p, active: true });
      }
    }
    // Surrounding city is hand-composed around the playable route.
    for (let row = 0; row < 8; row++)
      for (let side of [-1, 1]) {
        const x = side * (36 + random() * 13),
          z = 18 - row * 19;
        building(
          x,
          z,
          10 + random() * 7,
          10 + random() * 7,
          9 + random() * 24,
          row + side + 10,
          true,
          true,
        );
        building(
          x + side * 25,
          z + 4,
          12 + random() * 6,
          14 + random() * 6,
          10 + random() * 28,
          row + 20,
          false,
          false,
        );
      }
    for (let i = 0; i < 8; i++)
      building(-60 + i * 18, -142, 12, 15, 20 + random() * 30, i, false, false);
    // Rooftop signal mast at the finish.
    cylinder("metal", -14, 23, -90, 0.15, 8);
    box("yellow", -12.3, 26, -90, 3.3, 1.1, 0.04);
    // A domed civic landmark anchors the historic roofline.
    cylinder("plaster", 49, 24, -94, 16, 28);
    cylinder("trim", 49, 37.7, -94, 17, 0.8);
    shape("dome", "roof", 49, 38, -94, 17, 21, 17);
    cylinder("trim", 49, 49.5, -94, 2.2, 3);
    shape("dome", "roof", 49, 51, -94, 3, 3, 3);
    cylinder("metal", 49, 53, -94, 0.1, 2);
    for (let n = 0; n < 16; n++) {
      const a = (n / 16) * Math.PI * 2;
      shape(
        "box",
        "dark",
        49 + Math.sin(a) * 8.01,
        34,
        -94 + Math.cos(a) * 8.01,
        1,
        3.5,
        0.13,
        a,
      );
    }
    building(-43, -88, 8, 8, 43, 4, true, true);
    shape("roof", "roof", -43, 48, -88, 9, 10, 9, Math.PI / 4);
  } else {
    box("road", 0, -0.35, 0, 90, 0.7, 90, true);
    // Four blocks frame a playable central boulevard.
    for (let i = 0; i < 5; i++)
      for (const side of [-1, 1]) {
        building(
          side * 32,
          -30 + i * 15,
          15,
          12,
          15 + random() * 18,
          i,
          true,
          true,
        );
        building(
          -30 + i * 15,
          side * 37,
          12,
          13,
          18 + random() * 15,
          i + 2,
          true,
          true,
        );
      }
    for (let i = -6; i <= 6; i++) {
      box("yellow", 0, 0.012, i * 5, 0.15, 0.025, 2.6);
      box("trim", -25, 0.1, i * 5, 2, 0.2, 4.9);
      box("trim", 25, 0.1, i * 5, 2, 0.2, 4.9);
    }
    // Shipping containers, concrete barricades, timber crates and sandbags.
    const covers = [
      [-9, 3, 5, 2.3, 3],
      [10, -9, 6, 2.7, 3],
      [-13, -14, 4, 1.25, 2],
      [9, 13, 4, 1.3, 2],
      [0, -21, 7, 1.2, 2],
      [-6, 21, 4, 1.1, 2],
      [19, -1, 3, 1.5, 3],
    ];
    covers.forEach(([x, z, w, h, d], i) => {
      box(i < 2 ? "rust" : "concrete", x, h / 2, z, w, h, d, true);
      box("metal", x, h + 0.035, z, w + 0.08, 0.07, d + 0.08);
      if (i < 2)
        for (let rx = -w / 2 + 0.1; rx < w / 2; rx += 0.38)
          box("metal", x + rx, h / 2, z + d / 2 + 0.025, 0.045, h, 0.06);
      else
        for (let n = 0; n < 4; n++) {
          box(
            "yellow",
            x - w / 2 + 0.5 + n * 0.9,
            h * 0.55,
            z + d / 2 + 0.02,
            0.38,
            0.16,
            0.025,
          );
        }
    });
    for (const [x, z] of [
      [-17, 9],
      [15, -19],
      [-18, -22],
      [18, 20],
    ]) {
      box("rust", x, 0.7, z, 1.5, 1.4, 1.5, true);
      for (const dx of [-0.58, 0.58])
        box("dark", x + dx, 0.7, z + 0.77, 0.07, 1.4, 0.045);
      for (let k = 0; k < 3; k++)
        cylinder("metal", x + 2 + k * 0.72, 0.6, z, 0.6, 1.2);
    }
    for (let side of [-1, 1])
      for (let z = -24; z <= 24; z += 16) {
        cylinder("metal", side * 23, 3.8, z, 0.11, 7.6);
        box("metal", side * 22.3, 7.5, z, 1.6, 0.12, 0.13);
        box("window", side * 21.6, 7.4, z, 0.6, 0.12, 0.4);
      }
    box("concrete", 0, 1.5, -32, 60, 3, 1, true);
    box("concrete", 0, 1.5, 32, 60, 3, 1, true);
    box("concrete", -28, 1.5, 0, 1, 3, 64, true);
    box("concrete", 28, 1.5, 0, 1, 3, 64, true);
    // Overhead service cable across the road.
    const cablePoints = [];
    for (let i = 0; i <= 20; i++)
      cablePoints.push(
        new THREE.Vector3(
          -26 + i * 2.6,
          9 - Math.sin((i / 20) * Math.PI) * 2,
          -12,
        ),
      );
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(cablePoints),
        new THREE.LineBasicMaterial({ color: 0x222d2b }),
      ),
    );
  }
  const staticMeshes = [];
  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(
      batch.geo,
      batch.material,
      batch.items.length,
    );
    batch.items.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    staticMeshes.push(mesh);
  }
  const dustCount = warm ? 160 : 380;
  const particlePositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    particlePositions[i * 3] = (random() - 0.5) * 80;
    particlePositions[i * 3 + 1] = random() * 35;
    particlePositions[i * 3 + 2] = (random() - 0.5) * 100 - (warm ? 35 : 0);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3),
  );
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: warm ? 0xf6d7a0 : 0xd2e3df,
      size: warm ? 0.045 : 0.035,
      transparent: true,
      opacity: warm ? 0.6 : 0.35,
      depthWrite: false,
    }),
  );
  scene.add(particles);
  // Signal names are original; no proprietary game assets are used.
  function animate(time, dt) {
    beacons.forEach((b, i) => {
      if (!b.active) return;
      b.ring.rotation.y = time * 0.8;
      b.inner.rotation.y = -time;
      b.inner.rotation.z = time * 0.5;
      b.group.position.y = b.roof.y + 1.7 + Math.sin(time * 2 + i) * 0.12;
    });
    if (!warm) {
      for (let i = 0; i < dustCount; i++) {
        particlePositions[i * 3 + 1] -= dt * 7;
        if (particlePositions[i * 3 + 1] < 0) particlePositions[i * 3 + 1] = 35;
      }
      particleGeometry.attributes.position.needsUpdate = true;
    }
  }
  function dispose() {
    const geos = new Set(),
      mats = new Set();
    scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (
        o.geometry &&
        ![boxGeo, cylinderGeo, sphereGeo, domeGeo, roofGeo].includes(o.geometry)
      )
        geos.add(o.geometry);
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          mats.add(m),
        );
      }
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    sun.shadow.map?.dispose();
  }
  const spawn = warm ? { x: 0, y: 12, z: 3 } : { x: 0, y: 0, z: 20 };
  return {
    scene,
    sun,
    materials,
    colliders,
    beacons,
    platforms,
    spawn,
    animate,
    dispose,
    staticMeshes,
    random,
  };
}
export function createDrone(materials) {
  const group = new THREE.Group();
  function add(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }
  add(sphereGeo, materials.dark, 0, 0, 0, 1.15, 0.56, 0.9);
  add(boxGeo, materials.metal, 0, 0.12, 0, 0.52, 0.2, 0.64);
  add(sphereGeo, materials.red, 0, -0.03, 0.45, 0.19, 0.19, 0.13);
  const rotors = [];
  for (const x of [-0.72, 0.72])
    for (const z of [-0.52, 0.52]) {
      const arm = add(
        boxGeo,
        materials.metal,
        x * 0.5,
        0,
        z * 0.5,
        0.86,
        0.07,
        0.08,
      );
      arm.rotation.y = x * z > 0 ? -0.6 : 0.6;
      const guard = add(
        new THREE.TorusGeometry(0.3, 0.035, 6, 20),
        materials.dark,
        x,
        0.05,
        z,
      );
      guard.rotation.x = Math.PI / 2;
      add(cylinderGeo, materials.metal, x, 0.05, z, 0.1, 0.16, 0.1);
      rotors.push(add(boxGeo, materials.metal, x, 0.14, z, 0.48, 0.02, 0.055));
    }
  const barrel = add(
    cylinderGeo,
    materials.dark,
    0,
    -0.25,
    0.3,
    0.12,
    0.5,
    0.12,
  );
  barrel.rotation.x = Math.PI / 2;
  return { group, rotors };
}
export function createWeapon(materials, parkour = false) {
  const group = new THREE.Group(),
    glove = mat(0x242b28, { roughness: 0.94 }),
    sleeve = mat(parkour ? 0xbcb19c : 0x465749, { roughness: 1 });
  group.userData.ownedMaterials = [glove, sleeve];
  const add = (geo, m, x, y, z, sx, sy, sz) => {
    const rounded =
      geo === boxGeo
        ? new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(sx, sy, sz) * 0.12)
        : geo;
    const mesh = new THREE.Mesh(rounded, m);
    mesh.position.set(x, y, z);
    if (geo !== boxGeo) mesh.scale.set(sx, sy, sz);
    else mesh.userData.weaponGeometry = true;
    mesh.castShadow = false;
    group.add(mesh);
    return mesh;
  };
  if (parkour) {
    for (const side of [-1, 1]) {
      const arm = add(
        cylinderGeo,
        sleeve,
        side * 0.35,
        -0.38,
        -0.23,
        0.14,
        0.6,
        0.14,
      );
      arm.rotation.x = -0.65;
      arm.rotation.z = side * -0.17;
      add(sphereGeo, glove, side * 0.31, -0.19, -0.43, 0.13, 0.15, 0.18);
    }
  } else {
    add(boxGeo, materials.dark, 0, 0, 0, 0.14, 0.15, 0.44);
    add(boxGeo, materials.metal, 0, 0.07, -0.17, 0.11, 0.065, 0.32);
    const barrel = add(
      cylinderGeo,
      materials.dark,
      0,
      0.02,
      -0.42,
      0.045,
      0.45,
      0.045,
    );
    barrel.rotation.x = Math.PI / 2;
    const muzzle = add(
      cylinderGeo,
      materials.metal,
      0,
      0.02,
      -0.67,
      0.065,
      0.085,
      0.065,
    );
    muzzle.rotation.x = Math.PI / 2;
    add(boxGeo, materials.dark, 0, -0.11, 0.13, 0.085, 0.22, 0.08).rotation.x =
      -0.3;
    add(
      boxGeo,
      materials.metal,
      0,
      -0.16,
      -0.065,
      0.09,
      0.26,
      0.12,
    ).rotation.x = 0.14;
    add(boxGeo, materials.dark, 0, 0.015, 0.32, 0.11, 0.13, 0.3);
    for (let i = 0; i < 8; i++)
      add(
        boxGeo,
        materials.metal,
        0,
        0.105,
        -0.29 + i * 0.047,
        0.13,
        0.012,
        0.018,
      );
    const scope = add(
      new THREE.TorusGeometry(0.045, 0.008, 8, 24),
      materials.dark,
      0,
      0.17,
      -0.025,
      1,
      1,
      1,
    );
    add(boxGeo, materials.metal, 0, 0.12, -0.025, 0.035, 0.075, 0.06);
    add(sphereGeo, materials.red, 0, 0.17, -0.033, 0.008, 0.008, 0.008);
    const forearm = add(
      cylinderGeo,
      sleeve,
      -0.11,
      -0.27,
      -0.16,
      0.14,
      0.43,
      0.14,
    );
    forearm.rotation.x = -1.1;
    forearm.rotation.z = -0.4;
    add(sphereGeo, glove, -0.055, -0.105, -0.25, 0.15, 0.13, 0.18);
    add(sphereGeo, glove, 0.025, -0.13, 0.13, 0.12, 0.19, 0.16);
    const flash = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.33, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffdd86,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    flash.rotation.x = -Math.PI / 2;
    flash.position.set(0, 0.02, -0.86);
    flash.visible = false;
    group.add(flash);
    group.userData.flash = flash;
    group.userData.ownedMaterials.push(flash.material);
    group.position.set(0.25, -0.22, -0.46);
    group.scale.setScalar(0.72);
  }
  return group;
}
