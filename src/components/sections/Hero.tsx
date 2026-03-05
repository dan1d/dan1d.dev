"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { siteConfig } from "@/data/projects";

const MatrixCorridorScene = dynamic(
  () => import("@/components/three/MatrixCorridorScene"),
  {
    ssr: false,
    loading: () => (
      <div data-testid="hero-canvas" className="absolute inset-0 bg-black" />
    ),
  }
);

export default function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(false);

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  // Fade in the corridor after the PageLoader intro finishes
  // Total PageLoader duration: rain_in(1200) + text_form(1800) + text_hold(1000) + rain_close(800) = 4800ms
  // Start fading in corridor just as rain_close ends / fade_out begins
  useEffect(() => {
    const timer = setTimeout(() => setSceneVisible(true), 4600);
    return () => clearTimeout(timer);
  }, []);

  // Reveal UI elements after cinematic intro completes
  useEffect(() => {
    if (!introComplete) return;

    let ctx: { revert: () => void } | null = null;

    const animate = async () => {
      try {
        const { default: gsap } = await import("gsap");

        ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          // Darken corridor for text readability
          if (overlayRef.current) {
            tl.to(overlayRef.current, { opacity: 1, duration: 1.0 }, 0);
          }

          tl.fromTo(
            headingRef.current,
            { opacity: 0, y: 50, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 1.2 },
            0.3
          )
            .fromTo(
              subtitleRef.current,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.8 },
              0.8
            )
            .fromTo(
              descRef.current,
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.8 },
              1.1
            )
            .fromTo(
              ctaRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.7 },
              1.4
            );
        });
      } catch {
        // GSAP not available — just show everything
        [headingRef, subtitleRef, descRef, ctaRef].forEach((ref) => {
          if (ref.current) ref.current.style.opacity = "1";
        });
        if (overlayRef.current) overlayRef.current.style.opacity = "1";
      }
    };

    animate();

    return () => {
      ctx?.revert();
    };
  }, [introComplete]);

  // Parallax scroll effect (after intro)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ctx: { revert: () => void } | null = null;

    const initParallax = async () => {
      try {
        const { default: gsapModule } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");

        gsapModule.registerPlugin(ScrollTrigger);

        ctx = gsapModule.context(() => {
          if (!canvasWrapperRef.current) return;

          gsapModule.to(canvasWrapperRef.current, {
            yPercent: -20,
            ease: "none",
            scrollTrigger: {
              trigger: "#hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      } catch {
        // GSAP not available in test/SSR
      }
    };

    initParallax();

    return () => {
      ctx?.revert();
    };
  }, []);

  // Fallback: force intro complete after 12s
  useEffect(() => {
    const timeout = setTimeout(() => setIntroComplete(true), 12000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* 3D Matrix corridor — fills entire hero */}
      <div ref={canvasWrapperRef} className="absolute inset-0">
        <MatrixCorridorScene onIntroComplete={handleIntroComplete} started={sceneVisible} />
      </div>

      {/* Fade-in from black (covers the first moment while WebGL initializes) */}
      <div
        className={`absolute inset-0 bg-black pointer-events-none z-20 transition-opacity duration-[800ms] ease-out ${
          sceneVisible ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      />

      {/* Darkening overlay for text readability (animated by GSAP on intro complete) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none z-[5] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.75) 100%)",
        }}
        aria-hidden="true"
      />

      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-[6]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Hero content — always in DOM (for tests), animated visible after intro */}
      <div className="absolute inset-0 z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* dan1d — upper area, clear of the coder */}
        <h1
          ref={headingRef}
          className="text-8xl md:text-[10rem] font-black tracking-tighter leading-none opacity-0 font-mono mt-[15vh] md:mt-[12vh]"
          style={{
            color: "#00ff41",
            textShadow:
              "0 0 20px #00ff41, 0 0 60px #00ff4160, 0 0 120px #00ff4130",
          }}
        >
          {siteConfig.handle}
        </h1>

        {/* Subtitle, description, buttons — pushed to bottom 20% */}
        <div className="mt-auto mb-[10vh] md:mb-[8vh] flex flex-col items-center">
          <p
            ref={subtitleRef}
            className="text-xl md:text-2xl font-mono tracking-wider mb-4 opacity-0"
            style={{ color: "#39ff14", textShadow: "0 0 8px #39ff14" }}
          >
            {siteConfig.title}
          </p>

          <p
            ref={descRef}
            className="text-sm md:text-base font-mono text-green-400/60 max-w-xl leading-relaxed mb-10 opacity-0"
          >
            {siteConfig.description}
          </p>

          {/* CTA buttons */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-4 opacity-0"
          >
          <a
            href="#projects"
            aria-label="View Projects"
            className="inline-flex items-center justify-center px-8 py-3.5 font-mono text-sm tracking-widest border border-green-400/60 text-green-400 hover:border-green-400 hover:bg-green-400/10 hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all duration-300"
          >
            <span className="text-green-400/50 mr-1" aria-hidden="true">
              [
            </span>
            VIEW_PROJECTS
            <span className="text-green-400/50 ml-1" aria-hidden="true">
              ]
            </span>
          </a>

          <a
            href="#ar"
            aria-label="Try AR Experience"
            className="inline-flex items-center justify-center px-8 py-3.5 font-mono text-sm tracking-widest border border-green-400/30 text-green-400/70 hover:border-green-400/60 hover:text-green-400 hover:bg-green-400/5 transition-all duration-300"
          >
            <span className="text-green-400/30 mr-1" aria-hidden="true">
              [
            </span>
            ENTER_THE_MATRIX
            <span className="text-green-400/30 ml-1" aria-hidden="true">
              ]
            </span>
          </a>
        </div>
        </div>
      </div>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-[7]" />

      {/* CRT frame corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-green-400/40 pointer-events-none z-[6]" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-green-400/40 pointer-events-none z-[6]" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-green-400/30 pointer-events-none z-[6]" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-green-400/30 pointer-events-none z-[6]" />
    </section>
  );
}
