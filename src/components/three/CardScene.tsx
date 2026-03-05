"use client";

import { Suspense, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// ── Constants ──────────────────────────────────────────────────────────
const GREEN = "#00ff41";
const DARK_GREEN = "#003b00";
const GLOW_GREEN = "#00ff41";
const PARTICLE_COUNT = 60;
const CODE_CHAR_COUNT = 18;
const CYCLE_DURATION = 12; // seconds

// Latin + symbols only, NO CJK/katakana
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>{}[]~^|/\\";

// ── Utility: smoothstep ────────────────────────────────────────────────
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ── Utility: lerp ──────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Build spoon geometry ───────────────────────────────────────────────
// Spoon oriented vertically: handle at bottom (negative Y), bowl at top (positive Y)
function buildSpoonGeometry(): THREE.BufferGeometry {
  // Spine points for a spoon shape using CatmullRomCurve3
  const spinePoints = [
    new THREE.Vector3(0, -1.5, 0),   // handle bottom
    new THREE.Vector3(0, -1.0, 0),   // handle
    new THREE.Vector3(0, -0.5, 0),   // handle
    new THREE.Vector3(0, 0.0, 0),    // handle top
    new THREE.Vector3(0, 0.3, 0),    // neck start
    new THREE.Vector3(0, 0.55, 0),   // neck middle
    new THREE.Vector3(0, 0.75, 0),   // neck end / bowl start
    new THREE.Vector3(0, 1.0, 0),    // bowl
    new THREE.Vector3(0, 1.2, 0),    // bowl widest
    new THREE.Vector3(0, 1.4, 0),    // bowl upper
    new THREE.Vector3(0, 1.55, 0),   // bowl tip
  ];

  const spine = new THREE.CatmullRomCurve3(spinePoints, false, "catmullrom", 0.5);
  const spineLength = spinePoints.length;

  // Radius function along the spine (0..1 parameter)
  // handle: thin, neck: taper, bowl: wide concave ellipsoid
  function getRadius(t: number): number {
    if (t < 0.45) {
      // Handle: thin cylinder
      return 0.06;
    } else if (t < 0.6) {
      // Neck: taper from handle to bowl
      const nt = (t - 0.45) / 0.15;
      return lerp(0.06, 0.28, smoothstep(0, 1, nt));
    } else if (t < 0.95) {
      // Bowl: ellipsoidal bulge
      const bt = (t - 0.6) / 0.35;
      // Parabolic bowl shape
      const bowlRadius = 0.28 + 0.12 * Math.sin(bt * Math.PI);
      return bowlRadius;
    } else {
      // Tip: close off
      const tt = (t - 0.95) / 0.05;
      return lerp(0.28, 0.05, tt);
    }
  }

  // Build tube-like geometry by sampling spine and creating rings
  const segments = 64;
  const radialSegments = 16;
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = spine.getPointAt(t);
    const tangent = spine.getTangentAt(t).normalize();

    // Build a coordinate frame
    const up = Math.abs(tangent.y) > 0.99
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    const radius = getRadius(t);

    // For the bowl section, make it concave (flatten the front)
    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      let rx = radius;
      let rz = radius;

      // Bowl concavity: flatten the front face (positive Z side)
      if (t > 0.6 && t < 0.95) {
        const bt = (t - 0.6) / 0.35;
        const concavity = Math.sin(bt * Math.PI) * 0.4;
        const cosA = Math.cos(angle);
        if (cosA > 0) {
          // Push front inward for concave bowl
          rz *= (1 - concavity * cosA * cosA);
        }
      }

      const x = point.x + (Math.cos(angle) * rx * normal.x + Math.sin(angle) * rz * binormal.x);
      const y = point.y + (Math.cos(angle) * rx * normal.y + Math.sin(angle) * rz * binormal.y);
      const z = point.z + (Math.cos(angle) * rx * normal.z + Math.sin(angle) * rz * binormal.z);

      vertices.push(x, y, z);
    }
  }

  // Build faces
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + 1;
      const c = (i + 1) * (radialSegments + 1) + j;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// ── Spoon mesh component ───────────────────────────────────────────────
