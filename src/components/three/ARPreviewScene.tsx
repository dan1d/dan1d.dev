"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";

function RotatingCrystal() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.6;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.3;
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <mesh ref={meshRef} scale={0.55}>
      <octahedronGeometry args={[1, 0]} />
      <MeshTransmissionMaterial
        backside
        samples={4}
        thickness={0.5}
        chromaticAberration={0.08}
        anisotropy={0.3}
        distortion={0.15}
        distortionScale={0.5}
        temporalDistortion={0.1}
        color="#00ff41"
        attenuationColor="#0aff0a"
        attenuationDistance={0.5}
      />
    </mesh>
  );
}

export default function ARPreviewScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[2, 3, 2]} intensity={1.5} color="#00ff41" />
      <pointLight position={[-2, -1, -2]} intensity={0.8} color="#0aff0a" />
      <RotatingCrystal />
      <Environment preset="city" />
    </Canvas>
  );
}
