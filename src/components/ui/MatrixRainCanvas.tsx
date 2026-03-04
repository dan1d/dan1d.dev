"use client";

import { useEffect, useRef } from "react";
import {
  MATRIX_CHARS,
  type RainColumn,
  createRainColumns,
  buildFontSizes,
  pickFontSize,
  drawRainChar,
  randomMatrixChar,
} from "@/lib/matrix";

// Re-export for backward compat
export { MATRIX_CHARS, randomMatrixChar };

// ─── Reusable Matrix Rain Canvas ────────────────────────────────────────────

export interface MatrixRainCanvasProps {
  /** Overall brightness multiplier 0–1 (default 1) */
  intensity?: number;
  /** Base font size for columns (default 16) */
  fontSize?: number;
  /** Trail length factor — higher = longer trails (default 1) */
  trailFactor?: number;
  /** Speed multiplier (default 1) */
  speedMultiplier?: number;
  /** Use glow (shadowBlur) on characters (default false) */
  glow?: boolean;
  /** Extra CSS className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
  /** Ref to allow parent to read intensity changes dynamically */
  intensityRef?: React.MutableRefObject<number>;
}

export default function MatrixRainCanvas({
  intensity = 1,
  fontSize = 16,
  trailFactor = 1,
  speedMultiplier = 1,
  glow = false,
  className = "",
  style,
  intensityRef: externalIntensityRef,
}: MatrixRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalIntensityRef = useRef(intensity);

  useEffect(() => {
    internalIntensityRef.current = intensity;
    if (externalIntensityRef) externalIntensityRef.current = intensity;
  }, [intensity, externalIntensityRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;
    let columns: RainColumn[] = [];
    const fontSizes = buildFontSizes(fontSize);

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      columns = createRainColumns(Math.floor(w / fontSize), h, fontSize, columns);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const inten = externalIntensityRef?.current ?? internalIntensityRef.current;

      const fadeAlpha = (0.04 / trailFactor) + (1 - inten) * 0.06;
      ctx!.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx!.fillRect(0, 0, w, h);

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = i * fontSize;
        const y = col.y * fontSize;

        drawRainChar({
          ctx: ctx!,
          char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
          x,
          y,
          fontSize: pickFontSize(fontSizes),
          intensity: inten,
          glow,
        });

        if (y > h && Math.random() > 0.97) {
          col.y = Math.random() * -10;
          col.speed = 0.4 + Math.random() * 0.8;
        }
        col.y += col.speed * (0.5 + inten * 0.7) * speedMultiplier;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [fontSize, trailFactor, speedMultiplier, glow, externalIntensityRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={style}
    />
  );
}
