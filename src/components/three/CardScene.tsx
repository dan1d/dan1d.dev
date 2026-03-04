"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 2.5 + Math.sin(i * 1.7) * 0.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(i * 0.9) * 1.5;
        const size = 0.04 + (i % 3) * 0.02;

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[size, 6, 6]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#06b6d4" : "#8b5cf6"}
              transparent
              opacity={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 4]} intensity={0.6} color="#06b6d4" distance={10} />
      <pointLight position={[3, 2, -2]} intensity={0.4} color="#8b5cf6" distance={8} />

      <Stars
        radius={60}
        depth={40}
        count={1500}
        factor={2}
        saturation={0.3}
        fade
        speed={0.2}
      />

      <FloatingParticles />
    </>
  );
}

export default function CardScene() {
  return (
    <div data-testid="card-canvas" className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
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
