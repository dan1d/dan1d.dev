import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CORRIDOR } from "./CorridorStructure";
import { createCodeMaterial } from "./CodeMaterial";
import { RainSurface } from "./RainSurface";

// ─── Code portal ────────────────────────────────────────────────────────────
// The bright doorway at the vanishing point: a recessed opening in the back
// wall pouring green light down the corridor, three figures standing in it,
// every one of them built from glyphs. This is the shot the camera drives
// toward before it racks to the desk.

const { H, D } = CORRIDOR;
const FLOOR = -H / 2;
const PW = 2.1;   // opening width
const PH = 2.75;  // opening height
const RECESS = 0.9;
const PX = 0.6;    // doorway sits right of the desk so the light rakes the coder from the side

export function buildGlowTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(220,255,230,1)");
  g.addColorStop(0.25, "rgba(90,255,140,0.75)");
  g.addColorStop(0.6, "rgba(0,180,60,0.25)");
  g.addColorStop(1, "rgba(0,60,20,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function buildFigureGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number, rz = 0) => {
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    parts.push(g);
  };
  add(new THREE.SphereGeometry(0.11, 14, 12), 0, 1.66, 0);
  add(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8), 0, 1.53, 0);
  add(new THREE.BoxGeometry(0.44, 0.62, 0.22), 0, 1.2, 0);
  add(new THREE.CapsuleGeometry(0.055, 0.5, 4, 8), -0.27, 1.14, 0, 0.08);
  add(new THREE.CapsuleGeometry(0.055, 0.5, 4, 8), 0.27, 1.14, 0, -0.08);
  add(new THREE.BoxGeometry(0.38, 0.16, 0.2), 0, 0.82, 0);
  add(new THREE.CapsuleGeometry(0.07, 0.62, 4, 8), -0.11, 0.42, 0);
  add(new THREE.CapsuleGeometry(0.07, 0.62, 4, 8), 0.11, 0.42, 0);
  add(new THREE.BoxGeometry(0.14, 0.06, 0.26), -0.11, 0.03, 0.04);
  add(new THREE.BoxGeometry(0.14, 0.06, 0.26), 0.11, 0.03, 0.04);
  // One draw call per figure instead of ten
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

function Figure({ x, z, geometry, mat, phase }: { x: number; z: number; geometry: THREE.BufferGeometry; mat: THREE.Material; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current; if (!m) return;
    const t = clock.elapsedTime;
    m.rotation.y = Math.sin(t * 0.35 + phase) * 0.12;
    m.position.y = FLOOR + Math.sin(t * 0.9 + phase) * 0.01;
  });
  return <mesh ref={ref} geometry={geometry} material={mat} position={[x, FLOOR, z]} />;
}

export function CodePortal({ atlas }: { atlas: THREE.CanvasTexture }) {
  const mats = useMemo(() => ({
    frame: createCodeMaterial(atlas, { scale: 28, base: 0.55, bright: 2.2, rim: 1.0, fill: 0.014, speed: 1.4 }),
    figure: createCodeMaterial(atlas, { scale: 44, base: 0.62, bright: 2.5, rim: 1.6, fill: 0.03, tint: [0.4, 1.0, 0.55], speed: 1.8 }),
  }), [atlas]);
  const glow = useMemo(() => buildGlowTexture(), []);
  const figureGeo = useMemo(() => buildFigureGeometry(), []);

  const zWall = -D + 0.02;
  return (
    <group position={[PX, 0, 0]}>
      {/* Interior: a blazing back wall and jambs deep in the recess */}
      <RainSurface atlas={atlas} position={[0, FLOOR + PH / 2, zWall - RECESS]} rotation={[0, 0, 0]}
        size={[PW, PH]} cols={64} rows={84} speed={1.2} bright={2.6} base={0.9} fogFar={60} />
      <RainSurface atlas={atlas} position={[-PW / 2, FLOOR + PH / 2, zWall - RECESS / 2]} rotation={[0, Math.PI / 2, 0]}
        size={[RECESS, PH]} cols={28} rows={84} speed={1.2} bright={2.0} base={0.7} fogFar={60} />
      <RainSurface atlas={atlas} position={[PW / 2, FLOOR + PH / 2, zWall - RECESS / 2]} rotation={[0, -Math.PI / 2, 0]}
        size={[RECESS, PH]} cols={28} rows={84} speed={1.2} bright={2.0} base={0.7} fogFar={60} />
      <RainSurface atlas={atlas} position={[0, FLOOR + PH, zWall - RECESS / 2]} rotation={[Math.PI / 2, 0, 0]}
        size={[PW, RECESS]} cols={64} rows={28} speed={1.2} bright={2.0} base={0.7} fogFar={60} />

      {/* Frame: lintel and jambs standing proud of the wall */}
      <mesh position={[0, FLOOR + PH + 0.12, zWall + 0.1]} material={mats.frame}><boxGeometry args={[PW + 0.5, 0.24, 0.32]} /></mesh>
      <mesh position={[-(PW / 2 + 0.12), FLOOR + PH / 2, zWall + 0.1]} material={mats.frame}><boxGeometry args={[0.24, PH, 0.32]} /></mesh>
      <mesh position={[PW / 2 + 0.12, FLOOR + PH / 2, zWall + 0.1]} material={mats.frame}><boxGeometry args={[0.24, PH, 0.32]} /></mesh>

      {/* Light pouring out: a soft plate in the opening and a spill on the floor */}
      <mesh position={[0, FLOOR + PH / 2, zWall + 0.3]}>
        <planeGeometry args={[PW * 1.35, PH * 1.15]} />
        <meshBasicMaterial map={glow} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, FLOOR + 0.012, zWall + 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PW * 1.6, 3.2]} />
        <meshBasicMaterial map={glow} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Three figures waiting in the doorway */}
      <Figure x={-0.62} z={zWall - 0.35} geometry={figureGeo} mat={mats.figure} phase={0} />
      <Figure x={0.02} z={zWall - 0.5} geometry={figureGeo} mat={mats.figure} phase={2.1} />
      <Figure x={0.64} z={zWall - 0.32} geometry={figureGeo} mat={mats.figure} phase={4.2} />
    </group>
  );
}
