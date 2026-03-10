"use client";

import { useRef, useEffect, useCallback } from "react";
import { MATRIX_CHARS } from "@/lib/matrix";

// ─── Rabbit ASCII sprites (20 wide × 24 tall) ──────────────────────────────
// Density: '#' = 1.0, '+' = 0.7, '.' = 0.4, ' ' = 0

const RABBIT_STAND = [
  "      ..##..        ",
  "     .+####.        ",
  "    .+#####+.       ",
  "    +########.      ",
  "    +########.      ",
  "    .+######+.      ",
  "     .+####+.       ",
  "      .####.        ",
  "     .######.       ",
  "    .+######+.      ",
  "   .##########+.    ",
  "   +###########.    ",
  "  .############+.   ",
  "  +#############.   ",
  "  .############+.   ",
  "   +##########.     ",
  "   .#########.      ",
  "    .+######.       ",
  "     +#####+.       ",
  "    .#+..+##.       ",
  "    +#.  .#+.       ",
  "   .#+    +#.       ",
  "   .#.    .#.       ",
  "   ..      ..       ",
];

const RABBIT_HOP1 = [
  "      ..##..        ",
  "     .+####.        ",
  "    .+#####+.       ",
  "    +########.      ",
  "    +########.      ",
  "    .+######+.      ",
  "     .+####+.       ",
  "      .####.        ",
  "     .######.       ",
  "    .+######+.      ",
  "   .##########+.    ",
  "   +###########.    ",
  "  .############+.   ",
  "  +#############.   ",
  "  .############+.   ",
  "   +##########.     ",
  "   .#########.      ",
  "    .+######.       ",
  "     .####.         ",
  "      +##+.         ",
  "     .#+.#+.        ",
  "    .#+  .#+        ",
  "    .+    .+        ",
  "                    ",
];

const RABBIT_HOP2 = [
  "                    ",
  "      ..##..        ",
  "     .+####.        ",
  "    .+#####+.       ",
  "    +########.      ",
  "    +########.      ",
  "    .+######+.      ",
  "     .+####+.       ",
  "      .####.        ",
  "     .######.       ",
  "    .+######+.      ",
  "   .##########+.    ",
  "   +###########.    ",
  "  .############+.   ",
  "  +#############.   ",
  "   .###########.    ",
  "    +#########+     ",
  "    .+######+.      ",
  "     .+####+.       ",
  "      .+##+.        ",
  "       +#.+.        ",
  "      .+  .+        ",
  "      .    .        ",
  "                    ",
];

const RABBIT_HOP3 = [
  "                    ",
  "                    ",
  "      ..##..        ",
  "     .+####.        ",
  "    .+#####+.       ",
  "    +########.      ",
  "    .+######+.      ",
  "     .+####+.       ",
  "      .####.        ",
  "     .######.       ",
  "    .+######+.      ",
  "   .##########+.    ",
  "   +###########.    ",
  "  .############+.   ",
  "  +############.    ",
  "   +##########.     ",
  "   .########+.      ",
  "    .+#####+.       ",
  "     +####.         ",
  "     .+#+.          ",
  "    .+#.+#.         ",
  "    .+. .+.         ",
  "    .    .          ",
  "                    ",
];

const HOP_FRAMES = [RABBIT_STAND, RABBIT_HOP1, RABBIT_HOP2, RABBIT_HOP3, RABBIT_HOP2, RABBIT_HOP1];

const SPRITE_W = 20;
const SPRITE_H = 24;
const DENSITY_MAP: Record<string, number> = { "#": 1.0, "+": 0.7, ".": 0.4, " ": 0.0 };

const CELL = 6; // px per character cell
const CANVAS_W = SPRITE_W * CELL;
const CANVAS_H = SPRITE_H * CELL;

function randomMatrixChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

export default function ScrollRabbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    scrollY: 0,
    lastScrollY: 0,
    frame: 0,
    accumDelta: 0,
    visible: false,
    rabbitY: 100, // vh offset from top — will be computed
    charGrid: Array.from({ length: SPRITE_H }, () =>
      Array.from({ length: SPRITE_W }, () => randomMatrixChar())
    ),
    lastCharSwap: 0,
  });

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;
    const sprite = HOP_FRAMES[s.frame % HOP_FRAMES.length];

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font = `${CELL}px monospace`;
    ctx.textBaseline = "top";

    for (let row = 0; row < SPRITE_H; row++) {
      const line = sprite[row] || "";
      for (let col = 0; col < SPRITE_W; col++) {
        const ch = line[col] || " ";
        const density = DENSITY_MAP[ch] ?? 0;
        if (density <= 0) continue;

        const alpha = density * 0.9;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;

        // Occasionally swap displayed character for matrix flicker
        const displayChar = s.charGrid[row][col];
        ctx.fillText(displayChar, col * CELL, row * CELL);

        // Core glow for high density
        if (density >= 0.7) {
          ctx.fillStyle = `rgba(57, 255, 20, ${density * 0.3})`;
          ctx.fillText(displayChar, col * CELL, row * CELL);
        }
      }
    }
  }, []);

  useEffect(() => {
    const s = stateRef.current;

    // Character flicker interval
    const flickerInterval = setInterval(() => {
      const row = Math.floor(Math.random() * SPRITE_H);
      const col = Math.floor(Math.random() * SPRITE_W);
      s.charGrid[row][col] = randomMatrixChar();
    }, 50);

    let rafId: number;

    const onScroll = () => {
      s.scrollY = window.scrollY;
    };

    const tick = () => {
      const delta = Math.abs(s.scrollY - s.lastScrollY);

      // Only animate when scrolling
      if (delta > 2) {
        s.accumDelta += delta;
        // Advance hop frame every 80px of scroll
        if (s.accumDelta > 80) {
          s.frame = (s.frame + 1) % HOP_FRAMES.length;
          s.accumDelta = 0;
        }
      }

      s.lastScrollY = s.scrollY;

      // Position: rabbit Y tracks scroll progress through the page
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? s.scrollY / docHeight : 0;

      // Rabbit travels from top to bottom of viewport
      const topOffset = 80; // start 80px from top
      const bottomOffset = window.innerHeight - CANVAS_H - 40;
      const y = topOffset + progress * (bottomOffset - topOffset);

      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateY(${y}px)`;
        // Fade in after hero, fade out near bottom
        const opacity = progress < 0.05 ? progress / 0.05 : progress > 0.92 ? (1 - progress) / 0.08 : 1;
        wrapperRef.current.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      }

      drawFrame();
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      clearInterval(flickerInterval);
    };
  }, [drawFrame]);

  return (
    <div
      ref={wrapperRef}
      className="fixed right-4 top-0 z-[50] pointer-events-none hidden lg:block"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Label */}
      <div
        className="font-mono text-[9px] text-green-400/40 tracking-[0.2em] text-center mb-1"
        style={{ textShadow: "0 0 6px rgba(0,255,65,0.3)" }}
      >
        FOLLOW THE
      </div>
      <div
        className="font-mono text-[9px] text-green-400/60 tracking-[0.2em] text-center mb-2"
        style={{ textShadow: "0 0 8px rgba(0,255,65,0.5)" }}
      >
        WHITE RABBIT
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
