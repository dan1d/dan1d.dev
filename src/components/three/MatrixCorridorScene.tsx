"use client";

import { Component, useMemo, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import * as THREE from "three";

import {
  buildGlyphAtlas,
  RainSurface,
  CinematicCamera,
  CorridorStructure,
  CoderDesk,
  CORRIDOR,
} from "./corridor";

// ─── Error Boundary ─────────────────────────────────────────────────────────
// R3F Canvas children contain Three.js objects with circular parent/children
// references. If an error occurs inside the scene graph, React/Next.js tries
// to JSON.stringify the component tree which crashes with "Converting circular
// structure to JSON". This boundary catches that gracefully.

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── Main Corridor Scene ────────────────────────────────────────────────────

function CorridorScene({ onIntroComplete }: { onIntroComplete?: () => void }) {
  const atlas = useMemo(() => buildGlyphAtlas(), []);
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);

  const { W, H, D } = CORRIDOR;

  return (
    <>
      <ambientLight intensity={0.025} />
      <CinematicCamera onIntroComplete={onIntroComplete} chromaticOffset={caOffset} />

      {/* Rain surfaces — all surfaces match floor density (~35 chars/unit) */}
      {/* Walls: D=30 → 400 cols, H=3.5 → 47 rows */}
      <RainSurface atlas={atlas} position={[-W / 2, 0, -D / 2]} rotation={[0, Math.PI / 2, 0]}
        size={[D, H]} cols={400} rows={47} speed={0.8} bright={1.6} base={0.35} fogFar={42} />
      <RainSurface atlas={atlas} position={[W / 2, 0, -D / 2]} rotation={[0, -Math.PI / 2, 0]}
        size={[D, H]} cols={400} rows={47} speed={0.8} bright={1.6} base={0.35} fogFar={42} />
      {/* Floor: W=4 → 140 cols, D=30 → 400 rows */}
      <RainSurface atlas={atlas} position={[0, -H / 2, -D / 2]} rotation={[-Math.PI / 2, 0, 0]}
        size={[W, D]} cols={140} rows={400} speed={0.8} bright={1.6} base={0.35} fogFar={42} />
      {/* Ceiling: same as floor */}
      <RainSurface atlas={atlas} position={[0, H / 2, -D / 2]} rotation={[Math.PI / 2, 0, 0]}
        size={[W, D]} cols={140} rows={400} speed={0.8} bright={1.6} base={0.35} fogFar={42} />
      {/* Back wall: W=4 → 140 cols, H=3.5 → 47 rows */}
      <RainSurface atlas={atlas} position={[0, 0, -D]} rotation={[0, 0, 0]}
        size={[W, H]} cols={140} rows={47} speed={0.8} bright={1.6} base={0.35} fogFar={42} />
      {/* Front entrance rain — fills entire screen from camera start at z=5 */}
      <RainSurface atlas={atlas} position={[0, 0, 4]} rotation={[0, 0, 0]}
        size={[20, 14]} cols={700} rows={490} speed={1.0} bright={1.8} base={0.4} fogFar={50} />

      {/* Corridor architectural details — doors, panels, lights */}
      <CorridorStructure atlas={atlas} />

      {/* Coder at desk — someone coding at the end of the corridor */}
      <CoderDesk position={[-0.4, 0, -23]} />

      <EffectComposer>
        <Bloom intensity={2.0} luminanceThreshold={0.15} luminanceSmoothing={0.85} mipmapBlur />
        <Vignette darkness={0.5} offset={0.25} />
        <ChromaticAberration offset={caOffset} radialModulation={false} />
      </EffectComposer>
    </>
  );
}

// ─── Exported Component ─────────────────────────────────────────────────────

export default function MatrixCorridorScene({ onIntroComplete }: { onIntroComplete?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const fallback = <div className="absolute inset-0 bg-black" data-testid="hero-canvas" />;

  if (!mounted) return fallback;

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Canvas
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 60 }}
        style={{ background: "#000000" }}
        data-testid="hero-canvas"
      >
        <CorridorScene onIntroComplete={onIntroComplete} />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
