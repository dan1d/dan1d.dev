"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { SkylineCell } from "@/components/three/SkylineScene";

// ─── Dynamic import (no SSR) ─────────────────────────────────────────────────

const SkylineScene = dynamic(
  () => import("@/components/three/SkylineScene"),
  { ssr: false }
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface SkylineApiResponse {
  username: string;
  year: number;
  totalContributions: number;
  contributions: SkylineCell[];
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function SkylineSkeleton() {
  return (
    <div
      data-testid="skyline-loading"
      className="w-full h-full flex flex-col items-center justify-center gap-6"
      aria-label="Loading GitHub skyline"
    >
      {/* Pulsing grid placeholder */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(52, 1fr)` }}>
        {Array.from({ length: 52 * 7 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-sm bg-white/10 animate-pulse"
            style={{ animationDelay: `${(i % 52) * 20}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-white/30 font-mono tracking-widest uppercase animate-pulse">
        Loading skyline…
      </p>
    </div>
  );
}

// ─── GitHubSkyline ────────────────────────────────────────────────────────────

export default function GitHubSkyline() {
  const [data, setData] = useState<SkylineApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<SkylineCell | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const canvasCardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const username = "dan1d";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/github/contributions?username=${username}`
        );
        if (!res.ok) throw new Error("Failed to fetch contributions");
        const json: SkylineApiResponse = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch {
        // Silently fail — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll-triggered animations
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ctx: { revert: () => void } | null = null;

    const initAnimations = async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");

        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          // Header fade in from below
          if (headerRef.current) {
            gsap.fromTo(
              headerRef.current,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: headerRef.current,
                  start: "top 80%",
                  once: true,
                },
              }
            );
          }

          // Canvas card: fade in + scale up
          if (canvasCardRef.current) {
            gsap.fromTo(
              canvasCardRef.current,
              { opacity: 0, scale: 0.96 },
              {
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: canvasCardRef.current,
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

  const year = data?.year ?? new Date().getFullYear();
  const totalContributions = data?.totalContributions ?? 0;
  const contributions: SkylineCell[] = data?.contributions ?? [];

  // Format the contribution count with commas
  const formattedCount = totalContributions.toLocaleString();

  return (
    <section
      id="github"
      ref={sectionRef}
      className="relative min-h-screen bg-black overflow-hidden flex items-center py-24"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.03)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-4 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5">
            Open Source
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
            GitHub{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Skyline
            </span>
          </h2>

          {/* Subtext: contributions + username */}
          {!loading && (
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              <span className="text-cyan-400 font-semibold">{formattedCount}</span>
              {" contributions in "}
              <span className="text-purple-400 font-semibold">{year}</span>
              {" by "}
              <span className="font-mono text-white/80">{username}</span>
            </p>
          )}
        </div>

        {/* 3D Canvas card */}
        <div ref={canvasCardRef} className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden w-full h-[480px] lg:h-[560px]">
          {/* Corner accents */}
          <div
            className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-sm z-10"
            aria-hidden="true"
          />
          <div
            className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-sm z-10"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-400/60 rounded-bl-sm z-10"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400/60 rounded-br-sm z-10"
            aria-hidden="true"
          />

          {/* Year label */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
            <span className="text-xs text-white/40 tracking-widest uppercase font-mono">
              {year}
            </span>
          </div>

          {/* Canvas */}
          <div className="absolute inset-0">
            {loading ? (
              <SkylineSkeleton />
            ) : (
              <SkylineScene data={contributions} onHover={setHoveredCell} />
            )}
          </div>

          {/* Hover tooltip overlay */}
          {hoveredCell && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="px-4 py-2 rounded-lg bg-black/80 border border-white/10 backdrop-blur-sm text-sm text-white/90 font-mono whitespace-nowrap">
                <span className="text-cyan-400 font-semibold">
                  {hoveredCell.count}
                </span>
                {" contributions on "}
                <span className="text-white/70">{hoveredCell.date}</span>
              </div>
            </div>
          )}

          {/* Bottom label */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
            <span className="text-xs text-cyan-400/50 tracking-wider font-mono">
              Drag to orbit · Scroll to zoom
            </span>
          </div>
        </div>

        {/* Footer row: AR button + year selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          {/* Year label / selector placeholder */}
          <div className="flex items-center gap-2 text-sm text-white/40 font-mono">
            <span>Year:</span>
            <span className="text-white/70 font-semibold">{year}</span>
          </div>

          {/* View Skyline in AR */}
          <a
            href="/ar?view=skyline"
            data-testid="skyline-ar-btn"
            className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            {/* Button gradient */}
            <span
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
              aria-hidden="true"
            />
            {/* Shimmer */}
            <span
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              aria-hidden="true"
            />
            {/* AR icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative w-4 h-4"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="relative text-sm">View Skyline in AR</span>
          </a>
        </div>
      </div>
    </section>
  );
}
