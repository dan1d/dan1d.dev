import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RainSurface } from "./RainSurface";
import { createCodeMaterial } from "./CodeMaterial";
import { buildGlowTexture } from "./CodePortal";

// ─── Code hall ──────────────────────────────────────────────────────────────
// A parametric room built from the same luminous code fabric as the hero
// corridor: dense rain on floor, walls and ceiling, torn cabling hanging from
// above, motes drifting in the air, and a lit doorway at the far end. Used as
// the set for the 3D experience pages so they carry the same art direction.

export interface CodeHallProps {
  atlas: THREE.CanvasTexture;
  width: number;
  height: number;
  depth: number;
  /** y of the floor plane */
  floorY?: number;
  /** z of the back wall; the hall extends toward +z from here */
  backZ?: number;
  tendrils?: number;
  doorway?: boolean;
  motes?: number;
  /** keep tendrils clear of a box around the origin (half extents x, z) */
  clear?: [number, number];
}

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function Tendrils({ atlas, width, height, depth, floorY, backZ, count, clear }: Required<Pick<CodeHallProps, "atlas" | "width" | "height" | "depth" | "floorY" | "backZ">> & { count: number; clear?: [number, number] }) {
  const mat = useMemo(
    () => createCodeMaterial(atlas, { scale: 50, base: 0.5, bright: 2.4, rim: 1.3, fill: 0.014, tint: [0.15, 1.0, 0.4], speed: 1.6 }),
    [atlas],
  );
  const geometry = useMemo(() => {
    const rng = seeded(777);
    const out: THREE.TubeGeometry[] = [];
    const ceil = floorY + height;
    for (let i = 0; i < count; i++) {
      let x = (rng() - 0.5) * (width - 1);
      let z = backZ + 1 + rng() * (depth - 2);
      if (clear && Math.abs(x) < clear[0] && Math.abs(z) < clear[1]) { x = Math.sign(x || 1) * (clear[0] + rng() * (width / 2 - clear[0])); }
      const len = 0.6 + rng() * rng() * (height * 0.45);
      const dx = (rng() - 0.5) * 1.2, dz = (rng() - 0.5) * 1.2;
      const wob = rng() * 6;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 7; k++) {
        const t = k / 7;
        pts.push(new THREE.Vector3(x + dx * t * t + Math.sin(t * 6 + wob) * 0.06, ceil - len * Math.sin(t * Math.PI * 0.5), z + dz * t * t));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.014 + rng() * 0.035, 6, false));
    }
    // Cable runs drooping along both cornices
    for (let i = 0; i < Math.max(6, count / 2); i++) {
      const side = rng() > 0.5 ? -1 : 1;
      const z0 = backZ + 1 + rng() * (depth - 8);
      const span = 3 + rng() * 6;
      const inset = width / 2 - 0.4 - rng() * 0.5;
      const droop = 0.3 + rng() * 0.9;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        pts.push(new THREE.Vector3(side * inset, ceil - 0.08 - Math.sin(t * Math.PI) * droop, z0 + span * t));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.018 + rng() * 0.025, 6, false));
    }
    const merged = mergeGeometries(out, false)!;
    out.forEach((g) => g.dispose());
    return merged;
  }, [width, height, depth, floorY, backZ, count, clear]);
  return <mesh geometry={geometry} material={mat} frustumCulled={false} />;
}

