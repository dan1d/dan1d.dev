"use client";

import { useRef, useMemo, useCallback, useState, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import MatrixRain from "./MatrixRain";

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

// Level → color mapping (brighter Matrix green scale)
const LEVEL_COLORS: Record<number, string> = {
  0: "#1a3a25", // visible dark green
  1: "#2d8a4e", // medium green
  2: "#3fbd67", // bright green
  3: "#52ef80", // brighter
  4: "#00ff41", // full Matrix green
};

// Pre-build THREE.Color objects for reuse
const LEVEL_THREE_COLORS = Object.fromEntries(
  Object.entries(LEVEL_COLORS).map(([k, v]) => [k, new THREE.Color(v)])
);

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

const CAM_START = new THREE.Vector3(20, 14, 20);
const CAM_END = new THREE.Vector3(8, 6, 8);
const CAM_LOOK_AT = new THREE.Vector3(0, 0.5, 0);

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
    ctx.fillStyle = "#050e08";
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    const gridCount = 16;
    const cellSize = size / gridCount;
    ctx.strokeStyle = "#00ff4130";
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
    ctx.strokeStyle = "#00ff4160";
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

  return (
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshPhongMaterial
        map={gridTexture}
        emissive="#003300"
        emissiveIntensity={0.3}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── InstancedBars ──────────────────────────────────────────────────────────

interface InstancedBarsProps {
  data: SkylineCell[];
  onHover?: (cell: SkylineCell | null) => void;
}

function InstancedBars({ data, onHover }: InstancedBarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshPhongMaterial>(null);
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
    });

    return { cells, heights, positions, colorArray };
  }, [data, maxCount, count]);

  // Scratch object for matrix computation
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Apply initial matrices (all at scale 0) and colors on mount
  const meshRefCallback = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      (meshRef as React.RefObject<THREE.InstancedMesh | null>).current = mesh;

      const { heights, positions, colorArray } = instanceLayout;

      for (let i = 0; i < count; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        const h = heights[i];

        // Start with 0 height (will be animated)
        dummy.position.set(x, 0, z);
        dummy.scale.set(BAR_SIZE, 0.001, BAR_SIZE);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      const colorAttr = new THREE.InstancedBufferAttribute(colorArray, 3);
      mesh.instanceColor = colorAttr;
      mesh.instanceColor.needsUpdate = true;
    },
    [instanceLayout, count, dummy]
  );

  // Pointer move: raycasting for hover effect
  const pointer = useRef(new THREE.Vector2());

  // Animate bars each frame based on intro progress
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const intro = introRef.current;
    const { heights, positions, cells } = instanceLayout;

    // Update bar matrices based on intro progress
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
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Glow pulse on material
    const mat = materialRef.current;
    if (mat) {
      const glow = intro.glowPulse;
      if (glow > 0) {
        mat.emissive.set("#00ff41");
        mat.emissiveIntensity = glow * 0.8;
      } else if (intro.done) {
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0;
      }
    }

    // Hover raycasting (only after intro)
    if (!intro.done || !onHover) return;

    raycaster.setFromCamera(pointer.current, camera);
    const hits = raycaster.intersectObject(mesh);

    const newIndex = hits.length > 0 ? (hits[0].instanceId ?? -1) : -1;

    if (newIndex !== hoveredIndex.current) {
      // Restore previous hover
      if (hoveredIndex.current >= 0) {
        const prevCell = cells[hoveredIndex.current];
        const prevColor =
          LEVEL_THREE_COLORS[prevCell?.level ?? 0] ?? LEVEL_THREE_COLORS[0];
        mesh.setColorAt(hoveredIndex.current, prevColor);
      }
      hoveredIndex.current = newIndex;
      if (newIndex >= 0) {
        mesh.setColorAt(newIndex, new THREE.Color("#ffffff"));
        onHover(cells[newIndex] ?? null);
      } else {
        onHover(null);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
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
    <instancedMesh
      ref={meshRefCallback}
      args={[undefined, undefined, count]}
      onPointerMove={handlePointerMove as unknown as React.PointerEventHandler}
      onPointerLeave={() => {
        pointer.current.set(9999, 9999);
        if (onHover) onHover(null);
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial
        ref={materialRef}
        vertexColors
        emissive="#000000"
        emissiveIntensity={0}
        shininess={80}
        specular={new THREE.Color("#114422")}
      />
    </instancedMesh>
  );
}

// ─── IntroAwareOrbitControls ────────────────────────────────────────────────

function IntroAwareOrbitControls() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const introRef = useContext(IntroContext);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const intro = introRef.current;
    // Disable autoRotate during intro, enable after
    if (!intro.done) {
      (controls as unknown as { autoRotate: boolean }).autoRotate = false;
    } else {
      (controls as unknown as { autoRotate: boolean }).autoRotate = true;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={false}
      autoRotateSpeed={0.5}
      enablePan={false}
      minDistance={3}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.1}
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
  return (
    <IntroController>
      {/* Camera animation */}
      <CameraIntro />

      {/* Omnidirectional lighting — bars stay visible from every angle */}
      <ambientLight intensity={1.0} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        color="#ffffff"
      />
      <directionalLight
        position={[-10, 15, -10]}
        intensity={1.2}
        color="#ffffff"
      />
      <directionalLight
        position={[0, 10, -15]}
        intensity={1.0}
        color="#ffffff"
      />
      <pointLight position={[0, 12, 0]} intensity={1.5} color="#00ff41" />
      <pointLight position={[-8, 5, 8]} intensity={1.0} color="#39d353" />

      {/* Matrix Rain behind the skyline — intensified during intro */}
      <IntroAwareMatrixRain />

      {/* Floating holographic quotes */}
      <FloatingQuotes />

      {/* Grid floor */}
      <GridFloor />

      {/* Instanced skyline bars — animated growth */}
      <InstancedBars data={data} onHover={onHover} />

      {/* Controls — autoRotate disabled during intro */}
      <IntroAwareOrbitControls />
    </IntroController>
  );
}

// ─── SkylineScene (exported) ─────────────────────────────────────────────────

export default function SkylineScene({ data, onHover, onCreated }: SkylineSceneProps) {
  return (
    <Canvas
      camera={{
        position: [20, 14, 20], // Start position — CameraIntro will animate to [8,6,8]
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, alpha: false }}
      shadows
      style={{ background: "#000000", width: "100%", height: "100%" }}
      onCreated={onCreated}
    >
      <Scene data={data} onHover={onHover} />
    </Canvas>
  );
}
