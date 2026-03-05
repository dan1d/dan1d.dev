"use client";

import { useEffect, useRef, useState } from "react";
import { smoothstep } from "@/lib/matrix";
import MatrixTextReveal from "./MatrixTextReveal";

// ─── Page Loader — just rain, no text ────────────────────────────────────────
// Rain builds up fast, holds briefly, then fades out revealing the corridor behind.

const RAIN_IN = 1200;
const FADE_OUT = 1300;
const TOTAL = RAIN_IN + FADE_OUT;

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let animId: number;

    const tick = () => {
      const e = Date.now() - startRef.current;
      setElapsed(e);
      if (e >= TOTAL) {
        setVisible(false);
        return;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Fallback timeout
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  const inFadeOut = elapsed > RAIN_IN;
  const fadeProgress = inFadeOut ? Math.min(1, (elapsed - RAIN_IN) / FADE_OUT) : 0;
  const rainInProgress = Math.min(1, elapsed / RAIN_IN);

  const rainIntensity = inFadeOut ? 1 - smoothstep(fadeProgress) : smoothstep(rainInProgress);
  const wrapperOpacity = inFadeOut ? 1 - smoothstep(fadeProgress) : 1;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] bg-black"
      style={{ opacity: wrapperOpacity }}
    >
      <MatrixTextReveal
        text=""
        phase="idle"
        progress={0}
        rainIntensity={rainIntensity}
        rainSpeedMultiplier={inFadeOut ? 1 : 2.8}
      />

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
