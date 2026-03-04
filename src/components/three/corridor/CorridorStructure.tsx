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
// with edge glow to define the opening clearly

interface RainDoorProps {
  atlas: THREE.CanvasTexture;
  position: [number, number, number];
  side: "left" | "right";
  openAngle?: number;
}

const DOOR_W = 1.1;
const DOOR_H = 2.4;
const FRAME_T = 0.1;
const RECESS = 0.3;

function RainDoor({ atlas, position, side, openAngle = 1.1 }: RainDoorProps) {
  const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;
  const depthSign = side === "left" ? 1 : -1;
  const floorY = -CORRIDOR.H / 2;

  const hingeZ = -DOOR_W / 2;
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
        brightness={1.8}
        baseBrightness={0.5}
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
        brightness={1.8}
        baseBrightness={0.5}
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
        brightness={1.8}
        baseBrightness={0.5}
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
        brightness={0.6}
        baseBrightness={0.12}
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
        brightness={0.6}
        baseBrightness={0.12}
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
        brightness={0.6}
        baseBrightness={0.12}
        speed={1.2}
      />

      {/* Door panel — swung open, pivoting from hinge edge */}
      <group position={[depthSign * -RECESS, floorY + DOOR_H / 2, hingeZ]}>
        <group rotation={[0, doorSwing, 0]}>
          {/* The door panel itself — darker, subtle rain */}
          <RainPanel
            atlas={atlas}
            position={[0, 0, DOOR_W / 2]}
            rotation={[0, rotY, 0]}
            width={DOOR_W}
            height={DOOR_H}
            density="high"
            brightness={0.4}
            baseBrightness={0.06}
            speed={0.6}
          />
          {/* Door thickness — inner edge (bright edge glow) */}
          <RainPanel
            atlas={atlas}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            width={0.05}
            height={DOOR_H}
            density="high"
            brightness={2.0}
            baseBrightness={0.6}
            speed={2.0}
          />
          {/* Door thickness — outer edge (bright edge glow) */}
          <RainPanel
            atlas={atlas}
            position={[0, 0, DOOR_W]}
            rotation={[0, 0, 0]}
            width={0.05}
            height={DOOR_H}
            density="high"
            brightness={2.0}
            baseBrightness={0.6}
            speed={2.0}
          />
        </group>
      </group>

      {/* Edge glow lines — bright green lines along the door frame edges for definition */}
      <mesh position={[0, floorY + DOOR_H / 2, -(DOOR_W / 2 + FRAME_T)]}>
        <boxGeometry args={[0.01, DOOR_H + FRAME_T * 2, 0.01]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, floorY + DOOR_H / 2, DOOR_W / 2 + FRAME_T]}>
        <boxGeometry args={[0.01, DOOR_H + FRAME_T * 2, 0.01]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, floorY + DOOR_H + FRAME_T, 0]}>
        <boxGeometry args={[0.01, 0.01, DOOR_W + FRAME_T * 2]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Glow from inside the doorway — soft green spill */}
      <pointLight
        position={[depthSign * -RECESS * 2, floorY + DOOR_H * 0.5, 0]}
        color="#00ff41"
        intensity={0.4}
        distance={3}
        decay={2}
      />
      {/* Floor spill light */}
      <pointLight
        position={[depthSign * -RECESS * 1.2, floorY + 0.1, 0]}
        color="#00ff41"
        intensity={0.15}
        distance={2}
        decay={2}
      />
    </group>
  );
}

// ─── Ruined Ceiling — exposed wires, broken panels, decay ──────────────────

