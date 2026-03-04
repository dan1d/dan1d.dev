import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
  ctx.fillRect(48, 24, 32, 5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export interface AgentFigureProps {
  position: [number, number, number];
  scale?: number;
}

export function AgentFigure({ position, scale = 1 }: AgentFigureProps) {
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
