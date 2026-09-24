"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { buildGlyphAtlas } from "./corridor/GlyphAtlas";
import { CodeClock } from "./corridor/CodeMaterial";
import { CodeHall } from "./corridor/CodeHall";

// ─── Resume hall ────────────────────────────────────────────────────────────
// The set behind the resume decoder: a long glyph-built hall seen from just
// inside its mouth, lit by the doorway at the far end. The camera breathes and
// leans with the pointer so the text in front of it reads as a hologram
// floating in the room.

function HallCamera() {
  const target = useRef(new THREE.Vector3()).current;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const px = state.pointer.x, py = state.pointer.y;
    const cam = state.camera;
    cam.position.x += (px * 0.9 + Math.sin(t * 0.23) * 0.12 - cam.position.x) * 0.04;
    cam.position.y += (0.3 + py * 0.5 + Math.cos(t * 0.19) * 0.08 - cam.position.y) * 0.04;
    cam.position.z += (3.2 + Math.sin(t * 0.09) * 0.4 - cam.position.z) * 0.02;
    target.set(px * 0.35, 0.2 + py * 0.2, -20);
    cam.lookAt(target);
  });
  return null;
}

function Scene() {
  const atlas = useMemo(() => buildGlyphAtlas(), []);
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0005), []);
  return (
    <>
      <HallCamera />
      <CodeClock />
      <CodeHall atlas={atlas} width={14} height={8} depth={44} floorY={-2.4} backZ={-38} tendrils={30} motes={700} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.5} luminanceThreshold={0.28} luminanceSmoothing={0.8} mipmapBlur />
        <Vignette darkness={0.55} offset={0.22} />
        <ChromaticAberration offset={caOffset} radialModulation={false} />
      </EffectComposer>
    </>
  );
}

export default function ResumeHallScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.3, 3.2], fov: 58, near: 0.1, far: 120 }}
      style={{ background: "#000000", width: "100%", height: "100%" }}
    >
      <Scene />
    </Canvas>
  );
}
