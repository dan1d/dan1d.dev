"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

// ─── Visibility hook — only mount WebGL when near viewport ───────────────────

function useCanvasVisibility(rootMargin = "200px") {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
import { QRCodeSVG } from "qrcode.react";

const ARPreviewScene = dynamic(
  () => import("@/components/three/ARPreviewScene"),
  { ssr: false }
);

const AR_URL = "https://dan1d.dev/ar";

const steps = [
  {
    number: "1",
    title: "Scan QR Code",
    description: "Open the 3D viewer on your phone",
  },
  {
    number: "2",
    title: "Choose a View",
    description: "Switch between Matrix Resume and GitHub Skyline",
  },
  {
    number: "3",
    title: "Explore in 3D",
    description: "Drag to orbit, scroll to zoom, hover for details",
  },
];

export default function ARExperience() {
  const { ref: sectionRef, visible: canvasVisible } = useCanvasVisibility("400px");
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);

  // ─── WebGL context-loss recovery ──────────────────────────────────────────
  const [canvasKey, setCanvasKey] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleCanvasCreated = useCallback(
    (state: { gl: { domElement: HTMLCanvasElement } }) => {
      cleanupRef.current?.();
      const canvas = state.gl.domElement;
      const onLost = (e: Event) => {
        e.preventDefault();
        setTimeout(() => setCanvasKey((k) => k + 1), 100);
      };
      canvas.addEventListener("webglcontextlost", onLost);
      cleanupRef.current = () => canvas.removeEventListener("webglcontextlost", onLost);
    },
    []
  );

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ctx: { revert: () => void } | null = null;

    const initAnimations = async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");

        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          if (leftPanelRef.current) {
            gsap.fromTo(
              leftPanelRef.current,
              { opacity: 0, x: -60 },
              {
                opacity: 1,
                x: 0,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: leftPanelRef.current,
                  start: "top 80%",
                  once: true,
                },
              }
            );
          }

          if (stepsRef.current) {
            const stepItems = stepsRef.current.querySelectorAll("li");
            if (stepItems.length > 0) {
              gsap.fromTo(
                stepItems,
                { opacity: 0, x: -30 },
                {
                  opacity: 1,
                  x: 0,
                  duration: 0.8,
                  stagger: 0.15,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: stepsRef.current,
                    start: "top 80%",
                    once: true,
                  },
                }
              );
            }
          }

          if (rightPanelRef.current) {
            gsap.fromTo(
              rightPanelRef.current,
              { opacity: 0, x: 60 },
              {
                opacity: 1,
                x: 0,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: rightPanelRef.current,
                  start: "top 80%",
                  once: true,
                },
              }
            );
          }
        }, sectionRef);
      } catch {
        // GSAP not available in test/SSR
      }
    };

    initAnimations();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <section
      id="ar"
      ref={sectionRef}
      className="relative min-h-screen bg-black overflow-hidden flex items-center py-24"
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.08) 2px, rgba(0,255,65,0.08) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-mono">
        {/* Section header — terminal style */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px flex-1 bg-green-400/20" />
            <span className="text-green-400/30 text-[10px] tracking-widest">
              // IMMERSIVE
            </span>
            <span className="h-px flex-1 bg-green-400/20" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
            style={{ color: "#39ff14", textShadow: "0 0 10px #39ff14" }}
          >
            3D Experience
          </h2>
          <p className="text-sm text-green-400/50 max-w-2xl leading-relaxed">
            &ldquo;
            <span className="text-green-300/70">Free your mind.</span>
            &rdquo;
            <span className="text-green-400/30 ml-2">— Morpheus</span>
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Left: QR + instructions */}
          <div ref={leftPanelRef} className="space-y-5">
            {/* QR code card */}
            <div className="relative border border-green-400/20 bg-black p-6 space-y-5">
              {/* Corner brackets */}
              <div
                className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-green-400/40"
                aria-hidden="true"
              />
              <div
                className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-green-400/40"
                aria-hidden="true"
              />

              <p className="text-[10px] text-green-400/40 tracking-widest uppercase">
                // SCAN_TARGET
              </p>

              {/* QR code */}
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 border border-green-400/20 bg-black">
                  <QRCodeSVG
                    data-testid="ar-qr-code"
                    value={AR_URL}
                    size={180}
                    bgColor="#000000"
                    fgColor="#00ff41"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[11px] text-green-400/40 tracking-wide">
                  Scan to open on your phone
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-green-400/15" />
                <span className="text-[10px] text-green-400/30 tracking-widest">
                  OR
                </span>
                <div className="flex-1 h-px bg-green-400/15" />
              </div>

              {/* Launch AR button */}
              <div className="flex justify-center">
                <a
                  href="/ar"
                  data-testid="launch-ar-btn"
                  className="inline-flex items-center gap-3 px-6 py-3 text-sm tracking-widest border border-green-400/50 text-green-400 hover:border-green-400 hover:bg-green-400/10 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span aria-hidden="true">[</span>
                  LAUNCH_3D
                  <span aria-hidden="true">]</span>
                </a>
              </div>
            </div>

            {/* Steps card */}
            <div className="relative border border-green-400/20 bg-black p-6">
              <div
                className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-green-400/40"
                aria-hidden="true"
              />
              <div
                className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-green-400/40"
                aria-hidden="true"
              />

              <p className="text-[10px] text-green-400/40 tracking-widest uppercase mb-4">
                // INSTRUCTIONS
              </p>

              <ol
                ref={stepsRef}
                className="space-y-4"
                aria-label="How to use 3D viewer"
              >
                {steps.map((step) => (
                  <li key={step.number} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-7 h-7 border border-green-400/30 bg-black flex items-center justify-center text-xs font-bold text-green-400">
                      {step.number}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-green-300">
                        {step.title}
                      </p>
                      <p className="text-[11px] text-green-400/40 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: 3D preview */}
          <div
            ref={rightPanelRef}
            className="relative h-80 lg:h-full min-h-[400px] border border-green-400/20 bg-black overflow-hidden"
          >
            {/* Corner brackets */}
            <div
              className="absolute top-2 left-2 w-3 h-3 border-t border-l border-green-400/40 z-10"
              aria-hidden="true"
            />
            <div
              className="absolute top-2 right-2 w-3 h-3 border-t border-r border-green-400/40 z-10"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-green-400/30 z-10"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-green-400/30 z-10"
              aria-hidden="true"
            />

            {/* Top label */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="text-[10px] text-green-400/40 tracking-widest uppercase">
                // 3D_PREVIEW
              </span>
            </div>

            {/* R3F Canvas — only mounts when section is near viewport */}
            <div className="absolute inset-0">
              {canvasVisible ? <ARPreviewScene key={canvasKey} onCreated={handleCanvasCreated} /> : <div className="w-full h-full bg-black" />}
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <span className="text-[10px] text-green-400/50 tracking-wider">
                Powered by Three.js
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
