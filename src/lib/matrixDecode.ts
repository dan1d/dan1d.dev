import { MATRIX_CHARS } from "@/lib/matrix";

// ─── Matrix decode ──────────────────────────────────────────────────────────
// Generative text: a string starts as a run of live glyphs and resolves into
// its real characters in a left-to-right wave. Spaces stay spaces and the
// final frame is byte-identical to the source, so readability is never
// traded for the effect. Works on the element's existing text node so React
// keeps ownership of it.

export interface DecodeOptions {
  /** total time for the wave, ms */
  duration?: number;
  /** wait before the wave starts (glyphs churn meanwhile), ms */
  delay?: number;
}

const glyph = () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

export function decodeText(el: HTMLElement, final: string, { duration = 800, delay = 0 }: DecodeOptions = {}): () => void {
  const node = el.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return () => {};
  const n = final.length;
  const chars = Array.from(final);
  const scrambled = chars.map((c) => (c === " " || c === "\n" ? c : glyph()));
  let raf = 0;
  let start = 0;
  let frame = 0;

  const tick = (now: number) => {
    if (!start) start = now + delay;
    const t = (now - start) / duration;
    frame++;
    if (t >= 1) { node.nodeValue = final; return; }
    // Re-roll the unresolved glyphs on every other frame so the churn is
    // lively but not strobing
    const reroll = frame % 2 === 0;
    let out = "";
    for (let i = 0; i < n; i++) {
      const c = chars[i];
      const resolved = t >= (i / n) * 0.8;
      if (resolved || c === " " || c === "\n") out += c;
      else { if (reroll) scrambled[i] = glyph(); out += scrambled[i]; }
    }
    node.nodeValue = out;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); node.nodeValue = final; };
}

/** True when the environment can and should animate (browser, motion allowed). */
export function canDecode(): boolean {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
