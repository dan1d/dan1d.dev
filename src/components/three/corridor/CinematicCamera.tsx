import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Cinematic intro camera ─────────────────────────────────────────────────
// One scripted shot, told in beats. The camera is the single clock: it drives
// position, focal length (fov), roll, chromatic aberration, and reports named
// phases to the DOM so text overlays cut on the same frame as the picture.
//
//   0.0  BLACK / HOLD    static wide, slight push, rain wall fills frame
//   0.6  APPROACH        slow dolly toward the entrance, lens tightens a touch
//   1.6  WAKE            "Wake up, dan1d..." starts typing (DOM)
//   3.2  ACCELERATE      dolly speeds up, lens widens (warp), slight dutch tilt
//   5.4  GLITCH          stuttered jolt + chromatic spike, text cuts out
//   5.9  PUSH            hard push-in, lens tightens onto the desk (compression)
//   7.6  SETTLED         handheld breathing hold on the coder; UI reveals

export type IntroPhase =
  | "hold"
  | "approach"
  | "wake"
  | "accelerate"
  | "glitch"
  | "push"
  | "settled";

export interface CinematicCameraProps {
  onIntroComplete?: () => void;
  onPhase?: (phase: IntroPhase) => void;
  chromaticOffset: THREE.Vector2;
}

// Beat boundaries (seconds on the R3F clock)
export const BEATS = {
  approach: 0.6,
  wake: 1.6,
  accelerate: 3.2,
  glitch: 5.4,
  push: 5.9,
  settled: 7.6,
} as const;

// Where the shot ends: framed on the coder at the desk (CoderDesk at z=-23)
const END_POS = new THREE.Vector3(0.05, -0.3, -20.5);
const DESK_TARGET = new THREE.Vector3(-0.32, -0.88, -23.1);
const FAR_TARGET_DZ = -10; // during travel, look straight down the corridor

const FOV_WIDE = 60;
const FOV_TIGHT_PRE = 55;
const FOV_WARP = 78;
const FOV_CLOSE = 50;

// ─── Easing ─────────────────────────────────────────────────────────────────
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeInQuart = (p: number) => p * p * p * p;
const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

// Layered sines ≈ smooth handheld noise (no per-frame randomness, no jitter)
function handheld(t: number, amp: number) {
  return {
    x: (Math.sin(t * 1.3) * 0.5 + Math.sin(t * 2.9 + 1.7) * 0.3 + Math.sin(t * 5.1 + 0.4) * 0.2) * amp,
    y: (Math.cos(t * 1.1 + 0.9) * 0.5 + Math.cos(t * 2.3 + 2.2) * 0.3 + Math.sin(t * 4.7) * 0.2) * amp * 0.7,
    roll: (Math.sin(t * 0.9 + 0.3) * 0.6 + Math.sin(t * 2.1 + 1.1) * 0.4) * amp * 0.35,
  };
}

function phaseAt(t: number): IntroPhase {
  if (t >= BEATS.settled) return "settled";
  if (t >= BEATS.push) return "push";
  if (t >= BEATS.glitch) return "glitch";
  if (t >= BEATS.accelerate) return "accelerate";
  if (t >= BEATS.wake) return "wake";
  if (t >= BEATS.approach) return "approach";
  return "hold";
}

