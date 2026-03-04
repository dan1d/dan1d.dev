import * as THREE from "three";
import { RainSurface } from "./RainSurface";

/**
 * Small reusable rain-covered panel for architectural elements.
 * Wraps RainSurface with sensible defaults — use for doors, frames, trim, etc.
 */

export interface RainPanelProps {
  atlas: THREE.CanvasTexture;
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  height: number;
  /** Characters per unit — higher = denser text */
  density?: "low" | "medium" | "high";
  brightness?: number;
  baseBrightness?: number;
  speed?: number;
  fogFar?: number;
}

const DENSITY_FACTOR = { low: 6, medium: 14, high: 22 };

export function RainPanel({
  atlas,
  position,
  rotation = [0, 0, 0],
  width,
  height,
  density = "medium",
  brightness = 0.8,
  baseBrightness = 0.15,
  speed = 1.0,
  fogFar,
}: RainPanelProps) {
  const f = DENSITY_FACTOR[density];
  const cols = Math.max(4, Math.round(width * f));
  const rows = Math.max(4, Math.round(height * f));

  return (
    <RainSurface
      atlas={atlas}
      position={position}
      rotation={rotation}
      size={[width, height]}
      cols={cols}
      rows={rows}
      speed={speed}
      bright={brightness}
      base={baseBrightness}
      fogFar={fogFar}
    />
  );
}
