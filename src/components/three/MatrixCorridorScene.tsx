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
import { Sparkles, PerformanceMonitor } from "@react-three/drei";
import { CodeArchitecture } from "./corridor/CodeArchitecture";
import { CodeTendrils } from "./corridor/CodeTendrils";
import { CodePortal } from "./corridor/CodePortal";
import { CodeFacade, RainVeil } from "./corridor/CodeFacade";
import { CodeClock } from "./corridor/CodeMaterial";
import type { IntroPhase } from "./corridor";

export type { IntroPhase };

export interface MatrixCorridorSceneProps {
  onIntroComplete?: () => void;
  onPhase?: (phase: IntroPhase) => void;
}

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

function CorridorScene({ onIntroComplete, onPhase }: MatrixCorridorSceneProps) {
  const atlas = useMemo(() => buildGlyphAtlas(), []);
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);

  const { W, H, D } = CORRIDOR;

  return (
    <>
      <ambientLight intensity={0.025} />
      <CinematicCamera onIntroComplete={onIntroComplete} onPhase={onPhase} chromaticOffset={caOffset} />

      {/* Rain surfaces — luminous code fabric: ~30 strands/unit, high resting glow */}
      {/* Walls: D=30 → 900 cols, H=3.5 → 105 rows */}
      <RainSurface atlas={atlas} position={[-W / 2, 0, -D / 2]} rotation={[0, Math.PI / 2, 0]}
        size={[D, H]} cols={900} rows={105} speed={0.9} bright={2.1} base={0.62} fogFar={46} />
      <RainSurface atlas={atlas} position={[W / 2, 0, -D / 2]} rotation={[0, -Math.PI / 2, 0]}
        size={[D, H]} cols={900} rows={105} speed={0.9} bright={2.1} base={0.62} fogFar={46} />
      {/* Floor: W=4 → 120 cols, D=30 → 900 rows */}
      <RainSurface atlas={atlas} position={[0, -H / 2, -D / 2]} rotation={[-Math.PI / 2, 0, 0]}
        size={[W, D]} cols={120} rows={900} speed={0.9} bright={2.0} base={0.6} fogFar={46} />
      {/* Ceiling: same as floor */}
      <RainSurface atlas={atlas} position={[0, H / 2, -D / 2]} rotation={[Math.PI / 2, 0, 0]}
        size={[W, D]} cols={120} rows={900} speed={0.9} bright={2.0} base={0.6} fogFar={46} />
      {/* Back wall: W=4 → 120 cols, H=3.5 → 105 rows */}
      <RainSurface atlas={atlas} position={[0, 0, -D]} rotation={[0, 0, 0]}
        size={[W, H]} cols={120} rows={105} speed={0.9} bright={2.0} base={0.6} fogFar={46} />
      {/* The opening: a veil of rain in front of the lens, and the building it
          resolves into — the corridor is that building's ground-floor hall */}
      <RainVeil atlas={atlas} />
      <CodeFacade atlas={atlas} />

      {/* Corridor architectural details — doors, panels, lights */}
      <CorridorStructure atlas={atlas} />

      {/* Coder at desk — someone coding at the end of the corridor */}
      {/* Corridor bones and the operator's desk — all built from glyphs */}
      <CodeArchitecture atlas={atlas} />
      <CodeTendrils atlas={atlas} />
      <CodePortal atlas={atlas} />
      <CoderDesk position={[-0.4, 0, -23]} atlas={atlas} />
      <CodeClock />

      {/* Drifting motes catching the light the whole length of the hall */}
      <Sparkles count={600} scale={[W - 0.4, H - 0.4, D - 2]} position={[0, 0, -D / 2]}
        size={2.4} speed={0.25} color="#c8ffd8" opacity={0.75} noise={0.6} />

      {/* No MSAA: the composer target defaults to 8 samples, which at Retina
          resolution is the single most expensive thing in the frame. The
          additive glyph surfaces hide aliasing on their own. */}
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.9} luminanceThreshold={0.22} luminanceSmoothing={0.8} mipmapBlur />
        <Vignette darkness={0.5} offset={0.25} />
        <ChromaticAberration offset={caOffset} radialModulation={false} />
      </EffectComposer>
    </>
  );
}

// ─── Exported Component ─────────────────────────────────────────────────────

export default function MatrixCorridorScene({ onIntroComplete, onPhase }: MatrixCorridorSceneProps) {
  const [mounted, setMounted] = useState(false);
  // Pixel ratio is the main fill-rate lever: start at 1.5 and drop to 1 when
  // the monitor sees sustained frame drops (it can climb back on a fast GPU).
  const [dpr, setDpr] = useState(1.5);
  // The first seconds are shader compiles and the veil/facade burst, which
  // would read as a decline; only start judging frame rate once the shot is
  // past the fly-in.
  const [monitor, setMonitor] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const id = setTimeout(() => setMonitor(true), 12000);
    return () => clearTimeout(id);
  }, []);

  const fallback = <div className="absolute inset-0 bg-black" data-testid="hero-canvas" />;

  if (!mounted) return fallback;

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 17.2], fov: 60, near: 0.1, far: 60 }}
        style={{ background: "#000000" }}
        data-testid="hero-canvas"
      >
        {monitor && (
          <PerformanceMonitor ms={400} iterations={8} flipflops={2} onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} onFallback={() => setDpr(1)} />
        )}
        <CorridorScene onIntroComplete={onIntroComplete} onPhase={onPhase} />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
