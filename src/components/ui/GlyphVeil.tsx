"use client";

import { useEffect, useRef } from "react";
import { MATRIX_CHARS } from "@/lib/matrix";

// ─── GlyphVeil ──────────────────────────────────────────────────────────────
// A canvas that covers its parent with a solid field of glyph cells and then
// dissolves, cell by cell in a shuffled order, to reveal what is underneath.
// Used once per card as it scrolls into view; unmounted when done.

export default function GlyphVeil({ duration = 900, onDone }: { duration?: number; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth, h = parent.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CELL = 13;
    const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
    // Shuffled cell order with a bias so the dissolve sweeps roughly top-down
    const order = Array.from({ length: cols * rows }, (_, i) => i)
      .map((i) => ({ i, k: Math.random() * 0.75 + (Math.floor(i / cols) / rows) * 0.25 }))
      .sort((a, b) => a.k - b.k)
      .map((o) => o.i);
    const glyphs = order.map(() => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
    ctx.font = `bold ${CELL - 2}px "Courier New", Consolas, monospace`;
    ctx.textBaseline = "top";

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      ctx.clearRect(0, 0, w, h);
      const firstAlive = Math.floor(p * order.length);
      for (let k = firstAlive; k < order.length; k++) {
        const i = order[k];
        const x = (i % cols) * CELL, y = Math.floor(i / cols) * CELL;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, CELL, CELL);
        // Cells about to dissolve burn white; the rest sit in dim green
        const edge = (k - firstAlive) / order.length;
        ctx.fillStyle = edge < 0.03 ? "rgba(220,255,230,0.95)" : `rgba(0,255,65,${0.25 + Math.random() * 0.3})`;
        if (Math.random() < 0.08) glyphs[k] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillText(glyphs[k], x + 1, y + 1);
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else done.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 z-[3] pointer-events-none" />;
}
