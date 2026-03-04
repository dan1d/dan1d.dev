"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { siteConfig } from "@/data/projects";

// Dynamically import the 3D scene to avoid SSR issues
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <div data-testid="hero-canvas" className="absolute inset-0" />,
});

export default function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Entrance animation (already present)
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      headingRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9 }
    )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.5"
      )
      .fromTo(
        descRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.4"
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.3"
      );
  }, []);

  // Parallax effect: 3D canvas scrolls at 40% of scroll speed
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
        // GSAP not available in test/SSR — skip
      }
    };

    initParallax();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* 3D background scene — wrapped for parallax */}
      <div ref={canvasWrapperRef} className="absolute inset-0">
        <HeroScene />
      </div>

      {/* Dark gradient overlay so text remains readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Main heading */}
        <h1
          ref={headingRef}
          className="text-8xl md:text-[10rem] font-black tracking-tighter leading-none mb-4 opacity-0"
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 60%, #06b6d4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {siteConfig.handle}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-2xl md:text-3xl font-semibold text-slate-200 tracking-wide mb-4 opacity-0"
        >
          {siteConfig.title}
        </p>

        {/* Description */}
        <p
          ref={descRef}
          className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed mb-10 opacity-0"
        >
          {siteConfig.description}
        </p>

        {/* CTA buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 opacity-0">
          {/* Primary CTA */}
          <a
            href="#projects"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide text-black bg-cyan-400 hover:bg-cyan-300 transition-colors duration-200 shadow-lg shadow-cyan-500/30"
          >
            View Projects
          </a>

          {/* Secondary CTA */}
          <a
            href="#ar"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide text-cyan-400 border border-cyan-400/60 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all duration-200"
          >
            Try AR Experience
          </a>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
