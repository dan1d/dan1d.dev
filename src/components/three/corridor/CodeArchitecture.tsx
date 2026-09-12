import { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { CORRIDOR } from "./CorridorStructure";
import { createCodeMaterial } from "./CodeMaterial";

// ─── Code architecture ──────────────────────────────────────────────────────
// The corridor's bones, built from glyphs: a tiled floor with missing and
// lifted slabs, pillars with capitals, ceiling beams, a wainscot rail and
// rubble along the walls. Everything is instanced where it repeats so the
// whole set is a handful of draw calls. Seeded so a visit is stable.

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const { W, H, D } = CORRIDOR;
const FLOOR = -H / 2;
const CEIL = H / 2;

function Instanced({ count, geometry, material, place }: {
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  place: (i: number, o: THREE.Object3D) => boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const o = new THREE.Object3D();
    let n = 0;
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
      if (!place(i, o)) continue;
      o.updateMatrix();
      m.setMatrixAt(n++, o.matrix);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  }, [count, place]);
  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

export function CodeArchitecture({ atlas }: { atlas: THREE.Texture }) {
  const mats = useMemo(() => ({
    tile: createCodeMaterial(atlas, { scale: 10, base: 0.09, bright: 1.2, rim: 0.4, fill: 0.004 }),
    pillar: createCodeMaterial(atlas, { scale: 12, base: 0.16, bright: 1.5, rim: 0.8, fill: 0.008 }),
    beam: createCodeMaterial(atlas, { scale: 12, base: 0.14, bright: 1.35, rim: 0.7, fill: 0.007 }),
    rubble: createCodeMaterial(atlas, { scale: 26, base: 0.18, bright: 1.4, rim: 1.1, fill: 0.006, tint: [0.2, 1.0, 0.4] }),
  }), [atlas]);

  const geo = useMemo(() => ({
    tile: new THREE.BoxGeometry(0.47, 0.035, 0.47),
    pillar: new THREE.BoxGeometry(0.26, H, 0.26),
    cap: new THREE.BoxGeometry(0.36, 0.1, 0.36),
    beam: new THREE.BoxGeometry(W, 0.16, 0.2),
    rail: new THREE.BoxGeometry(0.05, 0.09, D),
    rubble: new THREE.DodecahedronGeometry(1, 0),
  }), []);

  // Floor: 8 x 62 grid, ~12% missing, a few lifted or tilted (ruined)
  const cols = 8, rows = Math.floor(D / 0.48);
  const placeTile = useMemo(() => {
    const rng = seeded(1337);
    const plan = Array.from({ length: cols * rows }, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = (c - (cols - 1) / 2) * 0.48;
      const z = -0.5 - r * 0.48;
      const roll = rng();
      const missing = roll < 0.12;
      const lifted = !missing && roll > 0.9;
      return { x, z, missing, lifted, ry: rng(), rx: rng(), h: rng() };
    });
    return (i: number, o: THREE.Object3D) => {
      const t = plan[i];
      if (t.missing) return false;
      o.position.set(t.x, FLOOR + 0.0175 + (t.lifted ? t.h * 0.05 : 0), t.z);
      if (t.lifted) o.rotation.set((t.rx - 0.5) * 0.14, 0, (t.ry - 0.5) * 0.14);
      return true;
    };
  }, [rows]);

  // Pillars every 3.2 units on both walls, with a capital top and bottom
  const pillarZ = useMemo(() => { const zs: number[] = []; for (let z = -2.2; z > -D + 0.6; z -= 3.2) zs.push(z); return zs; }, []);
  const placePillar = useMemo(() => (i: number, o: THREE.Object3D) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = pillarZ[Math.floor(i / 2)];
    o.position.set(side * (W / 2 - 0.13), 0, z);
    return true;
  }, [pillarZ]);
  const placeCap = useMemo(() => (i: number, o: THREE.Object3D) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = pillarZ[Math.floor(i / 4)];
    const top = Math.floor(i / 2) % 2 === 0;
    o.position.set(side * (W / 2 - 0.13), top ? CEIL - 0.05 : FLOOR + 0.05, z);
    return true;
  }, [pillarZ]);
  const placeBeam = useMemo(() => (i: number, o: THREE.Object3D) => {
    o.position.set(0, CEIL - 0.08, pillarZ[i]);
    return true;
  }, [pillarZ]);

  // Rubble: chunks along the walls, none in the desk area
  const placeRubble = useMemo(() => {
    const rng = seeded(9001);
    return (_i: number, o: THREE.Object3D) => {
      const side = rng() > 0.5 ? -1 : 1;
      let z = -1.5 - rng() * (D - 3);
      if (z < -21 && z > -25) z += 5; // keep the set clear
      const s = 0.04 + rng() * rng() * 0.22;
      o.position.set(side * (W / 2 - 0.25 - rng() * 0.6), FLOOR + s * 0.7, z);
      o.rotation.set(rng() * 6.28, rng() * 6.28, rng() * 6.28);
      o.scale.set(s * (0.8 + rng() * 0.6), s * (0.5 + rng() * 0.5), s * (0.8 + rng() * 0.6));
      return true;
    };
  }, []);

  return (
    <group>
      <Instanced count={cols * rows} geometry={geo.tile} material={mats.tile} place={placeTile} />
      <Instanced count={pillarZ.length * 2} geometry={geo.pillar} material={mats.pillar} place={placePillar} />
      <Instanced count={pillarZ.length * 4} geometry={geo.cap} material={mats.pillar} place={placeCap} />
      <Instanced count={pillarZ.length} geometry={geo.beam} material={mats.beam} place={placeBeam} />
      {/* Wainscot rails along both walls */}
      <mesh geometry={geo.rail} material={mats.beam} position={[-W / 2 + 0.025, FLOOR + 0.95, -D / 2]} />
      <mesh geometry={geo.rail} material={mats.beam} position={[W / 2 - 0.025, FLOOR + 0.95, -D / 2]} />
      <Instanced count={46} geometry={geo.rubble} material={mats.rubble} place={placeRubble} />
    </group>
  );
}
