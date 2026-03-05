"use client";

import { useEffect, useRef } from "react";
import {
  randomMatrixChar,
  buildFontSizes,
  drawRainChar,
  buildTextGrid,
  createRainColumns,
  type RainColumn,
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

// ─── Background drop ────────────────────────────────────────────────────────

interface BgDrop {
  x: number;
  y: number;
  speed: number;
  fontSize: number;
}

const BG_FONT_SIZES = [8, 10, 12, 14, 18, 22, 26, 30];

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

  // Stable refs so the animation loop always reads fresh values
  const propsRef = useRef({ phase, progress, rainIntensity, rainSpeedMultiplier });
  propsRef.current = { phase, progress, rainIntensity, rainSpeedMultiplier };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let animId: number;
    let w = 0;
    let h = 0;
    const CELL = cellSize;

    // State
    let columns: (RainColumn & { fontSize: number })[] = [];
    let bgDrops: BgDrop[] = [];
    let textMask: Uint8Array | null = null;
    let gridCols = 0;
    let gridRows = 0;
    let revealThresholds: Float32Array | null = null;
    let cells: (LockedCell | null)[] = [];
    let lastTime = performance.now();

    const fontSizes = buildFontSizes(CELL);

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      gridCols = Math.floor(w / CELL);
      gridRows = Math.floor(h / CELL);

      // Primary rain columns
      const baseColumns = createRainColumns(gridCols, h, CELL);
      const newCols: (RainColumn & { fontSize: number })[] = [];
      for (let i = 0; i < gridCols; i++) {
        newCols.push(
          columns[i] ?? {
            ...baseColumns[i],
            fontSize: fontSizes[Math.floor(Math.random() * fontSizes.length)],
          }
        );
      }
      columns = newCols;

      // Background drops — extra density
      const bgCount = Math.floor(w / 8);
      if (bgDrops.length !== bgCount) {
        bgDrops = [];
        for (let i = 0; i < bgCount; i++) {
          bgDrops.push({
            x: Math.random() * w,
            y: Math.random() * h * -1,
            speed: 0.8 + Math.random() * 4.0,
            fontSize: BG_FONT_SIZES[Math.floor(Math.random() * BG_FONT_SIZES.length)],
          });
        }
      }

      // Text mask & thresholds
      const result = buildTextGrid(text, w, h, CELL, CELL);
      textMask = result.mask;
      gridCols = result.cols;
      gridRows = result.rows;

      revealThresholds = computeThresholds(textMask, gridCols, gridRows, revealDirection);
      cells = createCellGrid(gridCols, gridRows);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;

      const { phase: ph, progress: p, rainIntensity: inten, rainSpeedMultiplier: speedMult } =
        propsRef.current;

      // ── Update locked cells ───────────────────────────────────────────
      if (textMask && revealThresholds) {
        if (ph === "revealing") {
          updateReveal(cells, revealThresholds, textMask, p, dt, charFadeInMs);
        } else if (ph === "holding") {
          // Keep all cells fully visible — just advance fadeIn for any stragglers
          updateReveal(cells, revealThresholds, textMask, 1, dt, charFadeInMs);
        } else if (ph === "dissolving") {
          updateDissolve(cells, revealThresholds, p, dt, charFadeOutMs);
        } else if (ph === "done") {
          // Clear all
          for (let i = 0; i < cells.length; i++) cells[i] = null;
        }
      }

      // ── Fade trails ───────────────────────────────────────────────────
      const fadeAlpha = 0.08 + (1 - inten) * 0.06;
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);

      // ── Background rain drops ─────────────────────────────────────────
      for (let i = 0; i < bgDrops.length; i++) {
        const drop = bgDrops[i];
        drop.y += drop.speed * (0.5 + inten * 0.8) * speedMult;

        if (drop.y > h + 50) {
          drop.y = Math.random() * -100;
          drop.x = Math.random() * w;
          drop.speed = 0.8 + Math.random() * 4.0;
          drop.fontSize = BG_FONT_SIZES[Math.floor(Math.random() * BG_FONT_SIZES.length)];
        }

        if (drop.y > 0) {
          drawRainChar({
            ctx,
            char: randomMatrixChar(),
            x: drop.x,
            y: drop.y,
            fontSize: drop.fontSize,
            intensity: inten * (drop.fontSize < 14 ? 0.5 : 0.8),
          });
        }
      }

      // ── Primary rain columns ──────────────────────────────────────────
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = i * CELL;

        col.y += col.speed * (0.4 + inten * 0.8) * speedMult;

        if (col.y * CELL > h + 200) {
          col.y = Math.random() * -15;
          col.speed = 0.3 + Math.random() * 2.5;
          col.fontSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];
        }

        // Skip rain head near locked cells
        const headRow = Math.floor(col.y);
        let skipRain = false;
        if (ph === "revealing" || ph === "holding" || ph === "dissolving") {
          for (let r = Math.max(0, headRow - 2); r <= Math.min(gridRows - 1, headRow + 2); r++) {
            if (cells[r * gridCols + i] !== null) {
              skipRain = true;
              break;
            }
          }
        }

        const headY = col.y * CELL;
        if (!skipRain && headY > 0 && headY < h) {
          drawRainChar({
            ctx,
            char: randomMatrixChar(),
            x,
            y: headY,
            fontSize: col.fontSize,
            intensity: inten * 0.6,
          });
        }
      }

      // ── Locked text cells ─────────────────────────────────────────────
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell === null) continue;

        const c = i % gridCols;
        const r = Math.floor(i / gridCols);
        const x = c * CELL;
        const cy = r * CELL + CELL;

        const alpha = cellOpacity(cell);
        if (alpha <= 0) continue;

        ctx.globalAlpha = alpha;
        ctx.font = `bold ${CELL + 4}px monospace`;
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
    // Only re-mount on text or direction changes (not on phase/progress which use refs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, revealDirection, dissolveDirection, cellSize, charFadeInMs, charFadeOutMs]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
