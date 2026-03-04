"use client";

import { useRef, useEffect } from "react";

// ─── Matrix characters ───────────────────────────────────────────────────────

const KATAKANA =
  "\u30A0\u30A1\u30A2\u30A3\u30A4\u30A5\u30A6\u30A7\u30A8\u30A9\u30AA\u30AB\u30AC\u30AD\u30AE\u30AF" +
  "\u30B0\u30B1\u30B2\u30B3\u30B4\u30B5\u30B6\u30B7\u30B8\u30B9\u30BA\u30BB\u30BC\u30BD\u30BE\u30BF" +
  "\u30C0\u30C1\u30C2\u30C3\u30C4\u30C5\u30C6\u30C7\u30C8\u30C9\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF";
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const ALL_CHARS = KATAKANA + LATIN;

function rndChar() {
  return ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
}

// ─── Figure silhouettes ──────────────────────────────────────────────────────
// '#' = figure pixel, ' ' = empty
// Wider, taller silhouettes for better visibility

const MORPHEUS_SHAPE = [
  "        ########        ",
  "       ##########       ",
  "      ############      ",
  "      ############      ",
  "       ##########       ",
  "        ########        ",
  "          ####          ",
  "       ##########       ",
  "      ############      ",
  "     ##############     ",
  "    ################    ",
  "   ##################   ",
  "   ##################   ",
  "   ########  ########   ",
  "   ########  ########   ",
  "   ########  ########   ",
  "   #######   ########   ",
  "    ######   #######    ",
  "    ######   #######    ",
  "     #####   ######     ",
  "     #####   ######     ",
  "      ####   #####      ",
  "      ####    ####      ",
  "      ####    ####      ",
  "     #####   #####      ",
  "     #####   #####      ",
  "    ######  ######      ",
  "   #######  #######     ",
];

const SMITH_SHAPE = [
  "        ########        ",
  "       ##########       ",
  "       ##########       ",
  "       ##########       ",
  "        ########        ",
  "          ####          ",
  "       ##########       ",
  "      ############      ",
  "     ##############     ",
  "    ################    ",
  "   ##################   ",
  "   ##################   ",
  "   ##########  ######   ",
  "   ##########  ######   ",
  "    #########  #####    ",
  "    #########  #####    ",
  "     ########  ####     ",
  "     #######   ####     ",
  "      ######  ####      ",
  "      ######  ####      ",
  "       ####   ####      ",
  "       ####   ####      ",
  "      #####  #####      ",
  "      #####  #####      ",
  "     ######  ######     ",
  "    #######  #######    ",
];

