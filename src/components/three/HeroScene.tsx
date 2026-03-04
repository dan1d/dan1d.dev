"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function CrystalPrism() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[1.6, 0]} />
        <MeshDistortMaterial
          color="#06b6d4"
          emissive="#8b5cf6"
          emissiveIntensity={0.25}
          distort={0.3}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

function SecondaryOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.x = Math.sin(t * 0.4) * 2.8;
    meshRef.current.position.y = Math.cos(t * 0.3) * 1.2 - 0.5;
    meshRef.current.rotation.y = t * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.55, 1]} />
      <MeshDistortMaterial
        color="#8b5cf6"
        emissive="#06b6d4"
        emissiveIntensity={0.2}
        distort={0.4}
        speed={3}
        roughness={0.05}
        metalness={0.9}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

function TertiaryOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime + Math.PI;
    meshRef.current.position.x = Math.sin(t * 0.35) * 2.5;
    meshRef.current.position.y = Math.cos(t * 0.25) * 1.4 + 0.3;
    meshRef.current.rotation.x = t * 0.4;
  });

  return (
    <mesh ref={meshRef}>
      <tetrahedronGeometry args={[0.4, 0]} />
      <MeshDistortMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={0.35}
        distort={0.2}
        speed={2.5}
        roughness={0.0}
        metalness={1.0}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      {/* Ambient and directional lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#06b6d4" />
      <directionalLight position={[-5, -5, 3]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 0, 3]} intensity={1.5} color="#06b6d4" distance={8} />
      <pointLight position={[3, 2, -2]} intensity={0.8} color="#8b5cf6" distance={6} />

      {/* Star field background */}
      <Stars
        radius={80}
        depth={50}
        count={3000}
        factor={3}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Main crystal prism */}
      <CrystalPrism />

      {/* Orbiting secondary shapes */}
      <SecondaryOrb />
      <TertiaryOrb />

      {/* Auto-rotating camera controls — no user interaction */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.4}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export default function HeroScene() {
  return (
    <div data-testid="hero-canvas" className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
