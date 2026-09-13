"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildGlyphAtlas } from "./corridor/GlyphAtlas";
import { CodeClock } from "./corridor/CodeMaterial";
import { HoodedBust } from "./corridor/HoodedBust";
import MatrixRain from "./MatrixRain";

// ── Constants ──────────────────────────────────────────────────────────
const GREEN = "#00ff41";
const PARTICLE_COUNT = 60;
const CODE_CHAR_COUNT = 18;

// Latin + symbols only, NO CJK/katakana
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>{}[]~^|/\\";

// ── Utility: lerp ──────────────────────────────────────────────────────
// ── Orbiting particles (InstancedMesh) ─────────────────────────────────
function OrbitingParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const orbitRadius = 1.2 + Math.random() * 2.0;
      const orbitSpeed = 0.15 + Math.random() * 0.35;
      const orbitPhase = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 3.0;
      const yOscillation = 0.2 + Math.random() * 0.5;
      const ySpeed = 0.3 + Math.random() * 0.4;
      const scale = 0.008 + Math.random() * 0.018;
      data.push({ orbitRadius, orbitSpeed, orbitPhase, yOffset, yOscillation, ySpeed, scale });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];
      const angle = t * p.orbitSpeed + p.orbitPhase;
      const x = Math.cos(angle) * p.orbitRadius;
      const z = Math.sin(angle) * p.orbitRadius;
      const y = p.yOffset + Math.sin(t * p.ySpeed + p.orbitPhase) * p.yOscillation;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={GREEN}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ── Floating code characters ───────────────────────────────────────────
function buildCharTexture(char: string): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = GREEN;
  ctx.font = `bold ${size * 0.7}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function FloatingCodeChars() {
  const groupRef = useRef<THREE.Group>(null);

  const charData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CODE_CHAR_COUNT; i++) {
      const char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      const texture = buildCharTexture(char);
      const radius = 1.8 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 0.05 + Math.random() * 0.15;
      const size = 0.12 + Math.random() * 0.15;
      const phase = Math.random() * Math.PI * 2;
      data.push({ texture, radius, theta, phi, speed, size, phase });
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (i >= charData.length) return;
      const d = charData[i];
      const angle = d.theta + t * d.speed;
      const y = Math.sin(d.phi) * d.radius + Math.sin(t * 0.3 + d.phase) * 0.3;
      const cosP = Math.cos(d.phi);
      child.position.set(
        Math.cos(angle) * d.radius * cosP,
        y,
        Math.sin(angle) * d.radius * cosP
      );
      child.lookAt(state.camera.position);

      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.3 + Math.sin(t * 2 + d.phase) * 0.15;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {charData.map((d, i) => (
        <mesh key={i}>
          <planeGeometry args={[d.size, d.size]} />
          <meshBasicMaterial
            map={d.texture}
            transparent
            opacity={0.4}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Pulsing point lights ───────────────────────────────────────────────
function PulsingLights() {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  const light3 = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light1.current) light1.current.intensity = 0.8 + Math.sin(t * 0.7) * 0.4;
    if (light2.current) light2.current.intensity = 0.6 + Math.sin(t * 1.1 + 1.0) * 0.3;
    if (light3.current) light3.current.intensity = 0.7 + Math.sin(t * 0.9 + 2.0) * 0.35;
  });

  return (
    <>
      <pointLight ref={light1} position={[2, 1.5, 1]} color={GREEN} intensity={0.8} distance={8} decay={2} />
      <pointLight ref={light2} position={[-1.5, -1, 2]} color={GREEN} intensity={0.6} distance={8} decay={2} />
      <pointLight ref={light3} position={[0, 2, -2]} color={GREEN} intensity={0.7} distance={8} decay={2} />
    </>
  );
}

// ── Camera: held on the operator with a slow handheld sway ─────────────
function AutoCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.set(
      Math.sin(t * 0.13) * 0.16,
      -0.06 + Math.sin(t * 0.09) * 0.04,
      1.45 + Math.sin(t * 0.07) * 0.06
    );
    state.camera.lookAt(0, -0.1, 0);
  });
  return null;
}

// ── Main scene ─────────────────────────────────────────────────────────
function Scene() {
  const atlas = useMemo(() => buildGlyphAtlas(), []);
  return (
    <>
      <fog attach="fog" args={["#000800", 4, 12]} />
      <CodeClock />

      {/* Rain far behind the figure */}
      <group position={[0, 0.5, -4]}>
        <MatrixRain columnCount={44} rowCount={18} speed={1.2} opacity={0.35} area={[10, 7]} />
      </group>

      <PulsingLights />
      <HoodedBust atlas={atlas} position={[0, 0.08, 0]} scale={1.05} />
      <OrbitingParticles />
      <FloatingCodeChars />
      <AutoCamera />
    </>
  );
}

// ── Export ──────────────────────────────────────────────────────────────
export default function CardScene() {
  return (
    <div data-testid="card-canvas" className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, -0.06, 1.45], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
