"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import * as THREE from "three";

// ─── Glyph Atlas (16×16 grid, Katakana + Latin + digits) ────────────────────

function buildGlyphAtlas(): THREE.CanvasTexture {
  const S = 64, C = 16;
  const W = C * S, H = C * S;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${S - 8}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars: string[] = [];
  for (let cp = 0x30a0; cp <= 0x30ff; cp++) chars.push(String.fromCodePoint(cp));
  for (let i = 0; i < 26; i++) chars.push(String.fromCharCode(65 + i));
  for (let i = 0; i <= 9; i++) chars.push(String(i));

  for (let i = 0; i < C * C; i++) {
    const col = i % C, row = Math.floor(i / C);
    ctx.fillText(chars[i % chars.length], col * S + S / 2, row * S + S / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

// ─── Agent Smith Silhouette Texture ──────────────────────────────────────────

function buildAgentTexture(): THREE.CanvasTexture {
  const W = 128, H = 320;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";

  // Head
  ctx.beginPath();
  ctx.ellipse(64, 30, 13, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillRect(57, 47, 14, 8);

  // Torso (suit jacket, angular shoulders)
  ctx.beginPath();
  ctx.moveTo(22, 62);
  ctx.lineTo(44, 55);
  ctx.lineTo(64, 52);
  ctx.lineTo(84, 55);
  ctx.lineTo(106, 62);
  ctx.lineTo(100, 155);
  ctx.lineTo(28, 155);
  ctx.closePath();
  ctx.fill();

  // Left arm
  ctx.beginPath();
  ctx.moveTo(22, 62);
  ctx.lineTo(12, 66);
  ctx.lineTo(8, 145);
  ctx.lineTo(20, 147);
  ctx.lineTo(28, 90);
  ctx.closePath();
  ctx.fill();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(106, 62);
  ctx.lineTo(116, 66);
  ctx.lineTo(120, 145);
  ctx.lineTo(108, 147);
  ctx.lineTo(100, 90);
  ctx.closePath();
  ctx.fill();

  // Hands
  ctx.fillRect(4, 143, 18, 8);
  ctx.fillRect(106, 143, 18, 8);

  // Jacket flare
  ctx.beginPath();
  ctx.moveTo(28, 155);
  ctx.lineTo(24, 182);
  ctx.lineTo(104, 182);
  ctx.lineTo(100, 155);
  ctx.closePath();
  ctx.fill();

  // Left leg
  ctx.fillRect(34, 182, 22, 118);
  // Right leg
  ctx.fillRect(72, 182, 22, 118);

  // Shoes
  ctx.fillRect(30, 298, 30, 12);
  ctx.fillRect(68, 298, 30, 12);

  // Sunglasses bar
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(48, 24, 32, 5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Shader-Based Rain Surface ──────────────────────────────────────────────

const RAIN_VERT = `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vDist = length(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const RAIN_FRAG = `
  uniform sampler2D uAtlas;
  uniform float uTime;
  uniform float uCols;
  uniform float uRows;
  uniform float uSpeed;
  uniform float uBright;
  uniform float uBase;
  varying vec2 vUv;
  varying float vDist;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float fog = smoothstep(28.0, 2.0, vDist);
    if (fog < 0.01) discard;

    vec2 grid = vec2(uCols, uRows);
    vec2 id = floor(vUv * grid);
    vec2 cell = fract(vUv * grid);

    // Per-column random properties
    float cH = hash(vec2(id.x, 0.0));
    float speed = (0.3 + cH * 1.4) * uSpeed;
    float phase = hash(vec2(id.x, 7.3)) * 60.0;
    float tLen = 4.0 + hash(vec2(id.x, 13.7)) * 10.0;

    // Rain head position (top-to-bottom)
    float headPos = mod(uTime * speed + phase, uRows + tLen + 5.0);
    float rowTop = uRows - id.y;
    float d = headPos - rowTop;

    // Trail brightness
    float trail = 0.0;
    float isHead = 0.0;
    if (d > 0.0 && d < 1.5) {
      trail = 1.0;
      isHead = 1.0;
    } else if (d >= 1.5 && d < tLen) {
      float t = (d - 1.5) / (tLen - 1.5);
      trail = (1.0 - t) * (1.0 - t);
    }

    float bright = max(uBase, trail);

    // Character from atlas (buzzes periodically)
    float buzzRate = 4.0 + cH * 4.0;
    float seed = hash(id + floor(uTime * buzzRate) * 0.013);
    float ci = floor(seed * 256.0);
    vec2 atlasPos = vec2(mod(ci, 16.0), floor(ci / 16.0));
    vec2 atlasUv = (atlasPos + cell) / 16.0;
    float charA = texture2D(uAtlas, atlasUv).r;

    float alpha = charA * bright * uBright * fog;
    if (alpha < 0.015) discard;

    // Head chars are white-green, trail is green
    vec3 color;
    if (isHead > 0.5) {
      color = vec3(0.65, 1.0, 0.75);
    } else {
      color = vec3(0.0, 0.4 + bright * 0.6, 0.06 + bright * 0.14);
    }

    gl_FragColor = vec4(color * bright, alpha);
  }
`;

interface RainSurfaceProps {
  atlas: THREE.CanvasTexture;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  cols: number;
  rows: number;
  speed: number;
  bright: number;
  base: number;
}

function RainSurface({ atlas, position, rotation, size, cols, rows, speed, bright, base }: RainSurfaceProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAtlas: { value: atlas },
          uTime: { value: 0 },
          uCols: { value: cols },
          uRows: { value: rows },
          uSpeed: { value: speed },
          uBright: { value: bright },
          uBase: { value: base },
        },
        vertexShader: RAIN_VERT,
        fragmentShader: RAIN_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [atlas, cols, rows, speed, bright, base]
  );

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

// ─── Agent Figure ───────────────────────────────────────────────────────────

function AgentFigure({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const tex = useMemo(() => buildAgentTexture(), []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0] * 5) * 0.03;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Dark body */}
      <mesh scale={[scale * 0.9, scale * 2.4, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.1} color="#020502" side={THREE.DoubleSide} />
      </mesh>
      {/* Green rim glow */}
      <mesh position={[0, 0, -0.02]} scale={[scale * 0.96, scale * 2.48, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={0.15}
          color="#00ff41"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Cinematic Camera ───────────────────────────────────────────────────────

function CinematicCamera({
  onIntroComplete,
  chromaticRef,
}: {
  onIntroComplete?: () => void;
  chromaticRef: React.RefObject<unknown>;
}) {
  const { camera } = useThree();
  const doneRef = useRef(false);
  const t0Ref = useRef(-1);

  useFrame(({ clock }) => {
    if (t0Ref.current < 0) t0Ref.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0Ref.current;

    let x = 0, y = 0, z = 5;
    let caX = 0.0006, caY = 0.0006;

    if (t < 0.8) {
      z = 5;
    } else if (t < 3.0) {
      // Slow approach to corridor entrance
      const p = (t - 0.8) / 2.2;
      const e = p * p * (3 - 2 * p);
      z = 5 - e * 4; // 5 → 1
      x = Math.sin(t * 0.4) * 0.06;
      y = Math.cos(t * 0.35) * 0.04;
    } else if (t < 5.5) {
      // Accelerate into corridor
      const p = (t - 3.0) / 2.5;
      const e = p * p;
      z = 1 - e * 11; // 1 → -10
      x = Math.sin(t * 0.65) * 0.12;
      y = Math.cos(t * 0.5) * 0.06;
    } else if (t < 6.0) {
      // Glitch — camera shake + chromatic spike
      z = -10 + (Math.random() - 0.5) * 0.4;
      x = (Math.random() - 0.5) * 0.35;
      y = (Math.random() - 0.5) * 0.2;
      caX = (Math.random() - 0.5) * 0.02;
      caY = (Math.random() - 0.5) * 0.02;
    } else if (t < 7.5) {
      // Hard zoom toward figures
      const p = (t - 6.0) / 1.5;
      const e = 1 - Math.pow(1 - p, 3);
      z = -10 - e * 6; // -10 → -16
      x = Math.sin(t * 0.3) * 0.03 * (1 - p);
      y = 0;
      const fade = Math.max(0.0006, (1 - p) * 0.005);
      caX = fade;
      caY = fade;
    } else {
      // Background drift
      const dt = t - 7.5;
      z = -16 + Math.sin(dt * 0.12) * 0.3;
      x = Math.sin(dt * 0.2) * 0.08;
      y = Math.cos(dt * 0.17) * 0.05;
    }

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, z - 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ca = chromaticRef.current as any;
    if (ca?.offset) {
      try { ca.offset.set(caX, caY); } catch { /* noop */ }
    }

    if (t >= 7.5 && !doneRef.current) {
      doneRef.current = true;
      onIntroComplete?.();
    }
  });

  return null;
}

// ─── Central Glow + Particles ───────────────────────────────────────────────

function CentralGlow() {
  return (
    <group position={[0, 0, -28]}>
      <pointLight color="#00ff41" intensity={10} distance={20} decay={2} />
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.04} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function FloatingParticles({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 4;
      a[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      a[i * 3 + 2] = Math.random() * -30;
    }
    return a;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 2] += delta * 2.5;
      if (p[i * 3 + 2] > 4) {
        p[i * 3 + 2] = -30;
        p[i * 3] = (Math.random() - 0.5) * 4;
        p[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#39ff14" size={0.012} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ─── Main Corridor Scene ────────────────────────────────────────────────────

function CorridorScene({ onIntroComplete }: { onIntroComplete?: () => void }) {
  const atlas = useMemo(() => buildGlyphAtlas(), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caRef = useRef<any>(null);
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);

  const W = 4, H = 3.5, D = 30;

  return (
    <>
      <ambientLight intensity={0.005} />
      <CinematicCamera onIntroComplete={onIntroComplete} chromaticRef={caRef} />

      {/* Left wall */}
      <RainSurface atlas={atlas} position={[-W / 2, 0, -D / 2]} rotation={[0, Math.PI / 2, 0]}
        size={[D, H]} cols={90} rows={30} speed={1.2} bright={0.95} base={0.13} />
      {/* Right wall */}
      <RainSurface atlas={atlas} position={[W / 2, 0, -D / 2]} rotation={[0, -Math.PI / 2, 0]}
        size={[D, H]} cols={90} rows={30} speed={1.0} bright={0.95} base={0.13} />
      {/* Floor */}
      <RainSurface atlas={atlas} position={[0, -H / 2, -D / 2]} rotation={[-Math.PI / 2, 0, 0]}
        size={[W, D]} cols={25} rows={80} speed={0.7} bright={0.7} base={0.09} />
      {/* Ceiling */}
      <RainSurface atlas={atlas} position={[0, H / 2, -D / 2]} rotation={[Math.PI / 2, 0, 0]}
        size={[W, D]} cols={25} rows={80} speed={0.8} bright={0.55} base={0.06} />
      {/* Back wall */}
      <RainSurface atlas={atlas} position={[0, 0, -D]} rotation={[0, 0, 0]}
        size={[W, H]} cols={30} rows={25} speed={1.5} bright={1.0} base={0.18} />

      {/* Agent Smith silhouettes */}
      <AgentFigure position={[-0.7, -0.2, -22]} scale={1.05} />
      <AgentFigure position={[0.15, -0.1, -24]} scale={1.25} />
      <AgentFigure position={[0.85, -0.2, -23]} scale={1.0} />

      <CentralGlow />
      <FloatingParticles count={300} />

      <EffectComposer>
        <Bloom intensity={2.5} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette darkness={0.8} offset={0.2} />
        <ChromaticAberration ref={caRef} offset={caOffset} radialModulation={false} />
      </EffectComposer>
    </>
  );
}

// ─── Exported Component ─────────────────────────────────────────────────────

export default function MatrixCorridorScene({ onIntroComplete }: { onIntroComplete?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="absolute inset-0 bg-black" data-testid="hero-canvas" />;

  return (
    <Canvas
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 60 }}
      style={{ background: "#000000" }}
      data-testid="hero-canvas"
    >
      <CorridorScene onIntroComplete={onIntroComplete} />
    </Canvas>
  );
}