function BendingSpoon() {
  const wireRef = useRef<THREE.Mesh>(null);
  const solidRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Build geometry and store original positions
  const { geometry, originalPositions } = useMemo(() => {
    const geo = buildSpoonGeometry();
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const original = new Float32Array(posAttr.array.length);
    original.set(posAttr.array as Float32Array);
    return { geometry: geo, originalPositions: original };
  }, []);

  // Clone geometry for each mesh layer
  const wireGeo = useMemo(() => geometry.clone(), [geometry]);
  const solidGeo = useMemo(() => geometry.clone(), [geometry]);
  const glowGeo = useMemo(() => {
    const g = geometry.clone();
    // Scale up slightly for glow shell
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const len = Math.sqrt(arr[i] ** 2 + arr[i + 1] ** 2 + arr[i + 2] ** 2);
      if (len > 0) {
        const scale = 1.08;
        // Only scale the radial component, not the Y position
        arr[i] *= scale;
        arr[i + 2] *= scale;
      }
    }
    pos.needsUpdate = true;
    return g;
  }, [geometry]);

  const glowOriginal = useMemo(() => {
    const posAttr = glowGeo.getAttribute("position") as THREE.BufferAttribute;
    const orig = new Float32Array(posAttr.array.length);
    orig.set(posAttr.array as Float32Array);
    return orig;
  }, [glowGeo]);

  // Deform vertices based on animation phase
  const deformVertices = useCallback(
    (
      targetArr: Float32Array,
      srcArr: Float32Array,
      time: number
    ) => {
      const cycleTime = time % CYCLE_DURATION;
      const vertCount = srcArr.length / 3;

      for (let i = 0; i < vertCount; i++) {
        const i3 = i * 3;
        let ox = srcArr[i3];
        let oy = srcArr[i3 + 1];
        let oz = srcArr[i3 + 2];

        // Normalize height to 0..1 range (handle at -1.5, bowl at 1.55)
        const heightNorm = (oy + 1.5) / 3.05;

        // ── Phase 0 (0-3s): Gentle float/wobble ──
        const p0Strength = smoothstep(0, 0.5, cycleTime) * (1 - smoothstep(2.5, 3.5, cycleTime));
        if (p0Strength > 0) {
          const wobbleX = Math.sin(time * 2.0 + oy * 3.0) * 0.015 * heightNorm;
          const wobbleZ = Math.cos(time * 1.7 + oy * 2.5) * 0.012 * heightNorm;
          const wobbleY = Math.sin(time * 1.3 + ox * 4.0) * 0.008;
          ox += wobbleX * p0Strength;
          oy += wobbleY * p0Strength;
          oz += wobbleZ * p0Strength;
        }

        // ── Phase 1 (3-6s): Dramatic bend ──
        const p1Strength = smoothstep(2.5, 3.5, cycleTime) * (1 - smoothstep(5.5, 6.5, cycleTime));
        if (p1Strength > 0) {
          // Bend proportional to height — top bends more
          const bendAmount = heightNorm * heightNorm * 0.6;
          const bendDir = Math.sin(time * 0.8) * 0.3 + 0.7; // mostly one direction
          ox += bendAmount * bendDir * p1Strength;
          // Add some compression on the inner side
          oz += Math.sin(heightNorm * Math.PI) * 0.1 * p1Strength * Math.cos(time * 1.2);
          // Slight Y compression at the bend point
          oy -= Math.sin(heightNorm * Math.PI) * 0.08 * p1Strength;
        }

        // ── Phase 2 (6-9s): Twist/spiral ──
        const p2Strength = smoothstep(5.5, 6.5, cycleTime) * (1 - smoothstep(8.5, 9.5, cycleTime));
        if (p2Strength > 0) {
          const twistAngle = heightNorm * Math.PI * 1.5 * p2Strength;
          const cosT = Math.cos(twistAngle);
          const sinT = Math.sin(twistAngle);
          const rx = ox;
          const rz = oz;
          ox = rx * cosT - rz * sinT;
          oz = rx * sinT + rz * cosT;
          // Add some radial pulsing
          const pulse = Math.sin(heightNorm * Math.PI * 2 + time * 3) * 0.03 * p2Strength;
          ox += ox * pulse;
          oz += oz * pulse;
        }

        // ── Phase 3 (9-12s): Reform with spring-back oscillation ──
        const p3Strength = smoothstep(8.5, 9.5, cycleTime) * (1 - smoothstep(11.5, 12.0, cycleTime));
        if (p3Strength > 0) {
          const reformTime = cycleTime - 9.0;
          // Decaying oscillation
          const decay = Math.exp(-reformTime * 1.5);
          const oscillation = Math.sin(reformTime * 8.0) * decay;
          ox += heightNorm * 0.15 * oscillation * p3Strength;
          oz += heightNorm * 0.1 * Math.sin(reformTime * 6.0) * decay * p3Strength;
          oy += Math.sin(heightNorm * Math.PI) * 0.04 * oscillation * p3Strength;
        }

        // Global gentle float
        oy += Math.sin(time * 0.5) * 0.03;

        targetArr[i3] = ox;
        targetArr[i3 + 1] = oy;
        targetArr[i3 + 2] = oz;
      }
    },
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Deform all three geometry layers
    const meshes = [
      { ref: wireRef, geo: wireGeo, orig: originalPositions },
      { ref: solidRef, geo: solidGeo, orig: originalPositions },
      { ref: glowRef, geo: glowGeo, orig: glowOriginal },
    ];

    for (const { ref, geo, orig } of meshes) {
      if (!ref.current) continue;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      deformVertices(arr, orig, t);
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // Gentle group rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Wireframe shell */}
      <mesh ref={wireRef} geometry={wireGeo}>
        <meshBasicMaterial
          color={GREEN}
          wireframe
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner solid for depth */}
      <mesh ref={solidRef} geometry={solidGeo}>
        <meshBasicMaterial
          color={DARK_GREEN}
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow shell */}
      <mesh ref={glowRef} geometry={glowGeo}>
        <meshBasicMaterial
          color={GLOW_GREEN}
          wireframe
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

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
      // Face camera (billboard) — handled by lookAt in useFrame
      child.lookAt(state.camera.position);

      // Pulse opacity
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

// ── Auto-orbiting camera ───────────────────────────────────────────────
function AutoCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const radius = 4.0 + Math.sin(t * 0.15) * 0.5; // 3.5 - 4.5
    const angle = t * 0.12;
    const height = Math.sin(t * 0.1) * 0.6; // gentle vertical oscillation

    state.camera.position.set(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Main scene ─────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <fog attach="fog" args={["#000800", 4, 12]} />

      <Stars
        radius={50}
        depth={40}
        count={500}
        factor={1.0}
        saturation={0.1}
        fade
        speed={0.15}
      />

      <PulsingLights />
      <BendingSpoon />
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
        camera={{ position: [0, 0, 4], fov: 50 }}
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