function Doorway({ atlas, width, floorY, backZ }: { atlas: THREE.CanvasTexture; width: number; floorY: number; backZ: number }) {
  const frame = useMemo(() => createCodeMaterial(atlas, { scale: 28, base: 0.55, bright: 2.2, rim: 1.0, fill: 0.014, speed: 1.4 }), [atlas]);
  const glow = useMemo(() => buildGlowTexture(), []);
  const pulse = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (pulse.current) pulse.current.opacity = 0.42 + Math.sin(clock.elapsedTime * 0.7) * 0.08;
  });
  const PW = Math.min(3.2, width * 0.35), PH = 4.0, RECESS = 1.2;
  const z = backZ + 0.02;
  return (
    <group>
      <RainSurface atlas={atlas} position={[0, floorY + PH / 2, z - RECESS]} rotation={[0, 0, 0]}
        size={[PW, PH]} cols={Math.round(PW * 30)} rows={Math.round(PH * 30)} speed={1.2} bright={2.6} base={0.9} fogFar={80} />
      <RainSurface atlas={atlas} position={[-PW / 2, floorY + PH / 2, z - RECESS / 2]} rotation={[0, Math.PI / 2, 0]}
        size={[RECESS, PH]} cols={36} rows={120} speed={1.2} bright={2.0} base={0.7} fogFar={80} />
      <RainSurface atlas={atlas} position={[PW / 2, floorY + PH / 2, z - RECESS / 2]} rotation={[0, -Math.PI / 2, 0]}
        size={[RECESS, PH]} cols={36} rows={120} speed={1.2} bright={2.0} base={0.7} fogFar={80} />
      <mesh position={[0, floorY + PH + 0.15, z + 0.12]} material={frame}><boxGeometry args={[PW + 0.7, 0.3, 0.4]} /></mesh>
      <mesh position={[-(PW / 2 + 0.15), floorY + PH / 2, z + 0.12]} material={frame}><boxGeometry args={[0.3, PH, 0.4]} /></mesh>
      <mesh position={[PW / 2 + 0.15, floorY + PH / 2, z + 0.12]} material={frame}><boxGeometry args={[0.3, PH, 0.4]} /></mesh>
      <mesh position={[0, floorY + PH / 2, z + 0.4]}>
        <planeGeometry args={[PW * 1.5, PH * 1.2]} />
        <meshBasicMaterial ref={pulse} map={glow} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY + 0.015, z + 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PW * 1.8, 4.4]} />
        <meshBasicMaterial map={glow} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function CodeHall({ atlas, width, height, depth, floorY = 0, backZ, tendrils = 24, doorway = true, motes = 500, clear }: CodeHallProps) {
  const bz = backZ ?? -depth / 2;
  const cz = bz + depth / 2;
  const D = 22; // strands per unit
  const fog = Math.max(60, depth * 2.2);
  return (
    <group>
      {/* Floor, ceiling, walls */}
      <RainSurface atlas={atlas} position={[0, floorY, cz]} rotation={[-Math.PI / 2, 0, 0]}
        size={[width, depth]} cols={Math.round(width * D)} rows={Math.round(depth * D)} speed={0.9} bright={2.0} base={0.58} fogFar={fog} />
      <RainSurface atlas={atlas} position={[0, floorY + height, cz]} rotation={[Math.PI / 2, 0, 0]}
        size={[width, depth]} cols={Math.round(width * D)} rows={Math.round(depth * D)} speed={0.9} bright={1.9} base={0.52} fogFar={fog} />
      <RainSurface atlas={atlas} position={[-width / 2, floorY + height / 2, cz]} rotation={[0, Math.PI / 2, 0]}
        size={[depth, height]} cols={Math.round(depth * D)} rows={Math.round(height * D)} speed={0.9} bright={2.1} base={0.6} fogFar={fog} />
      <RainSurface atlas={atlas} position={[width / 2, floorY + height / 2, cz]} rotation={[0, -Math.PI / 2, 0]}
        size={[depth, height]} cols={Math.round(depth * D)} rows={Math.round(height * D)} speed={0.9} bright={2.1} base={0.6} fogFar={fog} />
      <RainSurface atlas={atlas} position={[0, floorY + height / 2, bz]} rotation={[0, 0, 0]}
        size={[width, height]} cols={Math.round(width * D)} rows={Math.round(height * D)} speed={0.9} bright={2.0} base={0.58} fogFar={fog} />

      {tendrils > 0 && <Tendrils atlas={atlas} width={width} height={height} depth={depth} floorY={floorY} backZ={bz} count={tendrils} clear={clear} />}
      {doorway && <Doorway atlas={atlas} width={width} floorY={floorY} backZ={bz} />}
      {motes > 0 && (
        <Sparkles count={motes} scale={[width - 0.5, height - 0.5, depth - 1]} position={[0, floorY + height / 2, cz]}
          size={2.4} speed={0.25} color="#c8ffd8" opacity={0.75} noise={0.6} />
      )}
    </group>
  );
}
