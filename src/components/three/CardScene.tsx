"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// ── Constants ──────────────────────────────────────────────────────────
const GREEN = "#00ff41";
const BRIGHT_GREEN = "#39ff14";
const PARTICLE_COUNT = 120;

// Characters for the glyph atlas — Latin + digits + symbols only (NO katakana/CJK)
const GLYPH_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>{}[]";
const GLYPH_COLS = 7;
const GLYPH_ROWS = Math.ceil(GLYPH_CHARS.length / GLYPH_COLS);

// ── Glyph atlas builder ────────────────────────────────────────────────
function buildGlyphAtlas(): THREE.CanvasTexture {
  const cellSize = 64;
  const canvas = document.createElement("canvas");
  canvas.width = GLYPH_COLS * cellSize;
  canvas.height = GLYPH_ROWS * cellSize;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${cellSize * 0.7}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < GLYPH_CHARS.length; i++) {
    const col = i % GLYPH_COLS;
    const row = Math.floor(i / GLYPH_COLS);
    const x = col * cellSize + cellSize / 2;
    const y = row * cellSize + cellSize / 2;
    ctx.fillText(GLYPH_CHARS[i], x, y);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ── Shader code ────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Breathing displacement — subtle pulse outward/inward
    float breath = sin(uTime * 0.8) * 0.02 + sin(uTime * 1.3 + position.y * 3.0) * 0.015;
    vec3 displaced = position + normal * breath;

    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uGlyphAtlas;
  uniform float uGlyphCols;
  uniform float uGlyphRows;
  uniform float uTotalGlyphs;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  // ── Pseudo-random ──
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // Grid parameters
    float cols = 48.0;
    float rows = 80.0;

    // Cell coordinates
    vec2 cellSize = vec2(1.0 / cols, 1.0 / rows);
    float colIdx = floor(vUv.x * cols);
    float rowIdx = floor(vUv.y * rows);

    // Local UV within cell
    vec2 cellUv = fract(vec2(vUv.x * cols, vUv.y * rows));

    // Per-column random properties
    float colSeed = hash(colIdx * 13.37);
    float colSpeed = 0.5 + colSeed * 1.5; // different fall speeds
    float colOffset = hash(colIdx * 7.13) * 100.0;
    float colBrightBase = 0.3 + hash(colIdx * 3.91) * 0.4;

    // Rain drop parameters
    float dropLength = 6.0 + hash(colIdx * 11.3) * 14.0; // how many cells long
    float scrollPos = uTime * colSpeed + colOffset;

    // Which "drop" are we in? Each drop cycles through the column
    float dropCycle = rows + dropLength;
    float localPos = mod(rowIdx + scrollPos * rows, dropCycle);

    // Distance from head of the drop (head is at localPos == 0)
    float distFromHead = localPos;

    // Brightness falloff from head
    float dropBrightness = 0.0;
    if (distFromHead < dropLength) {
      // Head is brightest, fades along tail
      float t = distFromHead / dropLength;
      dropBrightness = (1.0 - t) * (1.0 - t); // quadratic falloff
    }

    // Character selection — changes over time for living effect
    float charChangeSpeed = 3.0 + hash(colIdx * 5.7 + rowIdx * 2.3) * 8.0;
    float charIdx = floor(hash2(vec2(colIdx, rowIdx + floor(uTime * charChangeSpeed))) * uTotalGlyphs);
    charIdx = mod(charIdx, uTotalGlyphs);

    // Look up glyph from atlas
    float glyphCol = mod(charIdx, uGlyphCols);
    float glyphRow = floor(charIdx / uGlyphCols);

    vec2 glyphUv = vec2(
      (glyphCol + cellUv.x) / uGlyphCols,
      (glyphRow + cellUv.y) / uGlyphRows
    );

    vec4 glyphColor = texture2D(uGlyphAtlas, glyphUv);
    float glyphAlpha = glyphColor.r; // white on transparent = use red channel

    // Color mixing: head is bright white-green, tail fades to deep green
    vec3 darkGreen = vec3(0.0, 0.15, 0.02);
    vec3 baseGreen = vec3(0.0, 1.0, 0.255); // #00ff41
    vec3 brightHead = vec3(0.8, 1.0, 0.85); // near-white green

    float headProximity = 1.0 - smoothstep(0.0, 3.0, distFromHead);
    vec3 charColor = mix(darkGreen, baseGreen, dropBrightness);
    charColor = mix(charColor, brightHead, headProximity * dropBrightness);

    // Add flicker to individual characters
    float flicker = 0.85 + 0.15 * sin(uTime * 15.0 + colIdx * 7.0 + rowIdx * 13.0);
    dropBrightness *= flicker;

    // Fresnel-like edge glow for sphere depth
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
    float edgeGlow = fresnel * 0.3;

    // Final alpha
    float alpha = glyphAlpha * dropBrightness + edgeGlow * 0.15;

    // Final color
    vec3 finalColor = charColor * glyphAlpha * dropBrightness + vec3(0.0, edgeGlow * 0.4, edgeGlow * 0.1);

    // Subtle random sparkle on some cells
    float sparkle = step(0.97, hash2(vec2(colIdx + floor(uTime * 2.0), rowIdx))) * 0.5;
    finalColor += vec3(sparkle * 0.3, sparkle, sparkle * 0.4) * glyphAlpha;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ── Code Sphere component ──────────────────────────────────────────────
function CodeSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  const glyphAtlas = useMemo(() => buildGlyphAtlas(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGlyphAtlas: { value: glyphAtlas },
      uGlyphCols: { value: GLYPH_COLS },
      uGlyphRows: { value: GLYPH_ROWS },
      uTotalGlyphs: { value: GLYPH_CHARS.length },
    }),
    [glyphAtlas]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;

    if (meshRef.current) {
      // Slow Y rotation + slight X wobble
      meshRef.current.rotation.y = t * 0.08;
      meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.1;
      meshRef.current.rotation.z = Math.sin(t * 0.12) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ── Inner glow sphere ──────────────────────────────────────────────────
function InnerGlow() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.04 + Math.sin(t * 0.6) * 0.02;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.85, 32, 32]} />
      <meshBasicMaterial
        color={GREEN}
        transparent
        opacity={0.05}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Ambient particles ──────────────────────────────────────────────────
