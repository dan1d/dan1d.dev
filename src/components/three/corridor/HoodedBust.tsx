import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { createCodeMaterial } from "./CodeMaterial";

// ─── The Operator ───────────────────────────────────────────────────────────
// A hooded bust built from falling code: deep hood with a peak pulled over the
// brow, a face in near-black, glasses lit from within with a drifting scan
// line, shoulders and the top of a hoodie. It breathes, turns slowly toward
// the viewer and back, and floats over a rotating ring of code. Standalone —
// brings its own materials — so it can live in any scene.

export interface HoodedBustProps {
  atlas: THREE.Texture;
  position?: [number, number, number];
  scale?: number;
}

export function HoodedBust({ atlas, position = [0, 0, 0], scale = 1 }: HoodedBustProps) {
  const M = useMemo(() => {
    const code = (o: Parameters<typeof createCodeMaterial>[1]) => createCodeMaterial(atlas, o);
    return {
      hood: code({ scale: 22, base: 0.18, bright: 2.0, speed: 1.5, rim: 0.35, fill: 0.014, tint: [0.15, 1.0, 0.4] }),
      hoodie: code({ scale: 16, base: 0.12, bright: 1.6, rim: 1.0, fill: 0.008 }),
      shadow: code({ scale: 40, base: 0.03, bright: 0.5, rim: 0.1, fill: 0.0 }),
      frame: code({ scale: 30, base: 0.12, bright: 1.2, rim: 0.6, fill: 0.006 }),
      ring: code({ scale: 18, base: 0.3, bright: 1.8, speed: 2.0, rim: 1.2, fill: 0.02, tint: [0.3, 1.0, 0.5] }),
      lens: new THREE.MeshBasicMaterial({ color: "#00ff41", toneMapped: false }),
      scan: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    };
  }, [atlas]);

  const rig = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const scan = useRef<THREE.Mesh>(null);
  const lensBase = useMemo(() => new THREE.Color("#00ff41"), []);
  const lensHot = useMemo(() => new THREE.Color("#c8ffd8"), []);
  // Animated materials mirrored into a ref so useFrame can drive them
  const anim = useRef<{ lens: THREE.MeshBasicMaterial; scan: THREE.MeshBasicMaterial } | null>(null);
  useEffect(() => { anim.current = { lens: M.lens, scan: M.scan }; }, [M]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rig.current) {
      rig.current.position.y = position[1] + Math.sin(t * 0.8) * 0.012;
      rig.current.rotation.y = Math.sin(t * 0.21) * 0.35;
      rig.current.scale.setScalar(scale * (1 + Math.sin(t * 1.4) * 0.004));
    }
    if (head.current) {
      head.current.rotation.x = 0.1 + Math.sin(t * 0.9) * 0.025;
      head.current.rotation.y = Math.sin(t * 0.37) * 0.08;
    }
    if (ring.current) ring.current.rotation.z = t * 0.25;
    const breathe = 0.7 + 0.3 * Math.sin(t * 1.7);
    const flick = Math.sin(t * 23.0) > 0.985 ? 1 : 0;
    const a = anim.current;
    if (a) a.lens.color.copy(lensBase).lerp(lensHot, Math.min(1, breathe * 0.35 + flick));
    if (scan.current) {
      scan.current.position.y = ((t * 0.35) % 1) * 0.04 - 0.02;
      if (a) a.scan.opacity = 0.35 + 0.25 * Math.sin(t * 3.0);
    }
  });

  const gz = 0.098, gy = 0.012;

  return (
    <group ref={rig} position={position} scale={scale}>
      {/* Shoulders and the top of the hoodie */}
      <mesh position={[0, -0.62, -0.02]} rotation={[0.08, 0, 0]} material={M.hoodie}>
        <capsuleGeometry args={[0.24, 0.3, 6, 20]} />
      </mesh>
      <mesh position={[-0.26, -0.36, -0.02]} material={M.hoodie}><sphereGeometry args={[0.1, 18, 14]} /></mesh>
      <mesh position={[0.26, -0.36, -0.02]} material={M.hoodie}><sphereGeometry args={[0.1, 18, 14]} /></mesh>
      {/* Neck */}
      <mesh position={[0, -0.16, 0]} material={M.hoodie}>
        <cylinderGeometry args={[0.055, 0.07, 0.12, 14]} />
      </mesh>

      {/* Head */}
      <group ref={head}>
        <mesh position={[0, 0, 0.01]} material={M.shadow}>
          <sphereGeometry args={[0.1, 24, 18]} />
        </mesh>
        {/* Hood shell, open toward +z, drooping over the brow */}
        <mesh position={[0, 0.04, -0.04]} rotation={[0.3, 0, 0]} scale={[1, 1.14, 1.1]} material={M.hood}>
          <sphereGeometry args={[0.17, 32, 24, Math.PI / 2 + 0.62, Math.PI * 2 - 1.24, 0, Math.PI * 0.76]} />
        </mesh>
        <mesh position={[0, 0.04, -0.04]} rotation={[0.3, 0, 0]} scale={[1, 1.14, 1.1]} material={M.hood}>
          <sphereGeometry args={[0.155, 32, 24, Math.PI / 2 + 0.62, Math.PI * 2 - 1.24, 0, Math.PI * 0.76]} />
        </mesh>
        <mesh position={[0, 0.16, 0.02]} rotation={[0.55, 0, 0]} material={M.hood}>
          <coneGeometry args={[0.13, 0.16, 20, 1, true]} />
        </mesh>
        {/* Hood falling to the shoulders */}
        <mesh position={[0, -0.2, -0.06]} rotation={[0.15, 0, 0]} material={M.hood}>
          <cylinderGeometry args={[0.175, 0.3, 0.22, 24, 1, true]} />
        </mesh>

        {/* Glasses */}
        <group position={[0, gy, gz]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.041, 0, 0]}>
              <RoundedBox args={[0.052, 0.034, 0.006]} radius={0.008} smoothness={3} material={M.lens} />
              <RoundedBox args={[0.06, 0.042, 0.004]} radius={0.01} smoothness={3} position={[0, 0, -0.002]} material={M.frame} />
            </group>
          ))}
          <mesh position={[0, 0.004, -0.001]} material={M.frame}>
            <boxGeometry args={[0.024, 0.004, 0.004]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.074, 0.006, -0.05]} material={M.frame}>
              <boxGeometry args={[0.004, 0.004, 0.1]} />
            </mesh>
          ))}
          <mesh ref={scan} position={[0, 0, 0.004]} material={M.scan}>
            <planeGeometry args={[0.16, 0.004]} />
          </mesh>
        </group>
      </group>

      {/* Ring of code under the bust */}
      <mesh ref={ring} position={[0, -0.86, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.ring}>
        <torusGeometry args={[0.55, 0.018, 10, 96]} />
      </mesh>
      <mesh position={[0, -0.86, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.ring}>
        <torusGeometry args={[0.42, 0.008, 8, 80]} />
      </mesh>

      {/* Dust in the glow */}
      <Sparkles count={90} position={[0, -0.1, 0]} scale={[1.3, 1.5, 1.0]} size={1.4} speed={0.2} opacity={0.5} color="#a8ffc0" noise={0.8} />
    </group>
  );
}
