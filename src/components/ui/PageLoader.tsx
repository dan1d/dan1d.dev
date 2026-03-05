"use client";

import { useEffect, useRef, useState } from "react";
import { smoothstep } from "@/lib/matrix";
import MatrixTextReveal, { type RevealPhase } from "./MatrixTextReveal";

// ─── Phases ─────────────────────────────────────────────────────────────────
type Phase = "rain_in" | "text_form" | "text_hold" | "rain_close" | "fade_out";

const PHASE_DURATIONS: Record<Phase, number> = {
  rain_in: 1200,
  text_form: 1800,
  text_hold: 1000,
  rain_close: 800,
  fade_out: 1000,
};

const PHASE_ORDER: Phase[] = ["rain_in", "text_form", "text_hold", "rain_close", "fade_out"];

// ─── Map internal phases → MatrixTextReveal props ───────────────────────────

function mapPhase(phase: Phase, progress: number): {
  revealPhase: RevealPhase;
  revealProgress: number;
  rainIntensity: number;
  rainSpeedMultiplier: number;
} {
  switch (phase) {
    case "rain_in":
      return {
        revealPhase: "idle",
        revealProgress: 0,
        rainIntensity: smoothstep(progress),
        rainSpeedMultiplier: 2.8,
      };
    case "text_form":
      return {
        revealPhase: "revealing",
        revealProgress: progress,
        rainIntensity: 1,
        rainSpeedMultiplier: 1,
      };
    case "text_hold":
      return {
        revealPhase: "holding",
        revealProgress: 1,
        rainIntensity: 1,
        rainSpeedMultiplier: 1,
      };
    case "rain_close":
      return {
        revealPhase: "dissolving",
        revealProgress: progress,
        rainIntensity: 1,
        rainSpeedMultiplier: 1,
      };
    case "fade_out":
      return {
        revealPhase: "done",
        revealProgress: 1,
        rainIntensity: 1 - smoothstep(progress),
        rainSpeedMultiplier: 1,
      };
  }
}

// ─── Page Loader ────────────────────────────────────────────────────────────

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("rain_in");
  const [progress, setProgress] = useState(0);
  const phaseStartRef = useRef(Date.now());
  const phaseRef = useRef<Phase>("rain_in");

  useEffect(() => {
    let animId: number;

    const tick = () => {
      const elapsed = Date.now() - phaseStartRef.current;
      const duration = PHASE_DURATIONS[phaseRef.current];
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p >= 1) {
        const idx = PHASE_ORDER.indexOf(phaseRef.current);
        if (idx < PHASE_ORDER.length - 1) {
          phaseRef.current = PHASE_ORDER[idx + 1];
          setPhase(PHASE_ORDER[idx + 1]);
          phaseStartRef.current = Date.now();
        } else {
          setVisible(false);
          return;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Fallback timeout
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  const isFadingOut = phase === "fade_out";
  const smoothFade = isFadingOut ? 1 - smoothstep(progress) : 1;
  const mapped = mapPhase(phase, progress);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] bg-black"
      style={{ opacity: smoothFade }}
    >
      <MatrixTextReveal
        text="Wake up, dan1d..."
        phase={mapped.revealPhase}
        progress={mapped.revealProgress}
        revealDirection="ltr"
        dissolveDirection="rtl"
        rainIntensity={mapped.rainIntensity}
        rainSpeedMultiplier={mapped.rainSpeedMultiplier}
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
