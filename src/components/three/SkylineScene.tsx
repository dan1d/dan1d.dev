"use client";

import { useRef, useMemo, useCallback, useState, useEffect, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import MatrixRain from "./MatrixRain";
import { buildGlyphAtlas } from "./corridor/GlyphAtlas";
import { createCodeMaterial, CodeClock } from "./corridor/CodeMaterial";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SkylineCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface SkylineSceneProps {
  data: SkylineCell[];
  onHover?: (cell: SkylineCell | null) => void;
  onCreated?: (state: { gl: THREE.WebGLRenderer }) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COLS = 52; // weeks
const ROWS = 7; // days
const BAR_SIZE = 0.18;
const GAP = 0.04;
const STEP = BAR_SIZE + GAP;
const MIN_HEIGHT = 0.1;
const MAX_HEIGHT = 2.5;

// Intro timing
const INTRO_CAMERA_DURATION = 3.0; // seconds for camera sweep
const INTRO_BARS_DELAY = 0.4; // seconds before bars start growing
const INTRO_BARS_DURATION = 2.2; // seconds for all bars to finish growing
const INTRO_BAR_GROW_TIME = 0.6; // seconds each bar takes to grow
const INTRO_TOTAL_DURATION = INTRO_CAMERA_DURATION + 0.5; // extra buffer after camera

// Level → cap color (the lit top of each bar) and body tint (glyph brightness)
const LEVEL_COLORS: Record<number, string> = {
  0: "#1e6b35",
  1: "#2aa552",
  2: "#3fd671",
  3: "#7dff9f",
  4: "#d6ffe3",
};
const LEVEL_TINT = [0.45, 0.6, 0.76, 0.9, 1.0];

// Pre-build THREE.Color objects for reuse
const LEVEL_THREE_COLORS = Object.fromEntries(
  Object.entries(LEVEL_COLORS).map(([k, v]) => [k, new THREE.Color(v)])
);
const LEVEL_TINT_COLORS = LEVEL_TINT.map((t) => new THREE.Color(t, t, t));
const HOVER_COLOR = new THREE.Color("#ffffff");

// ─── Easing functions ───────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── IntroContext ─────────────────────────────────────────────────────────────

interface IntroState {
  elapsed: number;
  done: boolean;
  barProgress: (col: number, row: number) => number;
  glowPulse: number; // 0..1, peaks briefly when intro completes
  rainIntensity: number; // multiplier for rain brightness during intro
}

const IntroContext = createContext<React.RefObject<IntroState>>({
  current: {
    elapsed: 0,
    done: true,
    barProgress: () => 1,
    glowPulse: 0,
    rainIntensity: 1,
  },
});

function IntroController({ children }: { children: React.ReactNode }) {
  const introRef = useRef<IntroState>({
    elapsed: 0,
    done: false,
    barProgress: () => 0,
    glowPulse: 0,
    rainIntensity: 2.0,
  });

  useFrame((_state, delta) => {
    const intro = introRef.current;
    if (intro.done) return;

    intro.elapsed += delta;
    const t = intro.elapsed;

    // Bar progress: staggered wave from left to right, top to bottom
    intro.barProgress = (col: number, row: number) => {
      const barStartDelay = INTRO_BARS_DELAY;
      // Each bar's start time: staggered across the duration
      const totalBars = COLS * ROWS;
      const barIndex = col * ROWS + row;
      const staggerOffset = (barIndex / totalBars) * INTRO_BARS_DURATION;
      const barTime = t - barStartDelay - staggerOffset;

      if (barTime <= 0) return 0;
      if (barTime >= INTRO_BAR_GROW_TIME) return 1;

      // Use easeOutBack for a slightly bouncy "decode" feel
      return easeOutBack(barTime / INTRO_BAR_GROW_TIME);
    };

    // Rain intensity: starts high, decays to 1.0
    if (t < INTRO_CAMERA_DURATION) {
      // Bright during camera sweep, easing down
      const camProgress = t / INTRO_CAMERA_DURATION;
      intro.rainIntensity = 2.0 - easeOutCubic(camProgress) * 1.0;
    } else {
      intro.rainIntensity = 1.0;
    }

    // Glow pulse: peaks right when bars finish
    const pulseCenter = INTRO_BARS_DELAY + INTRO_BARS_DURATION + INTRO_BAR_GROW_TIME * 0.5;
    const pulseWidth = 0.6;
    const pulseDist = Math.abs(t - pulseCenter) / pulseWidth;
    intro.glowPulse = pulseDist < 1 ? (1 - pulseDist) * (1 - pulseDist) : 0;

    // Mark done
    if (t >= INTRO_TOTAL_DURATION) {
      intro.done = true;
      intro.barProgress = () => 1;
      intro.glowPulse = 0;
      intro.rainIntensity = 1.0;
    }
  });

  return (
    <IntroContext.Provider value={introRef}>{children}</IntroContext.Provider>
  );
}

// ─── CameraIntro ──────────────────────────────────────────────────────────────

const CAM_LOOK_AT = new THREE.Vector3(0, 0.5, 0);
const ORBIT_RADIUS = 9.8;
const ORBIT_ELEV = 0.5; // radians above the floor (~29°)
function orbitPose(t: number, out: THREE.Vector3) {
  // Slow sweep across the front of the skyline; never edge-on
  const az = Math.sin(t * 0.11) * 0.62;
  const el = ORBIT_ELEV + Math.sin(t * 0.07) * 0.08;
  const r = ORBIT_RADIUS + Math.sin(t * 0.05) * 0.6;
  out.set(r * Math.sin(az) * Math.cos(el), r * Math.sin(el) + 0.5, r * Math.cos(az) * Math.cos(el));
  return out;
}
const CAM_START = new THREE.Vector3(18, 12, 16);
const CAM_END = orbitPose(0, new THREE.Vector3());

function CameraIntro() {
  const { camera } = useThree();
  const introRef = useContext(IntroContext);
  const initialized = useRef(false);

  useFrame(() => {
    const intro = introRef.current;
    if (!intro) return;

    // Set initial camera position on first frame
    if (!initialized.current) {
      camera.position.copy(CAM_START);
      camera.lookAt(CAM_LOOK_AT);
      initialized.current = true;
    }

    if (intro.done && intro.elapsed > 0) return;

    const t = Math.min(intro.elapsed / INTRO_CAMERA_DURATION, 1);
    const eased = easeOutCubic(t);

    camera.position.lerpVectors(CAM_START, CAM_END, eased);
    camera.lookAt(CAM_LOOK_AT);
  });

  return null;
}

// ─── FloatingQuotes ─────────────────────────────────────────────────────────

const QUOTES = [
  "Wake up, dan1d...",
  "Follow the white rabbit",
  "I know kung fu",
  "There is no spoon",
  "Free your mind",
  "The Matrix has you",
];

interface QuoteInstance {
  text: string;
  x: number;
  y: number;
  z: number;
  opacity: number;
  speed: number;
  initialY: number;
  maxY: number;
}

function FloatingQuotes() {
  const quotesRef = useRef<QuoteInstance[]>([]);

  // Initialize quote instances once
  useMemo(() => {
    const instances: QuoteInstance[] = [];
    for (let i = 0; i < 5; i++) {
      const initialY = -3 + Math.random() * 6;
      instances.push({
        text: QUOTES[i % QUOTES.length],
        x: -6 + Math.random() * 12,
        y: initialY,
        z: -3 - Math.random() * 5,
        opacity: 0.15 + Math.random() * 0.25,
        speed: 0.06 + Math.random() * 0.08,
        initialY: initialY - 5,
        maxY: initialY + 5,
      });
    }
    quotesRef.current = instances;
    return instances;
  }, []);

  // State to trigger re-renders on position updates
  const [, setTick] = useState(0);

  useFrame((_state, delta) => {
    let changed = false;
    for (const q of quotesRef.current) {
      q.y += q.speed * delta * 10;
      if (q.y > q.maxY) {
        q.y = q.initialY;
        q.x = -6 + Math.random() * 12;
        q.z = -3 - Math.random() * 5;
        q.text = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        q.opacity = 0.15 + Math.random() * 0.25;
        changed = true;
      }
    }
    if (changed) {
      setTick((t) => t + 1);
    }
  });

  return (
    <group>
      {quotesRef.current.map((q, i) => (
        <Text
          key={i}
          position={[q.x, q.y, q.z]}
          fontSize={0.3}
          color="#00ff41"
          anchorX="center"
          anchorY="middle"
          fillOpacity={q.opacity}
          material-transparent={true}
          material-depthWrite={false}
        >
          {q.text}
          <meshBasicMaterial
            color="#00ff41"
            transparent
            opacity={q.opacity}
            depthWrite={false}
          />
        </Text>
      ))}
    </group>
  );
}

// ─── GridFloor ──────────────────────────────────────────────────────────────

function GridFloor() {
  const width = COLS * STEP + GAP * 4;
  const depth = ROWS * STEP + GAP * 4;

  const gridTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Dark background
    ctx.fillStyle = "#03110a";
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    const gridCount = 16;
    const cellSize = size / gridCount;
    ctx.strokeStyle = "#00ff4155";
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridCount; i++) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Brighter major grid lines every 4 cells
    ctx.strokeStyle = "#00ff41a0";
    ctx.lineWidth = 2;
    for (let i = 0; i <= gridCount; i += 4) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,255,65,0.55)");
    g.addColorStop(0.5, "rgba(0,255,65,0.12)");
    g.addColorStop(1, "rgba(0,255,65,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group>
      {/* Glow pad under the skyline — the "holo table" */}
      <mesh position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 1.8, depth * 6]} />
        <meshBasicMaterial map={glowTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial map={gridTexture} transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* Edge frame */}
      <lineSegments position={[0, -0.04, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.001, depth)]} />
        <lineBasicMaterial color="#00ff41" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

