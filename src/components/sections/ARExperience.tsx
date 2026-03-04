"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
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
    description: "Point your phone camera at the code",
  },
  {
    number: "2",
    title: "Point at Surface",
    description: "Aim your camera at any flat surface",
  },
  {
    number: "3",
    title: "Explore in AR",
    description: "Walk around and interact with projects",
  },
];

export default function ARExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ctx: { revert: () => void } | null = null;

    const initAnimations = async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");

        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          // Left panel: slides in from left
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

          // Steps list: staggered fade-in
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

          // Right panel: slides in from right
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
        // GSAP not available in test/SSR — skip
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
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.03)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-4 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5">
            New
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Experience{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              in AR
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Point your phone at the QR code or tap the button to see my projects
            come alive in your space
          </p>
        </div>

        {/* Main card split layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: QR code + instructions */}
          <div ref={leftPanelRef} className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 lg:p-10 space-y-8">
            {/* Inner glow */}
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none"
              aria-hidden="true"
            />

            {/* QR code block */}
            <div className="relative flex flex-col items-center gap-4">
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 shadow-xl shadow-cyan-500/10">
                <QRCodeSVG
                  data-testid="ar-qr-code"
                  value={AR_URL}
                  size={180}
                  bgColor="#0a0a0a"
                  fgColor="#22d3ee"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-white/40 tracking-wide">
                Scan to open on your phone
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30 font-medium">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Launch AR button */}
            <div className="flex justify-center">
              <a
                href="/ar"
                data-testid="launch-ar-btn"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
              >
                {/* Button gradient background */}
                <span
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
                  aria-hidden="true"
                />
                {/* Animated shimmer */}
                <span
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  aria-hidden="true"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative w-5 h-5"
                  aria-hidden="true"
                >
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="relative">Launch AR</span>
              </a>
            </div>

            {/* Step-by-step instructions */}
            <ol ref={stepsRef} className="space-y-4" aria-label="How to use AR">
              {steps.map((step) => (
                <li key={step.number} className="flex items-start gap-4 group">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center text-sm font-bold text-cyan-400">
                    {step.number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      {step.title}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: 3D preview */}
          <div ref={rightPanelRef} className="relative h-80 lg:h-full min-h-[400px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            {/* Corner accents */}
            <div
              className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-sm"
              aria-hidden="true"
            />
            <div
              className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-sm"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-400/60 rounded-bl-sm"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400/60 rounded-br-sm"
              aria-hidden="true"
            />

            {/* Label */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
              <span className="text-xs text-white/40 tracking-widest uppercase font-mono">
                3D Preview
              </span>
            </div>

            {/* R3F Canvas */}
            <div className="absolute inset-0">
              <ARPreviewScene />
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
              <span className="text-xs text-cyan-400/60 tracking-wider font-mono">
                Powered by WebXR
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
