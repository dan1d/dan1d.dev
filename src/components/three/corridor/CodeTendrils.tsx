import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CORRIDOR } from "./CorridorStructure";
import { createCodeMaterial } from "./CodeMaterial";

// ─── Code tendrils ──────────────────────────────────────────────────────────
// Torn cabling hanging from the ceiling and drooping cable runs along the
// cornices, every strand a tube of streaming glyphs. Seeded so a visit is
// stable; the desk area is kept clear so nothing dangles in the money shot.

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const { W, H, D } = CORRIDOR;

export function CodeTendrils({ atlas }: { atlas: THREE.Texture }) {
  const mat = useMemo(
    () => createCodeMaterial(atlas, { scale: 50, base: 0.5, bright: 2.4, rim: 1.3, fill: 0.014, tint: [0.15, 1.0, 0.4], speed: 1.6 }),
    [atlas],
  );

  const geometry = useMemo(() => {
    const rng = seeded(4242);
    const out: THREE.TubeGeometry[] = [];

    // Hanging tendrils: rooted in the ceiling, sagging down and drifting sideways
    for (let i = 0; i < 20; i++) {
      let z = -2 - rng() * (D - 4);
      if (z < -21.5 && z > -24.5) z -= 4;
      const x = (rng() - 0.5) * (W - 0.7);
      const len = 0.5 + rng() * rng() * 2.4;
      const dx = (rng() - 0.5) * 0.9, dz = (rng() - 0.5) * 0.9;
      const wob = rng() * 6;
      const pts: THREE.Vector3[] = [];
      const n = 7;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const sag = Math.sin(t * Math.PI * 0.5);
        pts.push(new THREE.Vector3(x + dx * t * t + Math.sin(t * 6 + wob) * 0.05, H / 2 - len * sag, z + dz * t * t));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.012 + rng() * 0.03, 6, false));
    }

    // Cable runs drooping between anchor points along both cornices
    for (let i = 0; i < 12; i++) {
      const side = rng() > 0.5 ? -1 : 1;
      const z0 = -1 - rng() * (D - 7);
      const span = 2 + rng() * 4.5;
      const inset = W / 2 - 0.3 - rng() * 0.25;
      const droopAmp = 0.2 + rng() * 0.55;
      const pts: THREE.Vector3[] = [];
      const n = 8;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        pts.push(new THREE.Vector3(side * inset, H / 2 - 0.05 - Math.sin(t * Math.PI) * droopAmp, z0 - span * t));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.016 + rng() * 0.022, 6, false));
    }
    // One draw call for the whole tangle; the tubes never move
    const merged = mergeGeometries(out, false)!;
    out.forEach((g) => g.dispose());
    return merged;
  }, []);

  return <mesh geometry={geometry} material={mat} frustumCulled={false} />;
}
