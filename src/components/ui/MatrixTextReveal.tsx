"use client";

import { useEffect, useRef } from "react";
import {
  MATRIX_CHARS,
  randomMatrixChar,
  buildTextGrid,
} from "@/lib/matrix";
import {
  computeThresholds,
  createCellGrid,
  updateReveal,
  updateDissolve,
  cellOpacity,
  type LockedCell,
} from "@/lib/matrixTextEffect";

// ─── Props ──────────────────────────────────────────────────────────────────

export type RevealPhase = "idle" | "revealing" | "holding" | "dissolving" | "done";

export interface MatrixTextRevealProps {
  text: string;
  phase: RevealPhase;
  /** 0→1 progress within the current phase */
  progress: number;
  revealDirection?: "ltr" | "rtl";
  dissolveDirection?: "ltr" | "rtl";
  /** Overall rain opacity 0→1 */
  rainIntensity?: number;
  /** Speed multiplier for rain columns (>1 = faster) */
  rainSpeedMultiplier?: number;
  cellSize?: number;
  charFadeInMs?: number;
  charFadeOutMs?: number;
}

// ─── Per-column rain state (mirrors corridor shader logic) ──────────────────

interface RainCol {
  head: number;
  speed: number;
  trailLen: number;
  phase: number;
}

// ─── Deterministic hash matching corridor shader ────────────────────────────

function hash(x: number, y: number): number {
  return ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1 + 1) % 1;
}

// ─── Font sizes per cell — varied like corridor GlyphAtlas ──────────────────
// Corridor atlas uses [36,42,48,52,56,60,64,72] in 64px cells → ratio 0.56–1.12
// We use similar ratios relative to our rain cell size

// Wide range: tiny to large, matching corridor wall multi-size feel
const FONT_RATIOS = [0.4, 0.5, 0.5, 0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.4, 2.8];

// ─── Component ──────────────────────────────────────────────────────────────

