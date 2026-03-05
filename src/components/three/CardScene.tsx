"use client";

import { Suspense, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// ── Constants ──────────────────────────────────────────────────────────
const GREEN = "#00ff41";
const DARK_GREEN = "#002200";
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

// ── Build realistic spoon geometry ─────────────────────────────────────
// Builds a spoon with proper concave bowl, flat handle, and smooth neck
// using cross-section lofting with inner + outer bowl surfaces.
function buildSpoonGeometry(): THREE.BufferGeometry {
  const SLICES = 48; // number of cross-section slices along the spoon
  const RING_PTS = 32; // points per cross-section ring

  // Heights: handle bottom at y=-1.5, bowl rim at y=1.0
  const yMin = -1.5;
  const yMax = 1.0;

  // Returns the cross-section shape at a given normalized t (0=bottom, 1=top)
  // Each point is [x, z] offset from the spine center
  function getCrossSection(
    t: number,
    ringPts: number
  ): { x: number; z: number }[] {
    const pts: { x: number; z: number }[] = [];

    // Determine width and depth of cross-section based on t
    let halfW: number; // half-width in X
    let halfD: number; // half-depth in Z
    let flatness: number; // 0 = circular, 1 = very flat (rectangular-ish)

    if (t < 0.35) {
      // Handle: flat rectangle with rounded corners
      // Slight taper: wider at top of handle
      const ht = t / 0.35;
      halfW = lerp(0.045, 0.055, ht);
      halfD = lerp(0.018, 0.022, ht);
      flatness = 0.75; // quite flat
    } else if (t < 0.5) {
      // Neck: transitions from flat handle to round-ish bowl base
      const nt = (t - 0.35) / 0.15;
      const s = smoothstep(0, 1, nt);
      halfW = lerp(0.055, 0.18, s);
      halfD = lerp(0.022, 0.12, s);
      flatness = lerp(0.75, 0.1, s);
    } else if (t < 0.95) {
      // Bowl: wide oval
      const bt = (t - 0.5) / 0.45;
      // Bowl profile: widens then narrows
      const bowlShape = Math.sin(bt * Math.PI);
      const bowlWiden = Math.sin(bt * Math.PI * 0.85); // asymmetric — wider in middle
      halfW = 0.18 + bowlWiden * 0.14;
      halfD = 0.12 + bowlShape * 0.10;
      flatness = 0.0; // smooth oval
    } else {
      // Bowl rim taper
      const rt = (t - 0.95) / 0.05;
      const s = smoothstep(0, 1, rt);
      halfW = lerp(0.20, 0.08, s);
      halfD = lerp(0.13, 0.04, s);
      flatness = 0.0;
    }

    for (let i = 0; i < ringPts; i++) {
      const angle = (i / ringPts) * Math.PI * 2;
      let cosA = Math.cos(angle);
      let sinA = Math.sin(angle);

      // Apply superellipse for flatness (handle)
      // p > 2 means more rectangular
      if (flatness > 0) {
        const p = lerp(2, 4, flatness);
        const absCos = Math.abs(cosA);
        const absSin = Math.abs(sinA);
        const r =
          1.0 /
          Math.pow(
            Math.pow(absCos, p) + Math.pow(absSin, p),
            1.0 / p
          );
        cosA *= r;
        sinA *= r;
      }

      pts.push({
        x: cosA * halfW,
        z: sinA * halfD,
      });
    }

    return pts;
  }

  // ── Build outer surface ──────────────────────────────────────────────
  const outerVerts: number[] = [];
  const outerIndices: number[] = [];

  for (let i = 0; i <= SLICES; i++) {
    const t = i / SLICES;
    const y = lerp(yMin, yMax, t);
    const cs = getCrossSection(t, RING_PTS);

    for (let j = 0; j < RING_PTS; j++) {
      outerVerts.push(cs[j].x, y, cs[j].z);
    }
  }

  // Triangulate outer surface
  for (let i = 0; i < SLICES; i++) {
    for (let j = 0; j < RING_PTS; j++) {
      const j1 = (j + 1) % RING_PTS;
      const a = i * RING_PTS + j;
      const b = i * RING_PTS + j1;
      const c = (i + 1) * RING_PTS + j;
      const d = (i + 1) * RING_PTS + j1;

      outerIndices.push(a, c, b);
      outerIndices.push(b, c, d);
    }
  }

  // Cap the bottom of the handle (close it off)
  const handleCapCenter = outerVerts.length / 3;
  outerVerts.push(0, yMin, 0); // center vertex
  for (let j = 0; j < RING_PTS; j++) {
    const j1 = (j + 1) % RING_PTS;
    outerIndices.push(handleCapCenter, j1, j);
  }

  // ── Build inner bowl surface (concave) ───────────────────────────────
  // The inner surface only exists in the bowl region (t > 0.5)
  // It is offset inward and creates the concavity
  const BOWL_START_SLICE = Math.floor(SLICES * 0.5);
  const BOWL_SLICES = SLICES - BOWL_START_SLICE;
  const WALL_THICKNESS = 0.018; // thickness of spoon bowl wall

  const innerOffset = outerVerts.length / 3; // vertex index offset
  const innerVerts: number[] = [];
  const innerIndices: number[] = [];

  for (let i = 0; i <= BOWL_SLICES; i++) {
    const sliceIdx = BOWL_START_SLICE + i;
    const t = sliceIdx / SLICES;
    const y = lerp(yMin, yMax, t);
    const cs = getCrossSection(t, RING_PTS);

    // Bowl depth profile: deeper in the middle, shallower at edges
    const bowlT = i / BOWL_SLICES;
    const depthFactor = Math.sin(bowlT * Math.PI); // 0 at edges, 1 at center

    for (let j = 0; j < RING_PTS; j++) {
      // Shrink inward for wall thickness
      const len = Math.sqrt(cs[j].x * cs[j].x + cs[j].z * cs[j].z);
      let scale = len > 0.001 ? (len - WALL_THICKNESS) / len : 1;
      if (scale < 0.3) scale = 0.3;

      const ix = cs[j].x * scale;
      const iz = cs[j].z * scale;

      // Push the inner surface DOWN (negative Y direction) for concavity
      // The "top" of the bowl is the eating side, so inner surface dips down
      const concaveDepth = depthFactor * 0.10;
      const iy = y - concaveDepth;

      innerVerts.push(ix, iy, iz);
    }
  }

  // Triangulate inner surface (reversed winding for correct normals facing up/inward)
  for (let i = 0; i < BOWL_SLICES; i++) {
    for (let j = 0; j < RING_PTS; j++) {
      const j1 = (j + 1) % RING_PTS;
      const a = innerOffset + i * RING_PTS + j;
      const b = innerOffset + i * RING_PTS + j1;
      const c = innerOffset + (i + 1) * RING_PTS + j;
      const d = innerOffset + (i + 1) * RING_PTS + j1;

      // Reverse winding so normals face inward/upward
      innerIndices.push(a, b, c);
      innerIndices.push(b, d, c);
    }
  }

  // ── Connect inner and outer bowl rim ─────────────────────────────────
  // At the bowl opening (t = 0.5, the first bowl slice), connect inner and outer
  const rimIndices: number[] = [];
  const outerRimStart = BOWL_START_SLICE * RING_PTS;
  const innerRimStart = innerOffset;

  for (let j = 0; j < RING_PTS; j++) {
    const j1 = (j + 1) % RING_PTS;
    const oa = outerRimStart + j;
    const ob = outerRimStart + j1;
    const ia = innerRimStart + j;
    const ib = innerRimStart + j1;

    rimIndices.push(oa, ia, ob);
    rimIndices.push(ob, ia, ib);
  }

  // Also connect at the tip (top of bowl)
  const outerTipStart = SLICES * RING_PTS;
  const innerTipStart = innerOffset + BOWL_SLICES * RING_PTS;

  for (let j = 0; j < RING_PTS; j++) {
    const j1 = (j + 1) % RING_PTS;
    const oa = outerTipStart + j;
    const ob = outerTipStart + j1;
    const ia = innerTipStart + j;
    const ib = innerTipStart + j1;

    rimIndices.push(oa, ob, ia);
    rimIndices.push(ob, ib, ia);
  }

  // Cap the inner bowl at the tip (top)
  const innerTipCapCenter = (outerVerts.length + innerVerts.length) / 3;
  // We need to add this center vertex
  const tipY = lerp(yMin, yMax, 1.0);
  const tipCapVerts = [0, tipY - 0.05, 0]; // slightly depressed center

  const tipCapIndices: number[] = [];
  for (let j = 0; j < RING_PTS; j++) {
    const j1 = (j + 1) % RING_PTS;
    tipCapIndices.push(innerTipCapCenter, innerTipStart + j, innerTipStart + j1);
  }

  // ── Assemble final geometry ──────────────────────────────────────────
  const allVerts = new Float32Array([
    ...outerVerts,
    ...innerVerts,
    ...tipCapVerts,
  ]);
  const allIndices = [
    ...outerIndices,
    ...innerIndices,
    ...rimIndices,
    ...tipCapIndices,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(allVerts, 3));
  geometry.setIndex(allIndices);
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
    // Scale outward slightly for glow shell
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      // Compute radial direction from spine (X, Z only)
      const rx = arr[i];
      const rz = arr[i + 2];
      const rLen = Math.sqrt(rx * rx + rz * rz);
      if (rLen > 0.005) {
        const expand = 1.06;
        arr[i] *= expand;
        arr[i + 2] *= expand;
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

        // Normalize height to 0..1 range (handle at -1.5, bowl at 1.0)
        const heightNorm = (oy + 1.5) / 2.5;

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
          const bendAmount = heightNorm * heightNorm * 0.6;
          const bendDir = Math.sin(time * 0.8) * 0.3 + 0.7;
          ox += bendAmount * bendDir * p1Strength;
          oz += Math.sin(heightNorm * Math.PI) * 0.1 * p1Strength * Math.cos(time * 1.2);
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
          const pulse = Math.sin(heightNorm * Math.PI * 2 + time * 3) * 0.03 * p2Strength;
          ox += ox * pulse;
          oz += oz * pulse;
        }

        // ── Phase 3 (9-12s): Reform with spring-back oscillation ──
        const p3Strength = smoothstep(8.5, 9.5, cycleTime) * (1 - smoothstep(11.5, 12.0, cycleTime));
        if (p3Strength > 0) {
          const reformTime = cycleTime - 9.0;
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
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner solid for depth */}
      <mesh ref={solidRef} geometry={solidGeo}>
        <meshBasicMaterial
          color={DARK_GREEN}
          transparent
          opacity={0.4}
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
          opacity={0.1}
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

// ── Auto-orbiting camera ───────────────────────────────────────────────
function AutoCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const radius = 4.0 + Math.sin(t * 0.15) * 0.5;
    const angle = t * 0.12;
    const height = Math.sin(t * 0.1) * 0.6;

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
