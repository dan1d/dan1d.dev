"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ─── Resume data to decode ──────────────────────────────────────────────────

const RESUME_LINES = [
  "",
  "> IDENTITY_DECODE",
  "",
  "  SUBJECT ........ Daniel Alejandro Dominguez Diaz",
  "  HANDLE ......... @dan1d",
  "  ROLE ........... Senior Full-Stack Engineer",
  "  EXPERIENCE ..... 12+ years",
  "  CLEARANCE ...... LEVEL_4",
  "",
  "> SKILL_MATRIX",
  "",
  "  [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588] TypeScript    [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591] Ruby",
  "  [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591] React/Next.js [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591] Rails",
  "  [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591] Node.js       [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591] Python",
  "  [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591] PostgreSQL    [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591] AWS",
  "  [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591] GraphQL       [\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591] Docker",
  "",
  "> MISSION_LOG",
  "",
  "  2024-NOW ... BioBridge / Senior Full-Stack Engineer",
  "               \u2514\u2500 Cardiac remote monitoring platform for clinicians",
  "  2021-2024 .. Acima Credit / Senior Full-Stack Engineer",
  "               \u2514\u2500 Scaled platform serving 30M+ users",
  "  2019-2021 .. 2U / Senior Software Engineer",
  "               \u2514\u2500 Built ed-tech platform reaching 100K+ students",
  "",
  "> ACTIVE_PROJECTS",
  "",
  "  CodePrism .... AI Knowledge Graph for Engineering Teams",
  "  VulnSentry ... Ruby CVE Auto-PR Bot",
  "  Status ....... OPERATIONAL",
  "",
  "> NEURAL_LINK: ACTIVE \u25C9",
];

// ─── Character sets ─────────────────────────────────────────────────────────

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
const RAIN_CHARS = LATIN;

