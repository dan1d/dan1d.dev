"use client";

import { useRef, useMemo, useCallback, useState } from "react";
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
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COLS = 52; // weeks
const ROWS = 7; // days
const BAR_SIZE = 0.18;
const GAP = 0.04;
const STEP = BAR_SIZE + GAP;
const MIN_HEIGHT = 0.1;
const MAX_HEIGHT = 2.5;

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
  const { raycaster, camera, gl } = useThree();
  const hoveredIndex = useRef<number>(-1);

  const count = COLS * ROWS;

  // Compute max count for normalization
  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data]
  );

  // Build instance matrices & colors once
  const { dummy, colorArray, instanceData } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const colorArray = new Float32Array(count * 3);
    // Pad or trim data to exactly count cells
    const cells: SkylineCell[] = Array.from({ length: count }, (_, i) =>
      i < data.length
        ? data[i]
        : { date: "", count: 0, level: 0 }
    );

    cells.forEach((cell, i) => {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;

      const normalizedHeight =
        cell.count > 0
          ? MIN_HEIGHT + (cell.count / maxCount) * (MAX_HEIGHT - MIN_HEIGHT)
          : MIN_HEIGHT;

      const x = (col - COLS / 2) * STEP;
      const y = normalizedHeight / 2;
      const z = (row - ROWS / 2) * STEP;

      dummy.position.set(x, y, z);
      dummy.scale.set(BAR_SIZE, normalizedHeight, BAR_SIZE);
      dummy.updateMatrix();

      const color =
        LEVEL_THREE_COLORS[cell.level] ?? LEVEL_THREE_COLORS[0];
      color.toArray(colorArray, i * 3);
    });

    return { dummy, colorArray, instanceData: cells };
  }, [data, maxCount, count]);

  // Apply matrices & colors to the instancedMesh after mount/update
  const meshRefCallback = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      (meshRef as React.RefObject<THREE.InstancedMesh | null>).current =
        mesh;
      const d = new THREE.Object3D();
      instanceData.forEach((cell, i) => {
        const col = Math.floor(i / ROWS);
        const row = i % ROWS;
        const normalizedHeight =
          cell.count > 0
            ? MIN_HEIGHT + (cell.count / maxCount) * (MAX_HEIGHT - MIN_HEIGHT)
            : MIN_HEIGHT;
        const x = (col - COLS / 2) * STEP;
        const y = normalizedHeight / 2;
        const z = (row - ROWS / 2) * STEP;
        d.position.set(x, y, z);
        d.scale.set(BAR_SIZE, normalizedHeight, BAR_SIZE);
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;

      const colorAttr = new THREE.InstancedBufferAttribute(colorArray, 3);
      mesh.instanceColor = colorAttr;
      mesh.instanceColor.needsUpdate = true;
    },
    [instanceData, maxCount, colorArray]
  );

  // Pointer move: raycasting for hover effect
  const pointer = useRef(new THREE.Vector2());

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !onHover) return;

    raycaster.setFromCamera(pointer.current, camera);
    const hits = raycaster.intersectObject(mesh);

    const newIndex = hits.length > 0 ? (hits[0].instanceId ?? -1) : -1;

    if (newIndex !== hoveredIndex.current) {
      // Restore previous hover
      if (hoveredIndex.current >= 0) {
        const prevCell = instanceData[hoveredIndex.current];
        const prevColor =
          LEVEL_THREE_COLORS[prevCell?.level ?? 0] ?? LEVEL_THREE_COLORS[0];
        mesh.setColorAt(hoveredIndex.current, prevColor);
      }
      hoveredIndex.current = newIndex;
      if (newIndex >= 0) {
        mesh.setColorAt(newIndex, new THREE.Color("#ffffff"));
        onHover(instanceData[newIndex] ?? null);
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

  void dummy; // suppress unused warning (dummy used in useMemo only)

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
        vertexColors
        emissive="#000000"
        emissiveIntensity={0}
        shininess={80}
        specular={new THREE.Color("#114422")}
      />
    </instancedMesh>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({ data, onHover }: SkylineSceneProps) {
  return (
    <>
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

      {/* Matrix Rain behind the skyline */}
      <group position={[0, 3, -5]} rotation={[0, 0, 0]}>
        <MatrixRain columnCount={50} rowCount={20} speed={1.2} opacity={0.3} area={[16, 10]} />
      </group>

      {/* Floating holographic quotes */}
      <FloatingQuotes />

      {/* Grid floor */}
      <GridFloor />

      {/* Instanced skyline bars */}
      <InstancedBars data={data} onHover={onHover} />

      {/* Controls */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        enablePan={false}
        minDistance={3}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// ─── SkylineScene (exported) ─────────────────────────────────────────────────

export default function SkylineScene({ data, onHover }: SkylineSceneProps) {
  return (
    <Canvas
      camera={{
        position: [8, 6, 8],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, alpha: false }}
      shadows
      style={{ background: "#000000", width: "100%", height: "100%" }}
    >
      <Scene data={data} onHover={onHover} />
    </Canvas>
  );
}
