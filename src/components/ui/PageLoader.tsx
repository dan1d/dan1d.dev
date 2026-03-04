"use client";

import { useEffect, useRef, useState } from "react";
import {
  MATRIX_CHARS,
  randomMatrixChar,
  buildFontSizes,
  pickFontSize,
  drawRainChar,
  buildTextGrid,
  smoothstep,
} from "@/lib/matrix";

// ─── Phases ─────────────────────────────────────────────────────────────────
type Phase = "rain_in" | "text_form" | "text_hold" | "rain_close" | "fade_out";

const PHASE_DURATIONS: Record<Phase, number> = {
  rain_in: 1800,
  text_form: 2500,
  text_hold: 1400,
  rain_close: 1400,
  fade_out: 1600,
};

// ─── IntroCanvas — rain drops form the text ─────────────────────────────────

function IntroCanvas({ phase, progress }: { phase: Phase; progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const progressRef = useRef(progress);
  phaseRef.current = phase;
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let animId: number;
    let w = 0, h = 0;
    const CELL = 16;

    // Column with locking support for text formation
    interface LockInfo { char: string; age: number; threshold: number }
    interface Col {
      y: number;
      speed: number;
      locked: Map<number, LockInfo>;
    }

    let columns: Col[] = [];
    let textMask: Uint8Array | null = null;
    let gridCols = 0;
    let gridRows = 0;
    let lockThresholds: Float32Array | null = null;

    const fontSizes = buildFontSizes(CELL);

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      gridCols = Math.floor(w / CELL);
      gridRows = Math.floor(h / CELL);

      const newCols: Col[] = [];
      for (let i = 0; i < gridCols; i++) {
        newCols.push(columns[i] ?? {
          y: Math.random() * gridRows * -0.5,
          speed: 0.5 + Math.random() * 1.0,
          locked: new Map(),
        });
      }
      columns = newCols;

      const result = buildTextGrid("Wake up, dan1d...", w, h, CELL, CELL);
      textMask = result.mask;

      for (let c = 0; c < gridCols; c++) {
        columns[c].locked.clear();
      }
    }

    function ensureThresholds() {
      if (lockThresholds && lockThresholds.length === gridCols * gridRows) return;
      lockThresholds = new Float32Array(gridCols * gridRows);
      for (let i = 0; i < lockThresholds.length; i++) {
        lockThresholds[i] = Math.random() * 0.8;
      }
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const ph = phaseRef.current;
      const p = progressRef.current;

      ensureThresholds();

      // Intensity
      let inten = 1;
      if (ph === "rain_in") inten = smoothstep(p);
      else if (ph === "fade_out") inten = 1 - smoothstep(p);

      // Text formation progress
      let textProg = 0;
      if (ph === "text_form") textProg = p;
      else if (ph === "text_hold") textProg = 1;
      else if (ph === "rain_close") textProg = 1 - p;

      // Fade trails
      const fadeAlpha = 0.08 + (1 - inten) * 0.06;
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);

      // Fast rain during rain_in
      const speedMult = ph === "rain_in" ? 2.8 : 1.0;

      // Draw each column
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = i * CELL;

        // Move rain head
        col.y += col.speed * (0.4 + inten * 0.8) * speedMult;

        if (col.y * CELL > h + 200) {
          col.y = Math.random() * -15;
          col.speed = 0.5 + Math.random() * 1.0;
        }

        // Lock characters at text positions
        if (textMask && textProg > 0 && lockThresholds) {
          const headRow = Math.floor(col.y);
          for (let checkRow = Math.max(0, headRow - 1); checkRow <= Math.min(gridRows - 1, headRow); checkRow++) {
            const cellIdx = checkRow * gridCols + i;
            if (textMask[cellIdx] === 1 && !col.locked.has(checkRow)) {
              const threshold = lockThresholds[cellIdx];
              if (textProg > threshold) {
                col.locked.set(checkRow, {
                  char: randomMatrixChar(),
                  age: 0,
                  threshold,
                });
              }
            }
          }
        }

        // Unlock when dissolving
        if (textProg < 0.99 && ph === "rain_close") {
          for (const [row, info] of col.locked) {
            if (textProg < info.threshold) col.locked.delete(row);
          }
        }
        if (textProg <= 0 && col.locked.size > 0) col.locked.clear();

        // Draw falling rain character
        const headY = col.y * CELL;
        if (headY > 0 && headY < h) {
          drawRainChar({
            ctx,
            char: randomMatrixChar(),
            x,
            y: headY,
            fontSize: pickFontSize(fontSizes),
            intensity: inten,
          });
        }

        // Draw locked (text-forming) characters
        for (const [row, info] of col.locked) {
          info.age += 0.016;

          if (Math.random() < 0.025) info.char = randomMatrixChar();

          const cy = row * CELL + CELL;
          const ageFactor = Math.min(1, info.age * 2);

          ctx.font = `bold ${CELL}px monospace`;

          // Bright white — stands out against green rain
          const wv = Math.floor(200 + 55 * ageFactor);
          ctx.fillStyle = `rgb(${wv}, ${wv}, ${wv})`;
          ctx.shadowColor = "#00ff41";
          ctx.shadowBlur = 4 + ageFactor * 8;

          ctx.fillText(info.char, x, cy);
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Page Loader ────────────────────────────────────────────────────────────

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("rain_in");
  const [progress, setProgress] = useState(0);
  const phaseStartRef = useRef(Date.now());
  const phaseRef = useRef<Phase>("rain_in");

  useEffect(() => {
    let animId: number;

    const tick = () => {
      const elapsed = Date.now() - phaseStartRef.current;
      const duration = PHASE_DURATIONS[phaseRef.current];
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p >= 1) {
        const order: Phase[] = ["rain_in", "text_form", "text_hold", "rain_close", "fade_out"];
        const idx = order.indexOf(phaseRef.current);
        if (idx < order.length - 1) {
          phaseRef.current = order[idx + 1];
          setPhase(order[idx + 1]);
          phaseStartRef.current = Date.now();
        } else {
          setVisible(false);
          return;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Fallback
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  const isFadingOut = phase === "fade_out";
  const smoothFade = isFadingOut ? 1 - smoothstep(progress) : 1;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] bg-black"
      style={{ opacity: smoothFade }}
    >
      <IntroCanvas phase={phase} progress={progress} />

      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.04) 2px, rgba(0,255,65,0.04) 4px)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
