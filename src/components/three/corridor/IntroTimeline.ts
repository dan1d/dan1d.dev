// ─── Intro timeline ─────────────────────────────────────────────────────────
// The single clock for the opening shot. CinematicCamera writes `intro.t`
// every frame; the rain veil, the materialising facade and the DOM overlays
// all read the same beats so picture and text cut on the same frame.
//
//   0.0  RAIN        a veil of code fills the frame, nothing behind it
//   1.0  RESOLVE     the veil thins as a building materialises out of it
//   3.4  APPROACH    dolly across the street toward the portico
//   4.4  WAKE        "Wake up, dan1d..." starts typing (DOM)
//   6.4  ACCELERATE  through the door and down the corridor, lens warps
//   8.6  GLITCH      stuttered jolt + chromatic spike, text cuts out
//   9.1  PUSH        hard push-in, lens tightens onto the desk
//  10.8  SETTLED     handheld breathing hold on the coder; UI reveals

export const BEATS = {
  resolve: 1.0,
  approach: 3.4,
  wake: 4.4,
  accelerate: 6.4,
  glitch: 8.6,
  push: 9.1,
  settled: 10.8,
} as const;

export type IntroPhase =
  | "rain"
  | "resolve"
  | "approach"
  | "wake"
  | "accelerate"
  | "glitch"
  | "push"
  | "settled";

/** Shared shot clock (seconds). Written by the camera, read by anything synced to it. */
export const intro = { t: 0 };

export function phaseAt(t: number): IntroPhase {
  if (t >= BEATS.settled) return "settled";
  if (t >= BEATS.push) return "push";
  if (t >= BEATS.glitch) return "glitch";
  if (t >= BEATS.accelerate) return "accelerate";
  if (t >= BEATS.wake) return "wake";
  if (t >= BEATS.approach) return "approach";
  if (t >= BEATS.resolve) return "resolve";
  return "rain";
}

export const smoothstep = (a: number, b: number, x: number) => {
  const p = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return p * p * (3 - 2 * p);
};

/** 0 → 1 while the building materialises out of the rain. */
export const facadeReveal = (t: number) => smoothstep(BEATS.resolve, BEATS.approach - 0.3, t);
