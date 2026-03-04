"use client";

import { useEffect, useRef, useState } from "react";

export default function PageLoader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let tl: { kill: () => void } | null = null;

    const init = async () => {
      try {
        const { default: gsap } = await import("gsap");

        const overlay = overlayRef.current;
        const text = textRef.current;
        if (!overlay || !text) return;

        tl = gsap.timeline({
          onComplete: () => {
            setVisible(false);
          },
        }) as unknown as { kill: () => void };

        // Cast to use gsap.timeline API
        const timeline = tl as unknown as ReturnType<typeof gsap.timeline>;

        // Text entrance
        timeline
          .fromTo(
            text,
            { opacity: 0, y: 20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
          )
          // Hold for a moment
          .to(text, { opacity: 1, duration: 0.6 })
          // Fade out the overlay
          .to(overlay, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
          });
      } catch {
        // Fallback: use CSS animation timeout
        const timeout = setTimeout(() => {
          const overlay = overlayRef.current;
          if (overlay) {
            overlay.style.opacity = "0";
            overlay.style.transition = "opacity 0.5s ease";
            setTimeout(() => setVisible(false), 500);
          }
        }, 1500);
        return () => clearTimeout(timeout);
      }
    };

    init();

    return () => {
      if (tl) {
        (tl as unknown as ReturnType<typeof gsap.timeline>).kill();
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      style={{
        // CSS fallback animation in case GSAP hasn't loaded
        animation: "pageLoaderFade 1.8s ease forwards",
      }}
    >
      <span
        ref={textRef}
        className="text-6xl md:text-8xl font-black tracking-tighter select-none"
        style={{
          background:
            "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 60%, #06b6d4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          // Start hidden — GSAP animates it in. CSS fallback shows it.
          opacity: 0,
          animation: "pageLoaderText 0.6s 0.1s ease forwards",
        }}
      >
        dan1d
      </span>

      {/* CSS keyframe fallbacks */}
      <style>{`
        @keyframes pageLoaderFade {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes pageLoaderText {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