function randomRainChar(): string {
  return RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatrixResumeSceneProps {
  autoPlay?: boolean;
  decodeDelay?: number;
  className?: string;
}

interface RainColumn {
  y: number; // current head position (in px)
  speed: number; // px per frame
  chars: string[]; // current characters in the column
  brightness: number[]; // brightness per row position
  trailLength: number;
}

interface DecodedChar {
  char: string;
  col: number; // column in grid
  row: number; // row in grid
  x: number; // pixel x
  y: number; // pixel y
  decoded: boolean; // whether it has resolved
  decodeTime: number; // timestamp when it should decode
  scrambleChar: string; // current displayed char while scrambling
  scrambleCount: number; // how many scramble cycles left
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MatrixResumeScene({
  autoPlay = true,
  decodeDelay = 2000,
  className = "",
}: MatrixResumeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeComplete, setDecodeComplete] = useState(false);
  const stateRef = useRef<{
    rainColumns: RainColumn[];
    decodedChars: DecodedChar[];
    phase: "rain" | "decode" | "stable";
    decodeStartTime: number;
    width: number;
    height: number;
    charW: number;
    charH: number;
    gridCols: number;
    gridRows: number;
    textStartX: number;
    textStartY: number;
  } | null>(null);

  // Trigger decode externally
  const triggerDecode = useCallback(() => {
    if (stateRef.current && stateRef.current.phase === "rain") {
      stateRef.current.phase = "decode";
      stateRef.current.decodeStartTime = performance.now();
      setIsDecoding(true);
    }
  }, []);

  // Expose trigger for parent
  useEffect(() => {
    if (autoPlay) {
      const timeout = setTimeout(triggerDecode, decodeDelay);
      return () => clearTimeout(timeout);
    }
  }, [autoPlay, decodeDelay, triggerDecode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ─── Setup dimensions ─────────────────────────────────────────────
    const CHAR_SIZE = 14;
    const LINE_HEIGHT = 18;
    const FONT = `${CHAR_SIZE}px "Courier New", Consolas, monospace`;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = container!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const charW = CHAR_SIZE * 0.6; // monospace approximate width
      const charH = LINE_HEIGHT;
      const gridCols = Math.floor(w / charW);
      const gridRows = Math.floor(h / charH);

      // Calculate text positioning (centered horizontally, near top vertically)
      const maxLineLength = Math.max(...RESUME_LINES.map((l) => l.length));
      const textBlockWidth = maxLineLength * charW;
      const textBlockHeight = RESUME_LINES.length * charH;
      const textStartX = Math.max(20, (w - textBlockWidth) / 2);
      const textStartY = Math.max(30, (h - textBlockHeight) / 2);

      // Build decoded chars map
      const decodedChars: DecodedChar[] = [];
      const baseDecodeDelay = 0; // relative to decode start
      const decodeSpread = 6000; // total ms for all chars to decode

      for (let row = 0; row < RESUME_LINES.length; row++) {
        const line = RESUME_LINES[row];
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          if (ch === " ") continue; // skip spaces - they're just empty

          // Decode time: top-to-bottom, left-to-right with some randomness
          const progress =
            (row / RESUME_LINES.length) * 0.7 +
            (col / maxLineLength) * 0.3;
          const decodeTime =
            baseDecodeDelay + progress * decodeSpread + Math.random() * 400;

          decodedChars.push({
            char: ch,
            col,
            row,
            x: textStartX + col * charW,
            y: textStartY + row * charH,
            decoded: false,
            decodeTime,
            scrambleChar: randomRainChar(),
            scrambleCount: Math.floor(5 + Math.random() * 15),
          });
        }
      }

      // Build rain columns
      const rainColumns: RainColumn[] = [];
      for (let c = 0; c < gridCols; c++) {
        const trailLength = 5 + Math.floor(Math.random() * 20);
        const chars: string[] = [];
        const brightness: number[] = [];
        for (let r = 0; r < gridRows; r++) {
          chars.push(randomRainChar());
          brightness.push(0);
        }
        rainColumns.push({
          y: Math.random() * h,
          speed: 1 + Math.random() * 4,
          chars,
          brightness,
          trailLength,
        });
      }

      stateRef.current = {
        rainColumns,
        decodedChars,
        phase: stateRef.current?.phase || "rain",
        decodeStartTime: stateRef.current?.decodeStartTime || 0,
        width: w,
        height: h,
        charW,
        charH,
        gridCols,
        gridRows,
        textStartX,
        textStartY,
      };
    }

    resize();
    window.addEventListener("resize", resize);

    // ─── Animation loop ─────────────────────────────────────────────────
    startTimeRef.current = performance.now();

    function animate() {
      const state = stateRef.current;
      if (!state || !ctx || !canvas) return;

      const now = performance.now();
      const { width: w, height: h, charW, charH, gridCols, gridRows } = state;
      const isDecodePhase =
        state.phase === "decode" || state.phase === "stable";
      const decodeElapsed = isDecodePhase
        ? now - state.decodeStartTime
        : 0;

      // ── Clear ──
      ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = FONT;
      ctx.textBaseline = "top";

      // ── Rain columns ──
      const rainDimFactor = isDecodePhase
        ? Math.max(0.15, 1 - decodeElapsed / 8000)
        : 1;
      const rainSpeedFactor = isDecodePhase
        ? Math.max(0.3, 1 - decodeElapsed / 6000)
        : 1;

      for (let c = 0; c < state.rainColumns.length; c++) {
        const col = state.rainColumns[c];
        col.y += col.speed * rainSpeedFactor;

        if (col.y > h + col.trailLength * charH) {
          col.y = -col.trailLength * charH;
          col.speed = 1 + Math.random() * 4;
        }

        const headRow = Math.floor(col.y / charH);
        const x = c * charW;

        for (let r = 0; r < gridRows; r++) {
          const dist = headRow - r;
          if (dist < 0 || dist > col.trailLength) continue;

          // Randomize char occasionally
          if (Math.random() < 0.03) {
            col.chars[r] = randomRainChar();
          }

          const brightness = dist === 0 ? 1.0 : Math.max(0, 1 - dist / col.trailLength);
          const alpha = brightness * rainDimFactor;

          if (alpha < 0.02) continue;

          if (dist === 0) {
            ctx.fillStyle = `rgba(185, 255, 185, ${alpha})`;
          } else if (dist < 3) {
            ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(0, 255, 65, ${alpha * 0.7})`;
          }

          ctx.fillText(col.chars[r], x, r * charH);
        }
      }

      // ── Decoded text ──
      if (isDecodePhase) {
        let allDecoded = true;

        for (const dc of state.decodedChars) {
          if (dc.decoded) {
            // Draw final character with glow
            const glowPulse =
              0.85 + 0.15 * Math.sin(now * 0.003 + dc.col * 0.1 + dc.row * 0.2);

            // Glow layer
            ctx.fillStyle = `rgba(0, 255, 65, ${0.15 * glowPulse})`;
            ctx.fillText(dc.char, dc.x - 0.5, dc.y - 0.5);
            ctx.fillText(dc.char, dc.x + 0.5, dc.y + 0.5);

            // Check if this is a header line (starts with >)
            const line = RESUME_LINES[dc.row];
            const isHeader = line.trimStart().startsWith(">");
            const isBar = dc.char === "\u2588" || dc.char === "\u2591";

            if (isHeader) {
              ctx.fillStyle = `rgba(57, 255, 20, ${glowPulse})`;
            } else if (isBar) {
              ctx.fillStyle =
                dc.char === "\u2588"
                  ? `rgba(0, 255, 65, ${0.8 * glowPulse})`
                  : `rgba(0, 51, 0, ${0.6 * glowPulse})`;
            } else {
              ctx.fillStyle = `rgba(0, 255, 65, ${0.9 * glowPulse})`;
            }

            ctx.fillText(dc.char, dc.x, dc.y);
          } else if (decodeElapsed >= dc.decodeTime) {
            // In scramble phase
            if (dc.scrambleCount > 0) {
              dc.scrambleCount--;
              dc.scrambleChar = randomRainChar();

              // Draw scrambling character
              const scrambleAlpha =
                0.5 + 0.5 * (1 - dc.scrambleCount / 20);
              ctx.fillStyle = `rgba(57, 255, 20, ${scrambleAlpha})`;
              ctx.fillText(dc.scrambleChar, dc.x, dc.y);
              allDecoded = false;
            } else {
              dc.decoded = true;

              // Flash effect on decode
              ctx.fillStyle = "rgba(185, 255, 185, 1)";
              ctx.fillText(dc.char, dc.x, dc.y);
            }
          } else {
            allDecoded = false;
          }
        }

        // Check if all characters are decoded
        if (allDecoded && state.phase === "decode") {
          state.phase = "stable";
          setDecodeComplete(true);
        }

        // ── Scan line effect ──
        const scanY = (now * 0.05) % h;
        ctx.fillStyle = "rgba(0, 255, 65, 0.03)";
        ctx.fillRect(0, scanY - 2, w, 4);

        // Additional subtle horizontal scan lines
        for (let y = 0; y < h; y += 4) {
          ctx.fillStyle = "rgba(0, 255, 65, 0.008)";
          ctx.fillRect(0, y, w, 1);
        }
      }

      // ── Vignette ──
      const gradient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        w * 0.25,
        w / 2,
        h / 2,
        w * 0.7
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />
      {/* Expose decode trigger for parent to call */}
      {!autoPlay && !isDecoding && (
        <button
          type="button"
          onClick={triggerDecode}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-6 py-2 border border-green-400/60 bg-black/80 font-mono text-xs text-green-400 tracking-widest hover:border-green-400 hover:bg-green-400/10 transition-all duration-200"
          style={{ textShadow: "0 0 6px #00ff41" }}
        >
          [ DECODE ]
        </button>
      )}
    </div>
  );
}
