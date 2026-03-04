import { useMemo } from "react";
import * as THREE from "three";
import { RainPanel } from "./RainPanel";

// Corridor dimensions — exported so the main scene can use them too
export const CORRIDOR = { W: 4, H: 3.5, D: 30 } as const;

// ─── Seeded PRNG for deterministic-per-visit randomization ──────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Rain Door ──────────────────────────────────────────────────────────────
// 3D open door: frame recessed into wall, door panel swung open at an angle

interface RainDoorProps {
  atlas: THREE.CanvasTexture;
  position: [number, number, number];
  side: "left" | "right";
  openAngle?: number; // radians, how far the door swings open (0 = closed, PI/2 = fully open)
}

const DOOR_W = 1.1;
const DOOR_H = 2.4;
const FRAME_T = 0.08;
const RECESS = 0.25;

function RainDoor({ atlas, position, side, openAngle = 1.1 }: RainDoorProps) {
  const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;
  const depthSign = side === "left" ? 1 : -1;
  const floorY = -CORRIDOR.H / 2;

  // Door panel swings open — pivot on hinge side
  const hingeZ = -DOOR_W / 2; // hinge on left edge of door
  const doorSwing = side === "left" ? -openAngle : openAngle;

  return (
    <group position={position}>
      {/* Frame — top */}
      <RainPanel
        atlas={atlas}
        position={[0, floorY + DOOR_H + FRAME_T / 2, 0]}
        rotation={[0, rotY, 0]}
        width={DOOR_W + FRAME_T * 2}
        height={FRAME_T}
        density="high"
        brightness={1.4}
        baseBrightness={0.4}
        speed={3.0}
      />

      {/* Frame — left strip */}
      <RainPanel
        atlas={atlas}
        position={[0, floorY + DOOR_H / 2, -(DOOR_W / 2 + FRAME_T / 2)]}
        rotation={[0, rotY, 0]}
        width={FRAME_T}
        height={DOOR_H + FRAME_T}
        density="high"
        brightness={1.4}
        baseBrightness={0.4}
        speed={3.0}
      />

      {/* Frame — right strip */}
      <RainPanel
        atlas={atlas}
        position={[0, floorY + DOOR_H / 2, DOOR_W / 2 + FRAME_T / 2]}
        rotation={[0, rotY, 0]}
        width={FRAME_T}
        height={DOOR_H + FRAME_T}
        density="high"
        brightness={1.4}
        baseBrightness={0.4}
        speed={3.0}
      />

      {/* Depth — top soffit (ceiling of recess) */}
      <RainPanel
        atlas={atlas}
        position={[depthSign * -RECESS / 2, floorY + DOOR_H, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        width={DOOR_W}
        height={RECESS}
        density="medium"
        brightness={0.7}
        baseBrightness={0.15}
        speed={1.2}
      />

      {/* Depth — left jamb */}
      <RainPanel
        atlas={atlas}
        position={[depthSign * -RECESS / 2, floorY + DOOR_H / 2, -DOOR_W / 2]}
        rotation={[0, 0, 0]}
        width={RECESS}
        height={DOOR_H}
        density="medium"
        brightness={0.7}
        baseBrightness={0.15}
        speed={1.2}
      />

      {/* Depth — right jamb */}
      <RainPanel
        atlas={atlas}
        position={[depthSign * -RECESS / 2, floorY + DOOR_H / 2, DOOR_W / 2]}
        rotation={[0, 0, 0]}
        width={RECESS}
        height={DOOR_H}
        density="medium"
        brightness={0.7}
        baseBrightness={0.15}
        speed={1.2}
      />

      {/* Door panel — swung open, pivoting from hinge edge */}
      <group position={[depthSign * -RECESS, floorY + DOOR_H / 2, hingeZ]}>
        <group rotation={[0, doorSwing, 0]}>
          {/* The door panel itself */}
          <RainPanel
            atlas={atlas}
            position={[0, 0, DOOR_W / 2]}
            rotation={[0, rotY, 0]}
            width={DOOR_W}
            height={DOOR_H}
            density="high"
            brightness={0.5}
            baseBrightness={0.08}
            speed={0.8}
          />
          {/* Door thickness — inner edge */}
          <RainPanel
            atlas={atlas}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            width={0.04}
            height={DOOR_H}
            density="medium"
            brightness={0.8}
            baseBrightness={0.2}
            speed={1.5}
          />
          {/* Door thickness — outer edge */}
          <RainPanel
            atlas={atlas}
            position={[0, 0, DOOR_W]}
            rotation={[0, 0, 0]}
            width={0.04}
            height={DOOR_H}
            density="medium"
            brightness={0.8}
            baseBrightness={0.2}
            speed={1.5}
          />
        </group>
      </group>

      {/* Glow from inside the doorway */}
      <pointLight
        position={[depthSign * -RECESS * 1.5, floorY + DOOR_H * 0.6, 0]}
        color="#00ff41"
        intensity={0.25}
        distance={2.5}
        decay={2}
      />
    </group>
  );
}

// ─── Wall Trim Bands ────────────────────────────────────────────────────────
// Horizontal rain strips along walls (baseboard, dado rail, cornice)

function WallTrimBands({ atlas, side }: { atlas: THREE.CanvasTexture; side: "left" | "right" }) {
  const xSign = side === "left" ? -1 : 1;
  const x = (CORRIDOR.W / 2) * xSign + xSign * 0.005;
  const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  const bands = [
    { y: -CORRIDOR.H / 2 + 0.04, h: 0.08, bright: 1.4 },  // baseboard
    { y: -0.3, h: 0.05, bright: 0.8 },                      // dado rail
    { y: CORRIDOR.H / 2 - 0.04, h: 0.06, bright: 1.0 },    // cornice
  ];

  return (
    <group>
      {bands.map(({ y, h, bright }, i) => (
        <RainPanel
          key={`trim-${side}-${i}`}
          atlas={atlas}
          position={[x, y, -CORRIDOR.D / 2]}
          rotation={[0, rotY, 0]}
          width={CORRIDOR.D}
          height={h}
          density="high"
          brightness={bright}
          baseBrightness={0.45}
          speed={2.2}
          fogFar={42}
        />
      ))}
    </group>
  );
}

// ─── Ceiling Light Fixtures ─────────────────────────────────────────────────

function CeilingLight({ atlas, z }: { atlas: THREE.CanvasTexture; z: number }) {
  return (
    <group position={[0, CORRIDOR.H / 2 - 0.02, z]}>
      {/* Light bar — made of rain characters */}
      <RainPanel
        atlas={atlas}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        width={1.6}
        height={0.1}
        density="high"
        brightness={2.0}
        baseBrightness={0.7}
        speed={3.5}
      />
      <pointLight color="#00ff41" intensity={1.8} distance={6} decay={2} />
    </group>
  );
}

// ─── Full Corridor Structure ────────────────────────────────────────────────

export interface CorridorStructureProps {
  atlas: THREE.CanvasTexture;
}

export function CorridorStructure({ atlas }: CorridorStructureProps) {
  const halfW = CORRIDOR.W / 2;

  // Generate random door positions once per page visit
  const doors = useMemo(() => {
    const rng = seededRandom(Date.now());
    const result: { z: number; side: "left" | "right"; openAngle: number }[] = [];

    // Generate 6-10 doors randomly along the corridor
    const numDoors = 6 + Math.floor(rng() * 5);
    const minZ = -25;
    const maxZ = -3;

    for (let i = 0; i < numDoors; i++) {
      const z = maxZ + rng() * (minZ - maxZ);
      const side: "left" | "right" = rng() > 0.5 ? "left" : "right";
      const openAngle = 0.6 + rng() * 0.8; // vary how open each door is
      result.push({ z, side, openAngle });
    }

    // Sort by z to avoid z-fighting issues
    result.sort((a, b) => b.z - a.z);

    // Filter out doors too close to each other on the same side
    const filtered: typeof result = [];
    for (const door of result) {
      const tooClose = filtered.some(
        (d) => d.side === door.side && Math.abs(d.z - door.z) < 2.5
      );
      if (!tooClose) filtered.push(door);
    }

    return filtered;
  }, []);

  return (
    <group>
      {/* Rain doors — randomly placed */}
      {doors.map((door, i) => (
        <RainDoor
          key={`door-${i}`}
          atlas={atlas}
          position={[door.side === "left" ? -halfW : halfW, 0, door.z]}
          side={door.side}
          openAngle={door.openAngle}
        />
      ))}

      {/* Wall trim bands */}
      <WallTrimBands atlas={atlas} side="left" />
      <WallTrimBands atlas={atlas} side="right" />

      {/* Ceiling fluorescent lights */}
      {[-3, -9, -15, -21, -27].map((z) => (
        <CeilingLight key={`light-${z}`} atlas={atlas} z={z} />
      ))}
    </group>
  );
}