export default function MatrixTextReveal({
  text,
  phase,
  progress,
  revealDirection = "ltr",
  dissolveDirection = "rtl",
  rainIntensity = 1,
  rainSpeedMultiplier = 1,
  cellSize = 16,
  charFadeInMs = 120,
  charFadeOutMs = 80,
}: MatrixTextRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const propsRef = useRef({ phase, progress, rainIntensity, rainSpeedMultiplier });
  propsRef.current = { phase, progress, rainIntensity, rainSpeedMultiplier };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let animId: number;
    let w = 0;
    let h = 0;
    // Rain grid uses smaller cells for higher density
    const RAIN_CELL = 10;
    // Text grid uses the provided cellSize for proper letter formation
    const TEXT_CELL = cellSize;

    // Rain state
    let rainCols: RainCol[] = [];
    let rainGridCols = 0;
    let rainGridRows = 0;
    let cellChars: Uint16Array = new Uint16Array(0);
    let cellFontSizes: Uint8Array = new Uint8Array(0);

    // Text state
    let textMask: Uint8Array | null = null;
    let textCharMap: string[] = [];
    let textGridCols = 0;
    let textGridRows = 0;
    let revealThresholds: Float32Array | null = null;
    let lockedCells: (LockedCell | null)[] = [];

    let lastTime = performance.now();
    let elapsed = 0;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;

      // Rain grid (dense, small cells)
      rainGridCols = Math.floor(w / RAIN_CELL);
      rainGridRows = Math.floor(h / RAIN_CELL);

      const newCols: RainCol[] = [];
      for (let c = 0; c < rainGridCols; c++) {
        newCols.push(rainCols[c] ?? {
          head: 0,
          speed: (0.3 + hash(c, 0) * 1.4) * 12,
          trailLen: 8 + hash(c, 13.7) * 18,
          phase: hash(c, 7.3) * 80,
        });
      }
      rainCols = newCols;

      const totalCells = rainGridCols * rainGridRows;
      cellChars = new Uint16Array(totalCells);
      cellFontSizes = new Uint8Array(totalCells);
      // Seed-based RNG for consistent sizes
      let seed = 42;
      const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (let i = 0; i < totalCells; i++) {
        cellChars[i] = Math.floor(Math.random() * MATRIX_CHARS.length);
        const ratio = FONT_RATIOS[Math.floor(rng() * FONT_RATIOS.length)];
        cellFontSizes[i] = Math.round(RAIN_CELL * ratio);
      }

      // Text grid (larger cells for letter formation)
      const result = buildTextGrid(text, w, h, TEXT_CELL, TEXT_CELL);
      textMask = result.mask;
      textCharMap = result.charMap;
      textGridCols = result.cols;
      textGridRows = result.rows;

      revealThresholds = computeThresholds(textMask, textGridCols, textGridRows, revealDirection);
      lockedCells = createCellGrid(textGridCols, textGridRows);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const { phase: ph, progress: p, rainIntensity: inten, rainSpeedMultiplier: speedMult } =
        propsRef.current;

      elapsed += dt * speedMult;

      // ── Update locked cells ───────────────────────────────────────────
      if (textMask && revealThresholds) {
        if (ph === "revealing") {
          updateReveal(lockedCells, revealThresholds, textMask, p, dt, charFadeInMs, textCharMap);
        } else if (ph === "holding") {
          updateReveal(lockedCells, revealThresholds, textMask, 1, dt, charFadeInMs, textCharMap);
        } else if (ph === "dissolving") {
          updateDissolve(lockedCells, revealThresholds, p, dt, charFadeOutMs);
        } else if (ph === "done") {
          for (let i = 0; i < lockedCells.length; i++) lockedCells[i] = null;
        }
      }

      // ── Clear frame ───────────────────────────────────────────────────
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // ── Buzz characters ───────────────────────────────────────────────
      for (let i = 0; i < cellChars.length; i++) {
        const cellHash = hash(i % rainGridCols, Math.floor(i / rainGridCols) * 3.17);
        const buzzRate = 4 + cellHash * 4;
        if (Math.floor(elapsed * buzzRate) !== Math.floor((elapsed - dt * speedMult) * buzzRate)) {
          cellChars[i] = Math.floor(Math.random() * MATRIX_CHARS.length);
        }
      }

      // ── Update rain heads ─────────────────────────────────────────────
      for (let c = 0; c < rainCols.length; c++) {
        const col = rainCols[c];
        col.head += col.speed * speedMult * dt;
        const wrapLen = rainGridRows + col.trailLen + 5;
        if (col.head > wrapLen) col.head -= wrapLen;
      }

      // ── Build locked cell lookup for fast skip ────────────────────────
      // Map from rain grid coords → whether a locked text cell covers it
      // (text cells are larger, so one text cell covers multiple rain cells)

      // ── Draw rain grid ────────────────────────────────────────────────
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let c = 0; c < rainGridCols; c++) {
        const col = rainCols[c];
        const x = c * RAIN_CELL + RAIN_CELL / 2;

        for (let r = 0; r < rainGridRows; r++) {
          const idx = r * rainGridCols + c;
          const cy = r * RAIN_CELL + RAIN_CELL / 2;

          // Check if a locked text cell covers this rain cell
          const textC = Math.floor((c * RAIN_CELL) / TEXT_CELL);
          const textR = Math.floor((r * RAIN_CELL) / TEXT_CELL);
          if (textC < textGridCols && textR < textGridRows) {
            const textIdx = textR * textGridCols + textC;
            if (lockedCells[textIdx] !== null) continue;
          }

          // Rain brightness (corridor shader logic)
          const headPos = col.head + col.phase % rainGridRows;
          const d = ((headPos - r) % (rainGridRows + col.trailLen + 5) + rainGridRows + col.trailLen + 5) % (rainGridRows + col.trailLen + 5);

          let brightness: number;
          let isHead = false;

          if (d >= 0 && d < 1.5) {
            brightness = 1.0;
            isHead = true;
          } else if (d >= 1.5 && d < col.trailLen) {
            const t = (d - 1.5) / (col.trailLen - 1.5);
            brightness = (1 - t) * (1 - t) * 0.85 + 0.15;
          } else {
            brightness = 0.15;
          }

          const charVariation = 0.7 + hash(c, r * 3.17) * 0.6;
          brightness *= charVariation * inten;

          if (brightness < 0.01) continue;

          const fontSize = cellFontSizes[idx];
          const char = MATRIX_CHARS[cellChars[idx]];

          ctx.font = `900 ${fontSize}px monospace`;
          if (isHead && brightness > 0.5) {
            const wb = Math.floor(180 + 75 * brightness);
            ctx.fillStyle = `rgb(${wb}, ${wb}, ${wb})`;
          } else {
            const g = Math.floor(60 + brightness * 195);
            ctx.fillStyle = `rgb(0, ${g}, ${Math.floor(g * 0.15)})`;
          }
          ctx.globalAlpha = Math.min(1, brightness * 1.3);
          ctx.fillText(char, x, cy);
          ctx.globalAlpha = 1;
        }
      }

      // ── Draw locked text cells (on top of rain) ───────────────────────
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      for (let i = 0; i < lockedCells.length; i++) {
        const cell = lockedCells[i];
        if (cell === null) continue;

        const c = i % textGridCols;
        const r = Math.floor(i / textGridCols);
        const x = c * TEXT_CELL;
        const cy = r * TEXT_CELL;

        const alpha = cellOpacity(cell);
        if (alpha <= 0) continue;

        ctx.globalAlpha = alpha * inten;
        ctx.font = `900 ${TEXT_CELL + 2}px monospace`;
        ctx.fillStyle = "#00ff41";
        ctx.fillText(cell.char, x, cy);
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, revealDirection, dissolveDirection, cellSize, charFadeInMs, charFadeOutMs]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
