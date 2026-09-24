"use client";

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";
import { decodeText, canDecode } from "@/lib/matrixDecode";

// ─── DecodeText ─────────────────────────────────────────────────────────────
// Renders `text` in any tag and, the first time it scrolls into view, plays
// the Matrix decode wave over it. Server render and tests see the plain
// final text; only a browser with motion enabled ever sees the glyphs.

export interface DecodeTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  duration?: number;
  delay?: number;
  "data-testid"?: string;
}

export default function DecodeText({ text, as = "span", className, style, duration, delay, ...rest }: DecodeTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Any intrinsic tag works here; typed as span so the ref and props line up
  const Tag = as as "span";

  useEffect(() => {
    const el = ref.current;
    if (!el || !canDecode() || el.dataset.decoded) return;
    let cancel: (() => void) | null = null;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      el.dataset.decoded = "1";
      cancel = decodeText(el, text, { duration, delay });
    }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => { io.disconnect(); cancel?.(); };
  }, [text, duration, delay]);

  return <Tag ref={ref} className={className} style={style} {...rest}>{text}</Tag>;
}
