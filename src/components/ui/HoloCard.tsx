"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type PointerEvent } from "react";
import GlyphVeil from "./GlyphVeil";
import { canDecode } from "@/lib/matrixDecode";

// ─── HoloCard ───────────────────────────────────────────────────────────────
// The construct every project card is built on: it materialises out of a
// glyph veil the first time it scrolls into view, tilts in 3D toward the
// pointer with a glare that follows the hand, and carries a scanner line
// along its top edge. All hover work is CSS custom properties on the element,
// so React never re-renders on pointer move.

export default function HoloCard({ children, className = "", ...rest }: ComponentPropsWithoutRef<"article">) {
  const ref = useRef<HTMLElement>(null);
  const [veil, setVeil] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canDecode()) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      setVeil(true);
    }, { rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--go", "1");
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--go", "0");
  };

  return (
    <article ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`holo-card ${className}`} {...rest}>
      {children}
      <span className="holo-glare" aria-hidden="true" />
      <span className="holo-scan" aria-hidden="true" />
      {veil && <GlyphVeil duration={1150} onDone={() => setVeil(false)} />}
    </article>
  );
}
