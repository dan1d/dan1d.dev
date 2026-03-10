"use client";

import { useRef, useEffect, useCallback } from "react";
import { MATRIX_CHARS } from "@/lib/matrix";

// ─── Rabbit silhouette mask (40 wide × 52 tall) ────────────────────────────
// 1 = inside rabbit, 0 = outside. Sitting rabbit with tall ears, side profile.

/* prettier-ignore */
const RABBIT_MASK = [
  "0000000000001100000000000000000000000000",
  "0000000000011110000000000000000000000000",
  "0000000000111111000000000000000000000000",
  "0000000001111111000000000000000000000000",
  "0000000011111111100000000000000000000000",
  "0000000011111111100001100000000000000000",
  "0000000111111111100011110000000000000000",
  "0000000111111111110011111000000000000000",
  "0000001111111111110111111100000000000000",
  "0000001111111111111111111100000000000000",
  "0000001111111111111111111110000000000000",
  "0000011111111111111111111110000000000000",
  "0000011111111111111111111111000000000000",
  "0000011111111111111111111111000000000000",
  "0000011111111111111111111111100000000000",
  "0000001111111111111111111111100000000000",
  "0000000111111111111111111111100000000000",
  "0000000011111111111111111111100000000000",
  "0000000001111111111111111111000000000000",
  "0000000000111111111111111111000000000000",
  "0000000000011111111111111110000000000000",
  "0000000000011111111111111100000000000000",
  "0000000000111111111111111100000000000000",
  "0000000001111111111111111110000000000000",
  "0000000011111111111111111111000000000000",
  "0000000111111111111111111111100000000000",
  "0000001111111111111111111111110000000000",
  "0000011111111111111111111111111000000000",
  "0000111111111111111111111111111100000000",
  "0001111111111111111111111111111110000000",
  "0011111111111111111111111111111111000000",
  "0111111111111111111111111111111111100000",
  "0111111111111111111111111111111111110000",
  "1111111111111111111111111111111111111000",
  "1111111111111111111111111111111111111100",
  "1111111111111111111111111111111111111110",
  "1111111111111111111111111111111111111111",
  "1111111111111111111111111111111111111111",
  "1111111111111111111111111111111111111111",
  "0111111111111111111111111111111111111111",
  "0111111111111111111111111111111111111110",
  "0011111111111111111111111111111111111100",
  "0011111111111111111111111111111111111100",
  "0001111111111111111111111111111111111000",
  "0001111111111111100011111111111111110000",
  "0000111111111111000001111111111111100000",
  "0000011111111110000000111111111111000000",
  "0000001111111100000000011111111110000000",
  "0000001111111100000000011111111100000000",
  "0000001111111000000000001111111100000000",
  "0000001111111000000000001111111000000000",
  "0000000111110000000000000111111000000000",
];

const MASK_W = 40;
const MASK_H = RABBIT_MASK.length;
const CELL = 4; // px per character cell
const CANVAS_W = MASK_W * CELL;
const CANVAS_H = MASK_H * CELL;

function randomMatrixChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

// ─── Rain columns state ─────────────────────────────────────────────────────
// Each column has falling rain characters inside the rabbit silhouette

interface RainDrop {
  y: number; // current row position (float for smooth)
  speed: number; // rows per tick
  length: number; // trail length
  chars: string[]; // characters in the trail
}

function createRainDrop(col: number): RainDrop {
  // Find the first row where this column enters the rabbit
  let startRow = -Math.floor(Math.random() * MASK_H);
  return {
    y: startRow,
    speed: 0.15 + Math.random() * 0.25,
    length: 4 + Math.floor(Math.random() * 8),
    chars: Array.from({ length: 12 }, () => randomMatrixChar()),
  };
}