function parseSilhouette(data: string[]): boolean[][] {
  return data.map((row) => Array.from(row).map((ch) => ch === "#"));
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FigureZone {
  startCol: number;
  startRow: number;
  width: number;
  height: number;
  mask: boolean[][];
  brightness: number;
}

interface RainCol {
  y: number;
  speed: number;
  chars: string[];
  trail: number;
}

export default function MatrixVisionScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smaller chars = denser rain filling every pixel
    const CHAR_SIZE = 10;
    const CHAR_W = CHAR_SIZE * 0.58;
    const CHAR_H = CHAR_SIZE * 1.15;

    const morpheusMask = parseSilhouette(MORPHEUS_SHAPE);
    const smithMask = parseSilhouette(SMITH_SHAPE);

    // State
    let w = 0;
    let h = 0;
    let numCols = 0;
    let numRows = 0;
    let rainCols: RainCol[] = [];
    let zones: FigureZone[] = [];

    // Figure placement configs — bigger scale, higher brightness
    const figureDefs = [
      {
        mask: morpheusMask,
        centerX: 0.25,
        centerY: 0.46,
        scale: 2.2,
        brightness: 5.0,
      },
      {
        mask: smithMask,
        centerX: 0.75,
        centerY: 0.46,
        scale: 2.2,
        brightness: 5.0,
      },
    ];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = container!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      numCols = Math.ceil(w / CHAR_W);
      numRows = Math.ceil(h / CHAR_H);

      // Build rain columns — one per character column = full coverage
      rainCols = [];
      for (let c = 0; c < numCols; c++) {
        const trail = 10 + Math.floor(Math.random() * 30);
        const chars: string[] = [];
        for (let r = 0; r < numRows + trail; r++) chars.push(rndChar());
        rainCols.push({
          y: Math.random() * (numRows + trail),
          speed: 0.4 + Math.random() * 3.5,
          chars,
          trail,
        });
      }

      // Build figure zones (scaled to grid)
      zones = figureDefs.map((fig) => {
        const srcH = fig.mask.length;
        const srcW = fig.mask[0].length;
        const scaledW = Math.ceil(srcW * fig.scale);
        const scaledH = Math.ceil(srcH * fig.scale);
        const startCol = Math.floor(fig.centerX * numCols - scaledW / 2);
        const startRow = Math.floor(fig.centerY * numRows - scaledH / 2);

        // Scale the mask
        const mask: boolean[][] = [];
        for (let r = 0; r < scaledH; r++) {
          const row: boolean[] = [];
          for (let c = 0; c < scaledW; c++) {
            const srcR = Math.floor(r / fig.scale);
            const srcC = Math.floor(c / fig.scale);
            row.push(srcR < srcH && srcC < srcW && fig.mask[srcR][srcC]);
          }
          mask.push(row);
        }

        return {
          startCol,
          startRow,
          width: scaledW,
          height: scaledH,
          mask,
          brightness: fig.brightness,
        };
      });
    }

    resize();
    window.addEventListener("resize", resize);

    // Check if a cell is inside any figure silhouette
    function getBoost(col: number, row: number): number {
      for (const z of zones) {
        const lc = col - z.startCol;
        const lr = row - z.startRow;
        if (lc >= 0 && lc < z.width && lr >= 0 && lr < z.height) {
          if (z.mask[lr]?.[lc]) return z.brightness;
        }
      }
      return 0;
    }

    let lastTime = performance.now();

    function animate(now: number) {
      if (!ctx) return;

      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      // Fade previous frame — lower = longer trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${CHAR_SIZE}px "Courier New", Consolas, monospace`;
      ctx.textBaseline = "top";

      // Draw rain — every column, every visible row
      for (let c = 0; c < rainCols.length; c++) {
        const col = rainCols[c];
        col.y += col.speed * dt * 0.14;

        if (col.y > numRows + col.trail) {
          col.y = -col.trail * Math.random();
          col.speed = 0.4 + Math.random() * 3.5;
        }

        const headRow = Math.floor(col.y);
        const x = c * CHAR_W;
        const rStart = Math.max(0, headRow - col.trail);
        const rEnd = Math.min(numRows, headRow);

        for (let r = rStart; r <= rEnd; r++) {
          const dist = headRow - r;

          // Randomize char occasionally
          if (Math.random() < 0.02) {
            col.chars[r % col.chars.length] = rndChar();
          }

          let alpha =
            dist === 0 ? 1.0 : Math.max(0, 1 - dist / col.trail);

          // Figure zone boost
          const boost = getBoost(c, r);

          if (boost > 0) {
            // Inside a figure — dramatically brighter, glowing
            alpha = Math.min(1.0, alpha * boost);

            if (dist === 0) {
              // Leading character: near-white
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            } else if (dist < 3) {
              ctx.fillStyle = `rgba(150, 255, 150, ${alpha})`;
            } else if (dist < 8) {
              ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
            } else {
              ctx.fillStyle = `rgba(0, 255, 65, ${alpha * 0.85})`;
            }
          } else {
            // Normal background rain — visible but not overpowering
            alpha *= 0.7;

            if (alpha < 0.01) continue;

            if (dist === 0) {
              ctx.fillStyle = `rgba(180, 255, 180, ${alpha})`;
            } else if (dist < 3) {
              ctx.fillStyle = `rgba(0, 255, 65, ${alpha * 0.9})`;
            } else {
              ctx.fillStyle = `rgba(0, 180, 40, ${alpha * 0.5})`;
            }
          }

          ctx.fillText(col.chars[r % col.chars.length], x, r * CHAR_H);
        }
      }

      // Figure glow halos — larger, brighter
      for (const z of zones) {
        const cx = (z.startCol + z.width / 2) * CHAR_W;
        const cy = (z.startRow + z.height / 2) * CHAR_H;
        const r = z.height * CHAR_H * 0.7;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, "rgba(0, 255, 65, 0.1)");
        grad.addColorStop(0.4, "rgba(0, 255, 65, 0.04)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // Figure labels — brighter
      ctx.font = '11px "Courier New", Consolas, monospace';
      ctx.textAlign = "center";

      const mz = zones[0];
      if (mz) {
        const lx = (mz.startCol + mz.width / 2) * CHAR_W;
        const ly = (mz.startRow + mz.height) * CHAR_H + 14;
        ctx.fillStyle = "rgba(0, 255, 65, 0.5)";
        ctx.fillText("MORPHEUS", lx, ly);
      }

      const sz = zones[1];
      if (sz) {
        const lx = (sz.startCol + sz.width / 2) * CHAR_W;
        const ly = (sz.startRow + sz.height) * CHAR_H + 14;
        ctx.fillStyle = "rgba(0, 255, 65, 0.5)";
        ctx.fillText("AGENT SMITH", lx, ly);
      }

      ctx.textAlign = "start";
      ctx.font = `${CHAR_SIZE}px "Courier New", Consolas, monospace`;

      // Subtle vignette — just a hint of depth, not hiding figures
      const vig = ctx.createRadialGradient(
        w / 2,
        h / 2,
        w * 0.3,
        w / 2,
        h / 2,
        w * 0.75
      );
      vig.addColorStop(0, "rgba(0, 0, 0, 0)");
      vig.addColorStop(1, "rgba(0, 0, 0, 0.35)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Subtle CRT scanlines
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="hero-canvas"
      className="absolute inset-0 w-full h-full"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