function AmbientParticles() {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds, phases } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);
    const phs = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribute in a shell around the sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 3.0;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      spd[i] = 0.2 + Math.random() * 0.5;
      phs[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, speeds: spd, phases: phs };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = ref.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Gentle orbital drift
      const angle = t * speeds[i] * 0.1 + phases[i];
      const ox = arr[i3];
      const oz = arr[i3 + 2];
      const r = Math.sqrt(ox * ox + oz * oz);

      arr[i3] = Math.cos(angle) * r;
      arr[i3 + 1] += Math.sin(t * speeds[i] + phases[i]) * 0.001;
      arr[i3 + 2] = Math.sin(angle) * r;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={GREEN}
        size={0.03}
        transparent
        opacity={0.6}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Camera auto-orbit ──────────────────────────────────────────────────
function AutoCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const radius = 5 + Math.sin(t * 0.1) * 0.5;
    const angle = t * 0.08;
    const height = Math.sin(t * 0.06) * 0.8;

    state.camera.position.set(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Pulsing center light ───────────────────────────────────────────────
function CenterLight() {
  const ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.intensity = 1.0 + Math.sin(t * 0.5) * 0.4;
    }
  });

  return (
    <pointLight
      ref={ref}
      position={[0, 0, 0]}
      color={BRIGHT_GREEN}
      intensity={1.0}
      distance={8}
      decay={2}
    />
  );
}

// ── Main scene ─────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.03} color={GREEN} />
      <CenterLight />

      <fog attach="fog" args={["#000a00", 6, 16]} />

      <Stars
        radius={60}
        depth={50}
        count={600}
        factor={1.2}
        saturation={0.1}
        fade
        speed={0.1}
      />

      <CodeSphere />
      <InnerGlow />
      <AmbientParticles />
      <AutoCamera />
    </>
  );
}

// ── Export ──────────────────────────────────────────────────────────────
export default function CardScene() {
  return (
    <div data-testid="card-canvas" className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
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