export default function ScrollRabbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    scrollY: 0,
    lastScrollY: 0,
    lastTime: 0,
    rainDrops: Array.from({ length: MASK_W }, (_, col) => createRainDrop(col)) as RainDrop[],
    // Static character grid for the silhouette fill
    charGrid: Array.from({ length: MASK_H }, () =>
      Array.from({ length: MASK_W }, () => randomMatrixChar())
    ),
  });

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;
    const dt = s.lastTime ? (timestamp - s.lastTime) / 16.67 : 1; // normalize to ~60fps
    s.lastTime = timestamp;

    const scrollDelta = Math.abs(s.scrollY - s.lastScrollY);
    const isScrolling = scrollDelta > 1;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Update rain drops
    for (let col = 0; col < MASK_W; col++) {
      const drop = s.rainDrops[col];
      // Rain falls faster when scrolling
      const speedMult = isScrolling ? 2.5 : 0.5;
      drop.y += drop.speed * dt * speedMult;

      // Reset drop when it's past the mask
      if (drop.y - drop.length > MASK_H) {
        s.rainDrops[col] = createRainDrop(col);
      }

      // Randomize a char in trail occasionally
      if (Math.random() < 0.05) {
        const idx = Math.floor(Math.random() * drop.chars.length);
        drop.chars[idx] = randomMatrixChar();
      }
    }

    // Randomize static grid chars occasionally
    if (Math.random() < 0.3) {
      const r = Math.floor(Math.random() * MASK_H);
      const c = Math.floor(Math.random() * MASK_W);
      s.charGrid[r][c] = randomMatrixChar();
    }

    // Draw
    ctx.font = `${CELL + 1}px monospace`;
    ctx.textBaseline = "top";

    for (let row = 0; row < MASK_H; row++) {
      for (let col = 0; col < MASK_W; col++) {
        if (RABBIT_MASK[row][col] !== "1") continue;

        const drop = s.rainDrops[col];
        const headRow = Math.floor(drop.y);
        const distFromHead = headRow - row;

        let alpha: number;
        let bright = false;

        if (distFromHead >= 0 && distFromHead < drop.length) {
          // Inside the rain trail
          if (distFromHead === 0) {
            // Head of the drop — brightest
            alpha = 1.0;
            bright = true;
          } else {
            // Trail fades
            alpha = 0.7 - (distFromHead / drop.length) * 0.5;
          }
        } else {
          // Background fill — dim ambient characters
          alpha = 0.08 + Math.random() * 0.06;
        }

        const ch = distFromHead >= 0 && distFromHead < drop.chars.length
          ? drop.chars[distFromHead]
          : s.charGrid[row][col];

        if (bright) {
          // Bright head: white-green
          ctx.fillStyle = `rgba(180, 255, 180, ${alpha})`;
          ctx.fillText(ch, col * CELL, row * CELL);
          // Glow layer
          ctx.fillStyle = `rgba(0, 255, 65, 0.6)`;
          ctx.fillText(ch, col * CELL, row * CELL);
        } else {
          ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
          ctx.fillText(ch, col * CELL, row * CELL);
        }
      }
    }

    s.lastScrollY = s.scrollY;
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    let rafId: number;

    const onScroll = () => {
      s.scrollY = window.scrollY;
    };

    const tick = (timestamp: number) => {
      // Position: rabbit Y tracks scroll progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? s.scrollY / docHeight : 0;

      const topOffset = 60;
      const bottomOffset = window.innerHeight - CANVAS_H - 20;
      const y = topOffset + progress * (bottomOffset - topOffset);

      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateY(${y}px)`;
        // Fade in after hero, fade out near bottom
        const opacity =
          progress < 0.05
            ? progress / 0.05
            : progress > 0.92
              ? (1 - progress) / 0.08
              : 1;
        wrapperRef.current.style.opacity = String(
          Math.max(0, Math.min(1, opacity))
        );
      }

      drawFrame(timestamp);
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [drawFrame]);

  return (
    <div
      ref={wrapperRef}
      className="fixed right-2 top-0 z-[50] pointer-events-none hidden lg:block"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="drop-shadow-[0_0_12px_rgba(0,255,65,0.3)]"
        style={{ imageRendering: "auto" }}
      />
      {/* Label below rabbit */}
      <div
        className="font-mono text-[8px] text-green-400/50 tracking-[0.25em] text-center mt-1"
        style={{ textShadow: "0 0 8px rgba(0,255,65,0.4)" }}
      >
        FOLLOW THE WHITE RABBIT
      </div>
    </div>
  );
}