// ─── InstancedBars ──────────────────────────────────────────────────────────

interface InstancedBarsProps {
  data: SkylineCell[];
  onHover?: (cell: SkylineCell | null) => void;
  atlas: THREE.Texture;
}

function InstancedBars({ data, onHover, atlas }: InstancedBarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const capsRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const haloTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);
  const bodyMat = useMemo(
    () => createCodeMaterial(atlas, { scale: 11, base: 0.46, bright: 1.9, rim: 0.9, fill: 0.09, speed: 1.2, instanceTint: true }),
    [atlas]
  );
  // Mirror into a ref so useFrame can drive the glow uniform
  const bodyMatRef = useRef<THREE.ShaderMaterial | null>(null);
  useEffect(() => { bodyMatRef.current = bodyMat; }, [bodyMat]);
  const { raycaster, camera, gl } = useThree();
  const hoveredIndex = useRef<number>(-1);
  const introRef = useContext(IntroContext);

  const count = COLS * ROWS;

  // Compute max count for normalization
  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data]
  );

  // Pre-compute target heights and positions for each instance
  const instanceLayout = useMemo(() => {
    const cells: SkylineCell[] = Array.from({ length: count }, (_, i) =>
      i < data.length
        ? data[i]
        : { date: "", count: 0, level: 0 as const }
    );

    const heights = new Float32Array(count);
    const positions = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const tintArray = new Float32Array(count * 3);

    cells.forEach((cell, i) => {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;

      const normalizedHeight =
        cell.count > 0
          ? MIN_HEIGHT + (cell.count / maxCount) * (MAX_HEIGHT - MIN_HEIGHT)
          : MIN_HEIGHT;

      heights[i] = normalizedHeight;

      const x = (col - COLS / 2) * STEP;
      const z = (row - ROWS / 2) * STEP;
      positions[i * 3] = x;
      positions[i * 3 + 1] = normalizedHeight / 2; // y
      positions[i * 3 + 2] = z;

      const color =
        LEVEL_THREE_COLORS[cell.level] ?? LEVEL_THREE_COLORS[0];
      color.toArray(colorArray, i * 3);
      (LEVEL_TINT_COLORS[cell.level] ?? LEVEL_TINT_COLORS[0]).toArray(tintArray, i * 3);
    });

    return { cells, heights, positions, colorArray, tintArray };
  }, [data, maxCount, count]);

  // Scratch object for matrix computation
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Apply initial matrices (all at scale 0) and colors on mount
  const meshRefCallback = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      (meshRef as React.RefObject<THREE.InstancedMesh | null>).current = mesh;

      const { positions, tintArray } = instanceLayout;

      for (let i = 0; i < count; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];

        // Start with 0 height (will be animated)
        dummy.position.set(x, 0, z);
        dummy.scale.set(BAR_SIZE, 0.001, BAR_SIZE);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      mesh.instanceColor = new THREE.InstancedBufferAttribute(tintArray, 3);
      mesh.instanceColor.needsUpdate = true;
    },
    [instanceLayout, count, dummy]
  );

  const haloRefCallback = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      (haloRef as React.RefObject<THREE.InstancedMesh | null>).current = mesh;
      const { positions, colorArray } = instanceLayout;
      for (let i = 0; i < count; i++) {
        dummy.position.set(positions[i * 3], 0, positions[i * 3 + 2]);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(BAR_SIZE * 2.6, BAR_SIZE * 2.6, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      dummy.rotation.set(0, 0, 0);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray.slice(), 3);
      mesh.instanceColor.needsUpdate = true;
    },
    [instanceLayout, count, dummy]
  );

  const capsRefCallback = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      (capsRef as React.RefObject<THREE.InstancedMesh | null>).current = mesh;
      const { positions, colorArray } = instanceLayout;
      for (let i = 0; i < count; i++) {
        dummy.position.set(positions[i * 3], 0, positions[i * 3 + 2]);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(BAR_SIZE, BAR_SIZE, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      dummy.rotation.set(0, 0, 0);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
      mesh.instanceColor.needsUpdate = true;
    },
    [instanceLayout, count, dummy]
  );

  // Pointer move: raycasting for hover effect
  const pointer = useRef(new THREE.Vector2());
  const settledRef = useRef(false);

  // Animate bars each frame based on intro progress
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const intro = introRef.current;
    const { heights, positions, cells } = instanceLayout;
    const caps = capsRef.current;
    const halo = haloRef.current;

    // Update bar matrices based on intro progress (skip once settled)
    if (!intro.done || !settledRef.current) {
      for (let i = 0; i < count; i++) {
        const col = Math.floor(i / ROWS);
        const row = i % ROWS;

        const progress = intro.barProgress(col, row);
        const targetH = heights[i];
        const currentH = Math.max(0.001, targetH * progress);
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];

        dummy.position.set(x, currentH / 2, z);
        dummy.scale.set(BAR_SIZE, currentH, BAR_SIZE);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        if (caps) {
          dummy.position.set(x, currentH + 0.002, z);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.scale.set(BAR_SIZE, BAR_SIZE, 1);
          dummy.updateMatrix();
          caps.setMatrixAt(i, dummy.matrix);
          dummy.rotation.set(0, 0, 0);
        }
        if (halo) {
          const lvl = cells[i]?.level ?? 0;
          const hs = BAR_SIZE * (1.6 + lvl * 0.5);
          dummy.position.set(x, currentH + 0.004, z);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.scale.set(hs, hs, 1);
          dummy.updateMatrix();
          halo.setMatrixAt(i, dummy.matrix);
          dummy.rotation.set(0, 0, 0);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (caps) caps.instanceMatrix.needsUpdate = true;
      if (halo) halo.instanceMatrix.needsUpdate = true;
      if (intro.done) settledRef.current = true;
    }

    // Glow pulse when the bars finish decoding
    if (bodyMatRef.current) bodyMatRef.current.uniforms.uBright.value = 1.9 + intro.glowPulse * 1.6;

    // Hover raycasting (only after intro)
    if (!intro.done || !onHover) return;

    raycaster.setFromCamera(pointer.current, camera);
    const hits = raycaster.intersectObject(mesh);

    const newIndex = hits.length > 0 ? (hits[0].instanceId ?? -1) : -1;

    if (newIndex !== hoveredIndex.current) {
      // Restore previous hover
      if (hoveredIndex.current >= 0) {
        const prevLevel = cells[hoveredIndex.current]?.level ?? 0;
        mesh.setColorAt(hoveredIndex.current, LEVEL_TINT_COLORS[prevLevel]);
        caps?.setColorAt(hoveredIndex.current, LEVEL_THREE_COLORS[prevLevel] ?? LEVEL_THREE_COLORS[0]);
      }
      hoveredIndex.current = newIndex;
      if (newIndex >= 0) {
        mesh.setColorAt(newIndex, HOVER_COLOR);
        caps?.setColorAt(newIndex, HOVER_COLOR);
        onHover(cells[newIndex] ?? null);
      } else {
        onHover(null);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (caps?.instanceColor) caps.instanceColor.needsUpdate = true;
    }
  });

  // Track pointer position
  const handlePointerMove = useCallback(
    (e: THREE.Event & { uv?: THREE.Vector2; point?: THREE.Vector3 }) => {
      const rect = gl.domElement.getBoundingClientRect();
      const clientX = (e as unknown as PointerEvent).clientX ?? 0;
      const clientY = (e as unknown as PointerEvent).clientY ?? 0;
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    },
    [gl]
  );

  return (
    <group>
      <instancedMesh
        ref={meshRefCallback}
        args={[undefined, undefined, count]}
        material={bodyMat}
        onPointerMove={handlePointerMove as unknown as React.PointerEventHandler}
        onPointerLeave={() => {
          pointer.current.set(9999, 9999);
          if (onHover) onHover(null);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      {/* Lit caps: the contribution level reads from above */}
      <instancedMesh ref={capsRefCallback} args={[undefined, undefined, count]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      {/* Soft halo over each cap, sized by level — the glow without a composer */}
      <instancedMesh ref={haloRefCallback} args={[undefined, undefined, count]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={haloTexture} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} opacity={0.7} />
      </instancedMesh>
    </group>
  );
}

// ─── CinematicOrbit ─────────────────────────────────────────────────────────
// Drives the camera on a slow front-facing sweep once the intro is done. The
// user can still drag; the sweep pauses and eases back after a few idle seconds.

function CinematicOrbit() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const introRef = useContext(IntroContext);
  const orbitT = useRef(0);
  const idleFor = useRef(10);
  const dragging = useRef(false);
  const target = useRef(new THREE.Vector3()).current;

  useFrame((state, delta) => {
    const camera = state.camera;
    const intro = introRef.current;
    if (!intro.done) return;
    if (dragging.current) { idleFor.current = 0; return; }
    idleFor.current += delta;
    if (idleFor.current < 4) return;
    orbitT.current += delta;
    orbitPose(orbitT.current, target);
    // Ease back onto the rail after a drag, then ride it
    const k = Math.min(1, (idleFor.current - 4) / 2.5);
    camera.position.lerp(target, 0.03 + k * 0.5);
    camera.lookAt(CAM_LOOK_AT);
    controlsRef.current?.target.copy(CAM_LOOK_AT);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={false}
      enablePan={false}
      minDistance={4}
      maxDistance={24}
      maxPolarAngle={Math.PI / 2.15}
      target={CAM_LOOK_AT}
      onStart={() => { dragging.current = true; }}
      onEnd={() => { dragging.current = false; idleFor.current = 0; }}
    />
  );
}

// ─── IntroAwareMatrixRain ────────────────────────────────────────────────────

function IntroAwareMatrixRain() {
  const introRef = useContext(IntroContext);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    // Scale the group opacity during intro via material manipulation
    // Since MatrixRain uses its own shader, we'll rely on speed/opacity props
    // and instead adjust the group scale for a subtle visual effect
    const intro = introRef.current;
    const intensity = intro.rainIntensity;
    // Slightly scale the rain group to give a "zoom" feel during intro
    group.scale.setScalar(0.95 + intensity * 0.05);
  });

  return (
    <group ref={groupRef} position={[0, 3, -5]} rotation={[0, 0, 0]}>
      <MatrixRain columnCount={50} rowCount={20} speed={1.8} opacity={0.45} area={[16, 10]} />
    </group>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({ data, onHover }: SkylineSceneProps) {
  const atlas = useMemo(() => buildGlyphAtlas(), []);
  return (
    <IntroController>
      {/* Camera animation */}
      <CameraIntro />
      <CodeClock />

      {/* Matrix Rain behind the skyline — intensified during intro */}
      <IntroAwareMatrixRain />

      {/* Floating holographic quotes */}
      <FloatingQuotes />

      {/* Grid floor */}
      <GridFloor />

      {/* Instanced skyline bars — animated growth */}
      <InstancedBars data={data} onHover={onHover} atlas={atlas} />

      {/* Cinematic sweep after the intro; drag to look around */}
      <CinematicOrbit />
    </IntroController>
  );
}

// ─── SkylineScene (exported) ─────────────────────────────────────────────────

export default function SkylineScene({ data, onHover, onCreated }: SkylineSceneProps) {
  return (
    <Canvas
      camera={{
        position: [18, 12, 16], // Start position — CameraIntro sweeps onto the orbit rail
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#000000", width: "100%", height: "100%" }}
      onCreated={onCreated}
    >
      <Scene data={data} onHover={onHover} />
    </Canvas>
  );
}