function RuinedCeiling({ atlas }: { atlas: THREE.CanvasTexture }) {
  const segments = useMemo(() => {
    const rng = seededRandom(7331);
    const result: {
      z: number;
      width: number;
      xOff: number;
      yDrop: number;
      bright: number;
      hasWire: boolean;
    }[] = [];

    // Broken ceiling panels at irregular intervals
    for (let z = -2; z > -CORRIDOR.D + 1; z -= 1.5 + rng() * 2.0) {
      result.push({
        z,
        width: 0.4 + rng() * 1.2,
        xOff: (rng() - 0.5) * (CORRIDOR.W * 0.6),
        yDrop: rng() * 0.15,
        bright: 0.8 + rng() * 1.4,
        hasWire: rng() > 0.5,
      });
    }
    return result;
  }, []);

  const ceilY = CORRIDOR.H / 2;

  return (
    <group>
      {segments.map((seg, i) => (
        <group key={`ruin-${i}`}>
          {/* Broken/hanging ceiling panel */}
          <RainPanel
            atlas={atlas}
            position={[seg.xOff, ceilY - 0.02 - seg.yDrop, seg.z]}
            rotation={[Math.PI / 2 + (seg.yDrop > 0.08 ? 0.15 : 0), 0, 0]}
            width={seg.width}
            height={0.08 + seg.yDrop * 0.5}
            density="high"
            brightness={seg.bright}
            baseBrightness={0.3}
            speed={1.5 + seg.bright}
          />

          {/* Hanging wire/cable from broken section */}
          {seg.hasWire && (
            <>
              <mesh position={[seg.xOff + seg.width * 0.3, ceilY - 0.1 - seg.yDrop * 2, seg.z]}>
                <boxGeometry args={[0.008, 0.2 + seg.yDrop * 3, 0.008]} />
                <meshBasicMaterial color="#00ff41" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
              </mesh>
              {/* Spark at wire end — small flickering light */}
              {seg.yDrop > 0.05 && (
                <pointLight
                  position={[seg.xOff + seg.width * 0.3, ceilY - 0.3 - seg.yDrop * 3, seg.z]}
                  color="#44ff66"
                  intensity={0.3}
                  distance={1.5}
                  decay={3}
                />
              )}
            </>
          )}
        </group>
      ))}
    </group>
  );
}

// ─── Wall Decay Bands ──────────────────────────────────────────────────────
// Irregular, crumbling trim at baseboard and cornice — ruined building feel

function WallDecayBands({ atlas, side }: { atlas: THREE.CanvasTexture; side: "left" | "right" }) {
  const xSign = side === "left" ? -1 : 1;
  const x = (CORRIDOR.W / 2) * xSign + xSign * 0.005;
  const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  const bands = [
    { y: -CORRIDOR.H / 2 + 0.04, h: 0.06, bright: 1.6 },  // crumbling baseboard
    { y: CORRIDOR.H / 2 - 0.04, h: 0.05, bright: 1.2 },   // broken cornice
  ];

  return (
    <group>
      {bands.map(({ y, h, bright }, i) => (
        <RainPanel
          key={`decay-${side}-${i}`}
          atlas={atlas}
          position={[x, y, -CORRIDOR.D / 2]}
          rotation={[0, rotY, 0]}
          width={CORRIDOR.D}
          height={h}
          density="high"
          brightness={bright}
          baseBrightness={0.4}
          speed={2.5}
          fogFar={42}
        />
      ))}
    </group>
  );
}

// ─── Ceiling Light Fixtures (flickering, some broken) ──────────────────────

function CeilingLight({ atlas, z, broken = false }: { atlas: THREE.CanvasTexture; z: number; broken?: boolean }) {
  return (
    <group position={[0, CORRIDOR.H / 2 - 0.02, z]}>
      <RainPanel
        atlas={atlas}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        width={broken ? 0.8 : 1.6}
        height={0.1}
        density="high"
        brightness={broken ? 0.6 : 2.2}
        baseBrightness={broken ? 0.2 : 0.8}
        speed={broken ? 5.0 : 3.5}
      />
      <pointLight
        color="#00ff41"
        intensity={broken ? 0.5 : 2.0}
        distance={broken ? 3 : 6}
        decay={2}
      />
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

    const numDoors = 6 + Math.floor(rng() * 5);
    const minZ = -25;
    const maxZ = -3;

    for (let i = 0; i < numDoors; i++) {
      const z = maxZ + rng() * (minZ - maxZ);
      const side: "left" | "right" = rng() > 0.5 ? "left" : "right";
      const openAngle = 0.6 + rng() * 0.8;
      result.push({ z, side, openAngle });
    }

    result.sort((a, b) => b.z - a.z);

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

      {/* Wall decay bands — crumbling baseboard & cornice */}
      <WallDecayBands atlas={atlas} side="left" />
      <WallDecayBands atlas={atlas} side="right" />

      {/* Ruined ceiling — broken panels, hanging wires */}
      <RuinedCeiling atlas={atlas} />

      {/* Ceiling lights — some working, some broken/flickering */}
      {[-3, -9, -15, -21, -27].map((z, i) => (
        <CeilingLight key={`light-${z}`} atlas={atlas} z={z} broken={i === 1 || i === 3} />
      ))}
    </group>
  );
}
