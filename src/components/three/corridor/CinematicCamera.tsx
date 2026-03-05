import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface CinematicCameraProps {
  onIntroComplete?: () => void;
  chromaticOffset: THREE.Vector2;
}

export function CinematicCamera({ onIntroComplete, chromaticOffset }: CinematicCameraProps) {
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

    chromaticOffset.set(caX, caY);

    if (t >= 7.5 && !doneRef.current) {
      doneRef.current = true;
      onIntroComplete?.();
    }
  });

  return null;
}