export function CinematicCamera({ onIntroComplete, onPhase, chromaticOffset }: CinematicCameraProps) {
  const doneRef = useRef(false);
  const phaseRef = useRef<IntroPhase>("hold");
  // Occasional power flicker after settling: small, rare, decays fast
  const flickerRef = useRef({ intensity: 0, nextAt: 14 });
  const target = useRef(new THREE.Vector3()).current;
  const up = useRef(new THREE.Vector3()).current;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;

    let x = 0, y = 0, z = 5.2;
    let fov = FOV_WIDE;
    let roll = 0;
    let ca = 0.0006;
    let lookX = 0, lookY = 0, lookZ = z + FAR_TARGET_DZ;

    if (t < BEATS.approach) {
      // HOLD — almost static wide; a breath of push so it's never frozen
      const p = clamp01(t / BEATS.approach);
      z = 5.2 - p * 0.15;
      lookZ = z + FAR_TARGET_DZ;
    } else if (t < BEATS.accelerate) {
      // APPROACH — slow dolly 5.05 → 1.2, lens tightens slightly (anticipation)
      const p = clamp01((t - BEATS.approach) / (BEATS.accelerate - BEATS.approach));
      const e = easeInOutCubic(p);
      z = 5.05 - e * 3.85;
      fov = FOV_WIDE + (FOV_TIGHT_PRE - FOV_WIDE) * e;
      const h = handheld(t, 0.035);
      x = h.x; y = h.y; roll = h.roll;
      lookZ = z + FAR_TARGET_DZ;
    } else if (t < BEATS.glitch) {
      // ACCELERATE — 1.2 → -10 with a quartic ramp; lens widens into a warp,
      // and the horizon tilts a few degrees the faster we go (dutch angle)
      const p = clamp01((t - BEATS.accelerate) / (BEATS.glitch - BEATS.accelerate));
      const e = easeInQuart(p);
      z = 1.2 - e * 11.2;
      fov = FOV_TIGHT_PRE + (FOV_WARP - FOV_TIGHT_PRE) * easeOutCubic(p);
      const h = handheld(t, 0.035 + p * 0.09);
      x = h.x; y = h.y;
      roll = h.roll + THREE.MathUtils.degToRad(3.2) * Math.sin(p * Math.PI) ;
      ca = 0.0006 + p * 0.0022;
      lookZ = z + FAR_TARGET_DZ;
    } else if (t < BEATS.push) {
      // GLITCH — a stuttered hit, not continuous noise: the frame jumps on a
      // 24 Hz gate and holds between jumps, like dropped frames in a broadcast
      const p = clamp01((t - BEATS.glitch) / (BEATS.push - BEATS.glitch));
      const gate = Math.floor((t - BEATS.glitch) * 24);
      const on = gate % 3 !== 1; // 2 of every 3 gate steps displaced
      const decay = 1 - p * 0.6;
      const seed = gate * 13.37;
      const jx = (Math.sin(seed) * 0.5) * 0.45 * decay;
      const jy = (Math.cos(seed * 1.7) * 0.5) * 0.25 * decay;
      z = -10 + (on ? Math.sin(seed * 0.7) * 0.25 * decay : 0);
      x = on ? jx : 0;
      y = on ? jy : 0;
      fov = FOV_WARP + (on ? Math.sin(seed * 2.3) * 6 : 0);
      roll = on ? Math.sin(seed * 3.1) * THREE.MathUtils.degToRad(4) * decay : 0;
      ca = on ? 0.012 + Math.abs(Math.sin(seed)) * 0.012 : 0.003;
      lookZ = z + FAR_TARGET_DZ;
    } else if (t < BEATS.settled) {
      // PUSH — hard push-in -10 → -19.4; lens tightens to compress the desk;
      // the look target racks from "down the corridor" to the coder
      const p = clamp01((t - BEATS.push) / (BEATS.settled - BEATS.push));
      const e = easeOutExpo(p);
      z = -10 + (END_POS.z + 10) * e;
      x = END_POS.x * e;
      y = END_POS.y * e;
      fov = FOV_WARP + (FOV_CLOSE - FOV_WARP) * easeOutCubic(p);
      roll = 0;
      ca = Math.max(0.0006, (1 - e) * 0.006);
      const rack = easeInOutCubic(clamp01((p - 0.25) / 0.75));
      lookX = DESK_TARGET.x * rack;
      lookY = DESK_TARGET.y * rack;
      lookZ = (z + FAR_TARGET_DZ) * (1 - rack) + DESK_TARGET.z * rack;
    } else {
      // SETTLED — handheld breathing hold, locked on the coder
      const dt = t - BEATS.settled;
      const h = handheld(dt * 0.6, 0.045);
      x = END_POS.x + h.x + Math.sin(dt * 0.11) * 0.08;
      y = END_POS.y + h.y + Math.cos(dt * 0.09) * 0.04;
      z = END_POS.z + Math.sin(dt * 0.07) * 0.12;
      fov = FOV_CLOSE + Math.sin(dt * 0.05) * 0.8;
      roll = h.roll;
      lookX = DESK_TARGET.x; lookY = DESK_TARGET.y; lookZ = DESK_TARGET.z;

      // Rare power flicker: brief, small, decays in ~20 frames
      const f = flickerRef.current;
      if (t >= f.nextAt && f.intensity <= 0) {
        f.intensity = 0.5 + Math.random() * 0.5;
        f.nextAt = t + 12 + Math.random() * 18;
      }
      if (f.intensity > 0) {
        const s = f.intensity;
        x += Math.sin(t * 61) * 0.03 * s;
        y += Math.cos(t * 53) * 0.02 * s;
        ca = 0.0006 + s * 0.004;
        f.intensity *= 0.88;
        if (f.intensity < 0.02) f.intensity = 0;
      }
    }

    // Apply
    cam.position.set(x, y, z);
    up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.up.copy(up);
    target.set(lookX, lookY, lookZ);
    cam.lookAt(target);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    chromaticOffset.set(ca, ca * 0.6);

    // Phase events (edge-triggered)
    const phase = phaseAt(t);
    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      onPhase?.(phase);
    }
    if (t >= BEATS.settled && !doneRef.current) {
      doneRef.current = true;
      onIntroComplete?.();
    }
  });

  return null;
}
