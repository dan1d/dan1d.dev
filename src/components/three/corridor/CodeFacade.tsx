import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CORRIDOR } from "./CorridorStructure";
import { createCodeMaterial } from "./CodeMaterial";
import { Instanced } from "./CodeArchitecture";
import { buildGlowTexture } from "./CodePortal";
import { RainSurface } from "./RainSurface";
import { BEATS, intro, facadeReveal } from "./IntroTimeline";

// ─── Code facade ────────────────────────────────────────────────────────────
// The building the corridor lives in, seen from the street: a tall glyph-built
// facade with rows of windows, ledges, pilasters and a cornice, a portico over
// the doorway that leads into the hall, and two neighbours fading into the
// fog. Every material carries uReveal, so the whole block materialises out of
// the rain veil cell by cell, bottom-up, on the RESOLVE beat.

const { W, H } = CORRIDOR;
const GROUND = -H / 2;
const FW = 34;               // facade width
const FH = 18;               // facade height above ground
const TOP = GROUND + FH;
const WIN_COLS = 13, WIN_STEP = 2.2;
const WIN_ROWS = [4.2, 7.2, 10.2, 13.2];
const LEDGES = [2.7, 5.7, 8.7, 11.7, 14.7];

export function CodeFacade({ atlas }: { atlas: THREE.CanvasTexture }) {
  const mats = useMemo(() => ({
    // Seen from 15 units away, so the glyphs are coarse enough to still read
    // as code: ~10 cells per unit on the wall, finer on the trim
    wall: createCodeMaterial(atlas, { scale: 10, base: 0.32, bright: 1.6, rim: 0.6, fill: 0.01 }),
    trim: createCodeMaterial(atlas, { scale: 16, base: 0.6, bright: 2.3, rim: 1.0, fill: 0.016, tint: [0.35, 1.0, 0.55] }),
    // Panes: sparse, slow, dark — the windows are holes in the code, not lights
    glass: createCodeMaterial(atlas, { scale: 12, base: 0.05, bright: 0.7, rim: 0.4, fill: 0.002, speed: 0.5 }),
    ground: createCodeMaterial(atlas, { scale: 12, base: 0.3, bright: 1.5, rim: 0.3, fill: 0.006 }),
    far: createCodeMaterial(atlas, { scale: 8, base: 0.28, bright: 1.3, rim: 0.5, fill: 0.005 }),
  }), [atlas]);
  const glow = useMemo(() => buildGlowTexture(), []);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);

  const geo = useMemo(() => ({
    sideWall: new THREE.BoxGeometry(FW / 2 - W / 2, FH, 0.6),
    overDoor: new THREE.BoxGeometry(W, FH - H, 0.6),
    frame: new THREE.BoxGeometry(1.15, 1.75, 0.1),
    pane: new THREE.BoxGeometry(0.95, 1.55, 0.05),
    sill: new THREE.BoxGeometry(1.3, 0.1, 0.3),
    lintel: new THREE.BoxGeometry(1.3, 0.12, 0.22),
    ledge: new THREE.BoxGeometry(FW, 0.14, 0.4),
    pilaster: new THREE.BoxGeometry(0.28, FH, 0.25),
    cornice: new THREE.BoxGeometry(FW + 1, 0.6, 1.0),
    column: new THREE.CylinderGeometry(0.24, 0.28, 4.4, 10),
    portico: new THREE.BoxGeometry(7.0, 0.55, 1.6),
    stoop: new THREE.BoxGeometry(7.0, 0.1, 2.2),
    ground: new THREE.BoxGeometry(44, 0.05, 26),
    neighbour: new THREE.BoxGeometry(14, 26, 12),
  }), []);

  // Windows on a regular grid; frame, pane, sill and lintel share one placer
  const winAt = (i: number) => {
    const c = i % WIN_COLS, r = Math.floor(i / WIN_COLS);
    return { x: (c - (WIN_COLS - 1) / 2) * WIN_STEP, y: GROUND + WIN_ROWS[r] };
  };
  const placeFrame = useMemo(() => (i: number, o: THREE.Object3D) => { const w = winAt(i); o.position.set(w.x, w.y, 0.05); return true; }, []);
  const placePane = useMemo(() => (i: number, o: THREE.Object3D) => { const w = winAt(i); o.position.set(w.x, w.y, 0.02); return true; }, []);
  const placeSill = useMemo(() => (i: number, o: THREE.Object3D) => { const w = winAt(i); o.position.set(w.x, w.y - 0.92, 0.15); return true; }, []);
  const placeLintel = useMemo(() => (i: number, o: THREE.Object3D) => { const w = winAt(i); o.position.set(w.x, w.y + 0.93, 0.11); return true; }, []);
  const placeLedge = useMemo(() => (i: number, o: THREE.Object3D) => { o.position.set(0, GROUND + LEDGES[i], 0.2); return true; }, []);
  // Pilasters between window columns, none across the doorway
  const pilasterX = useMemo(() => Array.from({ length: WIN_COLS - 1 }, (_, k) => (k - (WIN_COLS - 2) / 2) * WIN_STEP).filter((x) => Math.abs(x) > 2.5), []);
  const placePilaster = useMemo(() => (i: number, o: THREE.Object3D) => { o.position.set(pilasterX[i], GROUND + FH / 2, 0.12); return true; }, [pilasterX]);

  // Materialise on the intro clock
  useFrame(() => {
    const r = facadeReveal(intro.t);
    for (const m of Object.values(mats)) m.uniforms.uReveal.value = r;
    if (glowMat.current) glowMat.current.opacity = 0.35 * r * r;
  });

  return (
    <group>
      {/* Wall around the doorway */}
      <mesh geometry={geo.sideWall} material={mats.wall} position={[-(W / 2 + (FW / 2 - W / 2) / 2), GROUND + FH / 2, -0.3]} />
      <mesh geometry={geo.sideWall} material={mats.wall} position={[W / 2 + (FW / 2 - W / 2) / 2, GROUND + FH / 2, -0.3]} />
      <mesh geometry={geo.overDoor} material={mats.wall} position={[0, GROUND + H + (FH - H) / 2, -0.3]} />

      {/* Windows, ledges, pilasters, cornice */}
      <Instanced count={WIN_COLS * WIN_ROWS.length} geometry={geo.frame} material={mats.trim} place={placeFrame} />
      <Instanced count={WIN_COLS * WIN_ROWS.length} geometry={geo.pane} material={mats.glass} place={placePane} />
      <Instanced count={WIN_COLS * WIN_ROWS.length} geometry={geo.sill} material={mats.trim} place={placeSill} />
      <Instanced count={WIN_COLS * WIN_ROWS.length} geometry={geo.lintel} material={mats.trim} place={placeLintel} />
      <Instanced count={LEDGES.length} geometry={geo.ledge} material={mats.trim} place={placeLedge} />
      <Instanced count={pilasterX.length} geometry={geo.pilaster} material={mats.wall} place={placePilaster} />
      <mesh geometry={geo.cornice} material={mats.trim} position={[0, TOP + 0.3, 0.2]} />

      {/* Portico over the hall door */}
      <mesh geometry={geo.column} material={mats.trim} position={[-2.75, GROUND + 2.2, 1.0]} />
      <mesh geometry={geo.column} material={mats.trim} position={[2.75, GROUND + 2.2, 1.0]} />
      <mesh geometry={geo.portico} material={mats.trim} position={[0, GROUND + 4.65, 0.5]} />
      <mesh geometry={geo.stoop} material={mats.ground} position={[0, GROUND + 0.05, 1.1]} />
      <mesh position={[0, GROUND + H / 2, -0.6]}>
        <planeGeometry args={[W * 1.3, H * 1.2]} />
        <meshBasicMaterial ref={glowMat} map={glow} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Street and neighbours */}
      <mesh geometry={geo.ground} material={mats.ground} position={[0, GROUND - 0.03, 13]} />
      <mesh geometry={geo.neighbour} material={mats.far} position={[-25, GROUND + 13, -8]} />
      <mesh geometry={geo.neighbour} material={mats.far} position={[25, GROUND + 13, -8]} />
    </group>
  );
}

// ─── Rain veil ──────────────────────────────────────────────────────────────
// A plane of rain that rides three units in front of the lens. It is the
// whole picture for the first second, thins out as the facade resolves, and
// switches off once the dolly begins so it never costs a frame afterwards.

export function RainVeil({ atlas }: { atlas: THREE.CanvasTexture }) {
  const ref = useRef<THREE.Group>(null);
  const dir = useRef(new THREE.Vector3()).current;
  useFrame(({ camera }) => {
    const g = ref.current; if (!g) return;
    g.visible = intro.t < BEATS.approach;
    if (!g.visible) return;
    camera.getWorldDirection(dir);
    g.position.copy(camera.position).addScaledVector(dir, 3);
    g.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={ref}>
      <RainSurface atlas={atlas} position={[0, 0, 0]} rotation={[0, 0, 0]}
        size={[11, 6.6]} cols={330} rows={198} speed={1.1} bright={2.2} base={0.7} fogFar={50}
        fadeOut={[BEATS.resolve + 0.4, BEATS.approach - 0.2]} />
    </group>
  );
}
