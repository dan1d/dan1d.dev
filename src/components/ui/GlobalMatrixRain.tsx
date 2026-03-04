"use client";

import { useRef, useEffect } from "react";
import {
  ALL_CHARACTERS,
  CHARACTER_KEYS,
  mirrorPose,
  type FigurePose,
  type CharacterSprites,
} from "@/data/matrixFigures";

// ─── Character set ───────────────────────────────────────────────────────────

const KATAKANA =
  "\u30A0\u30A1\u30A2\u30A3\u30A4\u30A5\u30A6\u30A7\u30A8\u30A9\u30AA\u30AB\u30AC\u30AD\u30AE\u30AF" +
  "\u30B0\u30B1\u30B2\u30B3\u30B4\u30B5\u30B6\u30B7\u30B8\u30B9\u30BA\u30BB\u30BC\u30BD\u30BE\u30BF" +
  "\u30C0\u30C1\u30C2\u30C3\u30C4\u30C5\u30C6\u30C7\u30C8\u30C9\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF";
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const ALL_CHARS = KATAKANA + LATIN;

function rndChar() {
  return ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── Density parsing ─────────────────────────────────────────────────────────

const DENSITY_MAP: Record<string, number> = {
  "#": 1.0,
  "+": 0.7,
  ".": 0.4,
  " ": 0.0,
};

const BUZZ_RATE: Record<string, number> = {
  "#": 0.03,
  "+": 0.02,
  ".": 0.01,
  " ": 0,
};

function parseDensityMap(pose: FigurePose): number[][] {
  return pose.rows.map((row) =>
    Array.from(row).map((ch) => DENSITY_MAP[ch] ?? 0)
  );
}

function parseBuzzMap(pose: FigurePose): number[][] {
  return pose.rows.map((row) =>
    Array.from(row).map((ch) => BUZZ_RATE[ch] ?? 0)
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface RainColumn {
  y: number;
  speed: number;
  chars: string[];
  trail: number;
  foreground: boolean; // depth layering
}

interface FigureState {
  character: string;
  label: string;
  sprites: CharacterSprites;
  x: number;
  yBase: number; // base Y (head bob oscillates around this)
  direction: 1 | -1;
  speed: number;
  walkFrameIndex: number; // 0-5 for 6-frame walk cycle
  walkFrameTimer: number;
  walkFrameInterval: number; // ~130ms per frame
  currentPose: FigurePose;
  state: "entering" | "walking" | "special_pause" | "exiting" | "done";
  specialTimer: number;
  scale: number;
  brightness: number;
  fadeAlpha: number; // 1.0 normally, fades to 0 during exit
  // Head bob
  walkProgress: number; // 0..1 through full cycle
  // Motion trail (previous positions)
  prevPositions: { x: number; y: number }[];
  // Cached density mask
  cachedPoseRef: FigurePose | null;
  cachedDensity: number[][] | null;
  cachedBuzz: number[][] | null;
  cachedMaskW: number;
  cachedMaskH: number;
}

interface FigureBounds {
  startCol: number;
  startRow: number;
  width: number;
  height: number;
  density: number[][];
  buzz: number[][];
  brightness: number;
  fadeAlpha: number;
  centerX: number;
  centerY: number;
  bottomY: number;
  label: string;
}

interface TrailBounds {
  startCol: number;
  startRow: number;
  width: number;
  height: number;
  density: number[][];
  alpha: number; // trail fade factor
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GlobalMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CHAR_SIZE = 10;
    const CHAR_W = CHAR_SIZE * 0.58;
    const CHAR_H = CHAR_SIZE * 1.15;
    const FOREGROUND_RATIO = 0.12; // 12% of rain columns in front of figures
    const TRAIL_COUNT = 3;
    const TRAIL_ALPHAS = [0.3, 0.2, 0.1];
    const HEAD_BOB_AMPLITUDE = 1.5; // pixels
    const WALK_FRAMES = 6;
    const EXIT_FADE_DURATION = 500; // ms

    let w = 0;
    let h = 0;
    let numCols = 0;
    let numRows = 0;
    let rainCols: RainColumn[] = [];
    let activeFigures: FigureState[] = [];
    let spawnTimer = 0;
    let nextSpawnDelay = randomBetween(6000, 12000);
    let lastCharacter: string | null = null;

    // Pre-compute mirrored walk frames per character
    const walkLeftCache: Record<string, FigurePose[]> = {};
    for (const key of CHARACTER_KEYS) {
      walkLeftCache[key] = ALL_CHARACTERS[key].walkRight.map(mirrorPose);
    }

    // ── Resize ──
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      numCols = Math.ceil(w / CHAR_W);
      numRows = Math.ceil(h / CHAR_H);

      // Rebuild rain
      rainCols = [];
      for (let c = 0; c < numCols; c++) {
        const trail = 8 + Math.floor(Math.random() * 15);
        const chars: string[] = [];
        for (let r = 0; r < numRows + trail; r++) chars.push(rndChar());
        rainCols.push({
          y: Math.random() * (numRows + trail),
          speed: 0.3 + Math.random() * 2.5,
          chars,
          trail,
          foreground: Math.random() < FOREGROUND_RATIO,
        });
      }
    }

    // ── Get walk pose for current frame ──
    function getWalkPose(fig: FigureState): FigurePose {
      const idx = fig.walkFrameIndex % WALK_FRAMES;
      if (fig.direction === 1) {
        return fig.sprites.walkRight[idx];
      }
      return walkLeftCache[fig.character][idx];
    }

    // ── Figure creation ──
    function createFigure(): FigureState {
      // Pick character (avoid repeat)
      const available = CHARACTER_KEYS.filter((k) => k !== lastCharacter);
      const character =
        available[Math.floor(Math.random() * available.length)];
      lastCharacter = character;

      const sprites = ALL_CHARACTERS[character];
      const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const scale = 1.6 + Math.random() * 0.8; // 1.6-2.4
      const poseW = sprites.stand.width * scale * CHAR_W;
      const startX = direction === 1 ? -poseW : w + poseW;
      const startY = h * (0.2 + Math.random() * 0.55);

      return {
        character,
        label: sprites.label,
        sprites,
        x: startX,
        yBase: startY,
        direction,
        speed: 0.4 + Math.random() * 0.5,
        walkFrameIndex: 0,
        walkFrameTimer: 0,
        walkFrameInterval: 130, // ~130ms per frame for smooth walk
        currentPose: sprites.stand,
        state: "entering",
        specialTimer: 0,
        scale,
        brightness: 4.0,
        fadeAlpha: 1.0,
        walkProgress: 0,
        prevPositions: [],
        cachedPoseRef: null,
        cachedDensity: null,
        cachedBuzz: null,
        cachedMaskW: 0,
        cachedMaskH: 0,
      };
    }

    // ── Scaled density mask (cached) ──
    function getScaledDensity(fig: FigureState): {
      density: number[][];
      buzz: number[][];
      w: number;
      h: number;
    } {
      if (fig.cachedPoseRef === fig.currentPose && fig.cachedDensity && fig.cachedBuzz) {
        return {
          density: fig.cachedDensity,
          buzz: fig.cachedBuzz,
          w: fig.cachedMaskW,
          h: fig.cachedMaskH,
        };
      }

      const srcDensity = parseDensityMap(fig.currentPose);
      const srcBuzz = parseBuzzMap(fig.currentPose);
      const srcH = srcDensity.length;
      const srcW = srcDensity[0]?.length ?? 0;
      const scaledW = Math.ceil(srcW * fig.scale);
      const scaledH = Math.ceil(srcH * fig.scale);
      const density: number[][] = [];
      const buzz: number[][] = [];

      for (let r = 0; r < scaledH; r++) {
        const dRow: number[] = [];
        const bRow: number[] = [];
        for (let c = 0; c < scaledW; c++) {
          const sr = Math.floor(r / fig.scale);
          const sc = Math.floor(c / fig.scale);
          if (sr < srcH && sc < srcW) {
            dRow.push(srcDensity[sr][sc]);
            bRow.push(srcBuzz[sr][sc]);
          } else {
            dRow.push(0);
            bRow.push(0);
          }
        }
        density.push(dRow);
        buzz.push(bRow);
      }

      fig.cachedPoseRef = fig.currentPose;
      fig.cachedDensity = density;
      fig.cachedBuzz = buzz;
      fig.cachedMaskW = scaledW;
      fig.cachedMaskH = scaledH;

      return { density, buzz, w: scaledW, h: scaledH };
    }

    // ── Head bob Y offset ──
    function getHeadBob(fig: FigureState): number {
      if (fig.state === "special_pause" || fig.state === "exiting") return 0;
      return Math.sin(fig.walkProgress * Math.PI * 2) * HEAD_BOB_AMPLITUDE;
    }

    // ── Figure bounds for boost lookup ──
    function computeBounds(fig: FigureState): FigureBounds {
      const { density, buzz, w: mw, h: mh } = getScaledDensity(fig);
      const yWithBob = fig.yBase + getHeadBob(fig);
      const startCol = Math.floor(fig.x / CHAR_W);
      const startRow = Math.floor(yWithBob / CHAR_H);

      return {
        startCol,
        startRow,
        width: mw,
        height: mh,
        density,
        buzz,
        brightness: fig.brightness * fig.fadeAlpha,
        fadeAlpha: fig.fadeAlpha,
        centerX: fig.x + (mw * CHAR_W) / 2,
        centerY: yWithBob + (mh * CHAR_H) / 2,
        bottomY: yWithBob + mh * CHAR_H,
        label: fig.label,
      };
    }

    // ── Trail bounds from previous positions ──
    function computeTrailBounds(fig: FigureState): TrailBounds[] {
      const { density, w: mw, h: mh } = getScaledDensity(fig);
      const trails: TrailBounds[] = [];

      for (let i = 0; i < fig.prevPositions.length && i < TRAIL_COUNT; i++) {
        const pos = fig.prevPositions[i];
        trails.push({
          startCol: Math.floor(pos.x / CHAR_W),
          startRow: Math.floor(pos.y / CHAR_H),
          width: mw,
          height: mh,
          density,
          alpha: TRAIL_ALPHAS[i] * fig.fadeAlpha,
        });
      }

      return trails;
    }

    // ── Boost lookup with density weighting ──
    function getBoost(
      col: number,
      row: number,
      bounds: FigureBounds[],
      trails: TrailBounds[]
    ): { boost: number; buzzRate: number } {
      // Check main figure bounds first
      for (const b of bounds) {
        const lc = col - b.startCol;
        const lr = row - b.startRow;
        if (lc >= 0 && lc < b.width && lr >= 0 && lr < b.height) {
          const d = b.density[lr]?.[lc] ?? 0;
          if (d > 0) {
            // Density-weighted boost: # = 4.0x, + = 3.0x, . = 1.8x
            const boostMultiplier =
              d >= 1.0 ? 4.0 : d >= 0.7 ? 3.0 : 1.8;
            return {
              boost: boostMultiplier * b.fadeAlpha,
              buzzRate: b.buzz[lr]?.[lc] ?? 0,
            };
          }
        }
      }

      // Check trail bounds
      for (const t of trails) {
        const lc = col - t.startCol;
        const lr = row - t.startRow;
        if (lc >= 0 && lc < t.width && lr >= 0 && lr < t.height) {
          const d = t.density[lr]?.[lc] ?? 0;
          if (d > 0) {
            return { boost: d * 2.0 * t.alpha, buzzRate: 0 };
          }
        }
      }

      return { boost: 0, buzzRate: 0 };
    }

    // ── Update figure ──
    function updateFigure(fig: FigureState, dt: number) {
      if (fig.state === "done") return;

      if (fig.state === "entering" || fig.state === "walking") {
        // Store previous position for trail (every ~100ms)
        fig.walkFrameTimer += dt;

        if (fig.walkFrameTimer >= fig.walkFrameInterval) {
          // Push current position to trail history
          fig.prevPositions.unshift({
            x: fig.x,
            y: fig.yBase + getHeadBob(fig),
          });
          if (fig.prevPositions.length > TRAIL_COUNT) {
            fig.prevPositions.length = TRAIL_COUNT;
          }

          fig.walkFrameTimer = 0;
          fig.walkFrameIndex = (fig.walkFrameIndex + 1) % WALK_FRAMES;
          fig.currentPose = getWalkPose(fig);
        }

        // Move
        fig.x += fig.speed * fig.direction * dt * 0.06;

        // Update walk progress (0..1 through full 6-frame cycle)
        fig.walkProgress =
          (fig.walkProgress + dt / (fig.walkFrameInterval * WALK_FRAMES)) % 1;

        // Check if entered viewport
        if (fig.state === "entering") {
          const onScreen =
            fig.direction === 1 ? fig.x > -50 : fig.x < w + 50;
          if (onScreen) fig.state = "walking";
        }

        // Check if approaching viewport edge → start exiting
        const { w: mw } = getScaledDensity(fig);
        const pxW = mw * CHAR_W;
        if (fig.direction === 1 && fig.x > w + pxW * 0.3) {
          fig.state = "exiting";
        } else if (fig.direction === -1 && fig.x < -pxW * 0.3) {
          fig.state = "exiting";
        }

        // Random special pose (5% chance per second)
        if (
          fig.state === "walking" &&
          Math.random() < 0.05 * (dt / 1000)
        ) {
          fig.state = "special_pause";
          fig.currentPose = fig.sprites.special;
          fig.specialTimer = 2000 + Math.random() * 1500;
        }
      }

      if (fig.state === "special_pause") {
        fig.specialTimer -= dt;
        if (fig.specialTimer <= 0) {
          fig.state = "walking";
          fig.currentPose = getWalkPose(fig);
        }
      }

      if (fig.state === "exiting") {
        // Continue moving
        fig.x += fig.speed * fig.direction * dt * 0.06;

        // Fade out
        fig.fadeAlpha = Math.max(0, fig.fadeAlpha - dt / EXIT_FADE_DURATION);
        fig.brightness = 4.0 * fig.fadeAlpha;

        if (fig.fadeAlpha <= 0) {
          fig.state = "done";
        }
      }
    }

    // ── Try spawning ──
    function trySpawn(dt: number) {
      spawnTimer += dt;
      if (spawnTimer < nextSpawnDelay) return;
      if (activeFigures.length >= 2) return;

      spawnTimer = 0;
      nextSpawnDelay = randomBetween(8000, 15000);
      activeFigures.push(createFigure());
    }

    // ── Draw rain column helper ──
    function drawRainCol(
      c: number,
      col: RainColumn,
      dt: number,
      figBounds: FigureBounds[],
      trailBounds: TrailBounds[],
      isForeground: boolean
    ) {
      col.y += col.speed * (dt / 16.67) * 0.14;

      if (col.y > numRows + col.trail) {
        col.y = -col.trail * Math.random();
        col.speed = 0.3 + Math.random() * 2.5;
      }

      const headRow = Math.floor(col.y);
      const x = c * CHAR_W;
      const rStart = Math.max(0, headRow - col.trail);
      const rEnd = Math.min(numRows, headRow);

      for (let r = rStart; r <= rEnd; r++) {
        const dist = headRow - r;

        // Variable character buzz — check boost first for buzz rate
        const { boost, buzzRate } = isForeground
          ? { boost: 0, buzzRate: 0 }
          : getBoost(c, r, figBounds, trailBounds);

        // Apply buzz rate based on density region
        const effectiveBuzz = buzzRate > 0 ? buzzRate : 0.015;
        if (Math.random() < effectiveBuzz) {
          col.chars[r % col.chars.length] = rndChar();
        }

        let alpha = dist === 0 ? 1.0 : Math.max(0, 1 - dist / col.trail);

        if (isForeground) {
          // Foreground rain: slightly brighter, drawn on top of figures
          alpha *= 0.35;
          if (alpha < 0.01) continue;
          if (dist === 0) {
            ctx!.fillStyle = `rgba(100, 200, 100, ${alpha})`;
          } else if (dist < 3) {
            ctx!.fillStyle = `rgba(0, 180, 50, ${alpha * 0.7})`;
          } else {
            ctx!.fillStyle = `rgba(0, 140, 35, ${alpha * 0.5})`;
          }
        } else if (boost > 0) {
          // Inside figure — bright, density-weighted
          alpha = Math.min(1.0, alpha * boost);
          if (dist === 0) {
            ctx!.fillStyle = `rgba(220, 255, 220, ${alpha})`;
          } else if (dist < 3) {
            ctx!.fillStyle = `rgba(100, 255, 100, ${alpha})`;
          } else {
            ctx!.fillStyle = `rgba(0, 255, 65, ${alpha * 0.85})`;
          }
        } else {
          // Subtle background rain
          alpha *= 0.25;
          if (alpha < 0.01) continue;
          if (dist === 0) {
            ctx!.fillStyle = `rgba(100, 180, 100, ${alpha})`;
          } else if (dist < 3) {
            ctx!.fillStyle = `rgba(0, 160, 40, ${alpha * 0.7})`;
          } else {
            ctx!.fillStyle = `rgba(0, 120, 30, ${alpha * 0.4})`;
          }
        }

        ctx!.fillText(col.chars[r % col.chars.length], x, r * CHAR_H);
      }
    }

    // ── Animation loop ──
    let lastTime = 0;

    function animate(now: number) {
      if (!ctx) return;

      const dt = lastTime === 0 ? 16.67 : Math.min(now - lastTime, 50);
      lastTime = now;

      // Clear to transparent (overlay — page content shows through)
      ctx.clearRect(0, 0, w, h);

      // Compute figure bounds and trail bounds
      const liveFigures = activeFigures.filter((f) => f.state !== "done");
      const figBounds = liveFigures.map((f) => computeBounds(f));
      const trailBounds = liveFigures.flatMap((f) => computeTrailBounds(f));

      ctx.font = `${CHAR_SIZE}px "Courier New", Consolas, monospace`;
      ctx.textBaseline = "top";

      // ── Pass 1: Background rain (with figure boost) ──
      for (let c = 0; c < rainCols.length; c++) {
        const col = rainCols[c];
        if (col.foreground) continue; // skip foreground columns in this pass
        drawRainCol(c, col, dt, figBounds, trailBounds, false);
      }

      // ── Pass 2: Figure glow halos ──
      for (const fb of figBounds) {
        if (fb.fadeAlpha <= 0) continue;

        // Broad ambient glow
        const rBroad = fb.height * CHAR_H * 0.8;
        const gradBroad = ctx.createRadialGradient(
          fb.centerX,
          fb.centerY,
          0,
          fb.centerX,
          fb.centerY,
          rBroad
        );
        gradBroad.addColorStop(
          0,
          `rgba(0, 255, 65, ${0.08 * fb.fadeAlpha})`
        );
        gradBroad.addColorStop(
          0.5,
          `rgba(0, 255, 65, ${0.03 * fb.fadeAlpha})`
        );
        gradBroad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradBroad;
        ctx.fillRect(
          fb.centerX - rBroad,
          fb.centerY - rBroad,
          rBroad * 2,
          rBroad * 2
        );

        // Tight core glow
        const rCore = fb.height * CHAR_H * 0.3;
        const gradCore = ctx.createRadialGradient(
          fb.centerX,
          fb.centerY,
          0,
          fb.centerX,
          fb.centerY,
          rCore
        );
        gradCore.addColorStop(
          0,
          `rgba(0, 255, 65, ${0.12 * fb.fadeAlpha})`
        );
        gradCore.addColorStop(
          0.6,
          `rgba(0, 255, 65, ${0.04 * fb.fadeAlpha})`
        );
        gradCore.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradCore;
        ctx.fillRect(
          fb.centerX - rCore,
          fb.centerY - rCore,
          rCore * 2,
          rCore * 2
        );
      }

      // Figure labels
      ctx.font = '9px "Courier New", Consolas, monospace';
      ctx.textAlign = "center";
      for (const fb of figBounds) {
        if (fb.fadeAlpha <= 0) continue;
        ctx.fillStyle = `rgba(0, 255, 65, ${0.35 * fb.fadeAlpha})`;
        ctx.fillText(fb.label, fb.centerX, fb.bottomY + 8);
      }
      ctx.textAlign = "start";
      ctx.font = `${CHAR_SIZE}px "Courier New", Consolas, monospace`;

      // ── Pass 3: Foreground rain (in front of figures) ──
      for (let c = 0; c < rainCols.length; c++) {
        const col = rainCols[c];
        if (!col.foreground) continue; // only foreground columns
        drawRainCol(c, col, dt, figBounds, trailBounds, true);
      }

      // Update figures
      for (const fig of activeFigures) {
        updateFigure(fig, dt);
      }
      activeFigures = activeFigures.filter((f) => f.state !== "done");

      // Try spawning
      trySpawn(dt);

      requestAnimationFrame(animate);
    }

    // ── Start with delay (wait for PageLoader) ──
    const startDelay = setTimeout(() => {
      resize();
      window.addEventListener("resize", resize);
      lastTime = 0;
      requestAnimationFrame(animate);
    }, 2500);

    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(0);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-[1] pointer-events-none"
    />
  );
}
