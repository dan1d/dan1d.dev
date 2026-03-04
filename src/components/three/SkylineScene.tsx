"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

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

// Level → color mapping (dark → cyan → purple)
const LEVEL_COLORS: Record<number, string> = {
  0: "#1a1a2e",
  1: "#06b6d4",
  2: "#0891b2",
  3: "#7c3aed",
  4: "#8b5cf6",
};

// Pre-build THREE.Color objects for reuse
const LEVEL_THREE_COLORS = Object.fromEntries(
  Object.entries(LEVEL_COLORS).map(([k, v]) => [k, new THREE.Color(v)])
);

const HOVER_EMISSIVE = new THREE.Color("#ffffff");
const DEFAULT_EMISSIVE = new THREE.Color("#000000");

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
      (meshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current =
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
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
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
      <meshStandardMaterial
        vertexColors
        emissive={DEFAULT_EMISSIVE}
        emissiveIntensity={0}
        roughness={0.4}
        metalness={0.3}
      />
    </instancedMesh>
  );
}

// ─── BasePlatform ────────────────────────────────────────────────────────────

function BasePlatform() {
  const width = COLS * STEP + GAP * 2;
  const depth = ROWS * STEP + GAP * 2;

  return (
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <boxGeometry args={[width, 0.1, depth]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({ data, onHover }: SkylineSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        color="#ffffff"
      />
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.4}
        color="#8b5cf6"
      />
      <pointLight position={[0, 15, 0]} intensity={0.6} color="#06b6d4" />

      {/* Geometry */}
      <BasePlatform />
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
        position: [12, 8, 12],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, alpha: true }}
      shadows
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Scene data={data} onHover={onHover} />
    </Canvas>
  );
}
