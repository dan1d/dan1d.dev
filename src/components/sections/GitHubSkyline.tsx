"use client";

import { useState, useEffect, useRef } from "react";
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

// ─── Typing animation hook ───────────────────────────────────────────────────

function useTypingEffect(text: string, speed = 40, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function SkylineSkeleton() {
  return (
    <div
      data-testid="skyline-loading"
      className="w-full h-full flex flex-col items-center justify-center gap-6"
      aria-label="Loading GitHub skyline"
    >
      {/* Matrix-style pulsing grid placeholder */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(52, 1fr)` }}>
        {Array.from({ length: 52 * 7 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-sm bg-green-400/20 animate-pulse"
            style={{ animationDelay: `${(i % 52) * 20}ms` }}
          />
        ))}
      </div>
      <p
        className="text-xs text-green-400/50 font-mono tracking-widest uppercase animate-pulse"
        style={{ textShadow: "0 0 8px #00ff41" }}
      >
        &gt; INITIALIZING NEURAL MATRIX...
      </p>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function MatrixTooltip({ cell }: { cell: SkylineCell }) {
  const level = cell.count === 0 ? 0 : cell.count < 3 ? 1 : cell.count < 7 ? 2 : cell.count < 12 ? 3 : 4;
  const levelBar = "█".repeat(level) + "░".repeat(4 - level);
  const statusLabel =
    cell.count === 0
      ? "NO_ACTIVITY"
      : cell.count < 3
      ? "LOW_ACTIVITY"
      : cell.count < 7
      ? "MODERATE"
      : cell.count < 12
      ? "HIGH_ACTIVITY"
      : "CRITICAL_FLUX";

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div
        className="px-4 py-3 bg-black/90 border border-green-400/40 font-mono text-xs text-green-400 whitespace-nowrap"
        style={{
          boxShadow: "0 0 20px rgba(0,255,65,0.15), inset 0 0 20px rgba(0,255,65,0.03)",
        }}
      >
        <div className="text-green-400/60 mb-1">┌─────────────────────────┐</div>
        <div>│ DATE: <span className="text-green-300">{cell.date}</span>{" ".repeat(Math.max(0, 8 - cell.date.length))}│</div>
        <div>│ COMMITS: <span className="text-lime-400 font-bold">{String(cell.count).padEnd(15)}</span>│</div>
        <div>│ LEVEL: <span className="text-green-400">{levelBar}</span> ({level}/4){" ".repeat(3)}│</div>
        <div>│ STATUS: <span className="text-lime-300">{statusLabel.padEnd(16)}</span>│</div>
        <div className="text-green-400/60 mt-1">└─────────────────────────┘</div>
      </div>
    </div>
  );
}

// ─── GitHubSkyline ────────────────────────────────────────────────────────────

export default function GitHubSkyline() {
  const [data, setData] = useState<SkylineApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<SkylineCell | null>(null);
  const [timestamp, setTimestamp] = useState("");
  const [agentCycle, setAgentCycle] = useState(0);
  const [coords, setCoords] = useState<"geo" | "sector">("geo");
  const [flickerVisible, setFlickerVisible] = useState(true);

  const { ref: sectionRef, visible: canvasVisible } = useCanvasVisibility("400px");
  const canvasCardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const username = "dan1d";

  // Typing effects
  const cmd = useTypingEffect("> SYSTEM://neural_matrix/contributions", 35, 200);
  const agent = useTypingEffect("[AGENT_SMITH.exe] Scanning @dan1d contributions... COMPLETE", 25, 1400);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimestamp(
        now.toISOString().replace("T", " ").slice(0, 19)
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Agent name cycling
  useEffect(() => {
    const id = setInterval(() => setAgentCycle((c) => (c + 1) % 3), 2200);
    return () => clearInterval(id);
  }, []);

  // Coordinates toggle
  useEffect(() => {
    const id = setInterval(() => setCoords((c) => (c === "geo" ? "sector" : "geo")), 3500);
    return () => clearInterval(id);
  }, []);

  // Flicker effect
  useEffect(() => {
    const flicker = () => {
      setFlickerVisible(false);
      setTimeout(() => setFlickerVisible(true), 80);
    };
    const id = setInterval(flicker, Math.random() * 4000 + 3000);
    return () => clearInterval(id);
  }, []);

  // Data fetch
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
  const formattedCount = totalContributions.toLocaleString();

  const agentNames = ["NEO", "MORPHEUS", "AGENT_SMITH"];

  // Fake last-7-days bar heights for the HUD sidebar
  const miniBarHeights = [4, 7, 2, 9, 5, 3, 8];

  return (
    <section
      id="github"
      ref={sectionRef}
      className="relative min-h-screen bg-black overflow-hidden flex items-center py-24"
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        aria-hidden="true"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)",
        }}
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-lime-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,65,0.03)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* ── Header ── */}
        <div ref={headerRef} className="mb-10">
          {/* Hidden heading for accessibility + tests */}
          <h2 className="sr-only">GitHub Skyline</h2>

          {/* Terminal command line */}
          <div className="font-mono mb-3">
            <span
              className="text-green-400 text-lg sm:text-xl tracking-tight"
              style={{ textShadow: "0 0 10px #00ff41", opacity: flickerVisible ? 1 : 0.85 }}
            >
              {cmd.displayed}
              {!cmd.done && (
                <span className="inline-block w-2 h-4 bg-green-400 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
          </div>

          {/* Agent scanning line */}
          <div className="font-mono text-sm text-green-400/70 mb-8 h-5">
            {agent.displayed}
            {!agent.done && agent.displayed.length > 0 && (
              <span className="inline-block w-1.5 h-3.5 bg-green-400/60 ml-0.5 animate-pulse align-middle" />
            )}
          </div>

          {/* Stats terminal readout */}
          {!loading && (
            <div
              className="inline-block font-mono text-xs sm:text-sm text-green-400 bg-black border border-green-400/25 px-5 py-4"
              style={{ boxShadow: "0 0 20px rgba(0,255,65,0.08)" }}
              data-testid="skyline-stats"
            >
              <div className="text-green-400/50 mb-2 text-xs">// CONTRIBUTION METRICS</div>
              <div>
                <span className="text-green-400/70">COMMITS</span>
                <span className="text-green-400/40"> ........... </span>
                <span className="text-lime-400 font-bold" data-testid="skyline-commit-count" style={{ textShadow: "0 0 8px #39ff14" }}>
                  {formattedCount}
                </span>
              </div>
              <div>
                <span className="text-green-400/70">YEAR</span>
                <span className="text-green-400/40"> .............. </span>
                <span className="text-lime-400 font-bold">{year}</span>
              </div>
              <div>
                <span className="text-green-400/70">STATUS</span>
                <span className="text-green-400/40"> ............ </span>
                <span className="text-green-400 font-bold">ACTIVE</span>
              </div>
              <div>
                <span className="text-green-400/70">THREAT_LEVEL</span>
                <span className="text-green-400/40"> ...... </span>
                <span className="text-lime-400">████████░░</span>
                <span className="text-green-400/60"> 80%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 3D Canvas card ── */}
        <div
          ref={canvasCardRef}
          className="relative border border-green-400/20 bg-black/80 overflow-hidden w-full h-[480px] lg:h-[560px]"
          style={{
            boxShadow:
              "0 0 40px rgba(0,255,65,0.08), inset 0 0 60px rgba(0,255,65,0.03)",
          }}
        >
          {/* Scanline on canvas wrapper */}
          <div
            className="absolute inset-0 pointer-events-none z-[2]"
            aria-hidden="true"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.025) 3px, rgba(0,255,65,0.025) 6px)",
            }}
          />

          {/* ── HUD: Corner brackets ── */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-green-400/70 z-10" aria-hidden="true" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-green-400/70 z-10" aria-hidden="true" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-lime-400/60 z-10" aria-hidden="true" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-lime-400/60 z-10" aria-hidden="true" />

          {/* ── HUD: Top-left — Live Feed ── */}
          <div className="absolute top-5 left-14 z-10 flex items-center gap-2 font-mono" aria-hidden="true">
            <span
              className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
              style={{ boxShadow: "0 0 6px #00ff41" }}
            />
            <span className="text-green-400 text-xs tracking-widest" style={{ textShadow: "0 0 6px #00ff41" }}>
              LIVE FEED
            </span>
            <span className="text-green-400/50 text-xs">{timestamp}</span>
          </div>

          {/* ── HUD: Top-right — Matrix version ── */}
          <div className="absolute top-5 right-14 z-10 font-mono text-right" aria-hidden="true">
            <div
              className="text-green-400 text-xs tracking-widest mb-1"
              style={{ textShadow: "0 0 6px #00ff41" }}
            >
              MATRIX v2030.3
            </div>
            <div className="flex items-center gap-1 justify-end">
              <div className="w-20 h-1.5 bg-green-400/10 border border-green-400/20 overflow-hidden">
                <div className="h-full bg-green-400/70 animate-[matrixLoad_3s_ease-in-out_infinite]" style={{ width: "73%" }} />
              </div>
              <span className="text-green-400/50 text-xs">73%</span>
            </div>
          </div>

          {/* ── HUD: Left sidebar — agent names vertical ── */}
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 font-mono"
            aria-hidden="true"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "translateY(-50%) rotate(180deg)" }}
          >
            <span
              key={agentCycle}
              className="text-green-400/60 text-xs tracking-widest transition-all duration-700"
              style={{ textShadow: "0 0 6px #00ff41" }}
            >
              {agentNames[agentCycle]}
            </span>
          </div>

          {/* ── HUD: Right sidebar — mini contribution bars ── */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1" aria-hidden="true">
            <span className="text-green-400/50 text-xs font-mono tracking-widest mb-1" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
              7D
            </span>
            {miniBarHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-green-400/30 border border-green-400/20"
                style={{ height: `${h * 3}px`, backgroundColor: `rgba(0,255,65,${0.1 + h * 0.08})` }}
              />
            ))}
          </div>

          {/* ── HUD: Bottom-left — coordinates ── */}
          <div className="absolute bottom-5 left-14 z-10 font-mono" aria-hidden="true">
            <span className="text-green-400/60 text-xs transition-all duration-500">
              {coords === "geo"
                ? "LOC: 40.7128° N, 74.0060° W"
                : "SECTOR: 7G"}
            </span>
          </div>

          {/* ── HUD: Bottom-right — neural link ── */}
          <div className="absolute bottom-5 right-14 z-10 font-mono" aria-hidden="true">
            <span
              className="text-green-400 text-xs tracking-wider"
              style={{ textShadow: "0 0 6px #00ff41" }}
            >
              NEURAL_LINK: ESTABLISHED{" "}
              <span className="text-lime-400 animate-pulse">◉</span>
            </span>
          </div>

          {/* ── Canvas — mounts when section is near viewport ── */}
          <div className="absolute inset-0 z-[1]">
            {loading ? (
              <SkylineSkeleton />
            ) : canvasVisible ? (
              <SkylineScene data={contributions} onHover={setHoveredCell} />
            ) : (
              <SkylineSkeleton />
            )}
          </div>

          {/* ── Hover tooltip ── */}
          {hoveredCell && <MatrixTooltip cell={hoveredCell} />}
        </div>

        {/* ── Character cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {/* Neo */}
          <div
            className="group border border-green-400/30 bg-black p-5 font-mono transition-all duration-300 hover:border-green-400/70 hover:bg-green-400/5"
            style={{ "--tw-shadow": "0 0 20px rgba(0,255,65,0.15)" } as React.CSSProperties}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,255,65,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div className="text-green-400/40 text-xs mb-2">// CHARACTER_01</div>
            <div className="text-lime-400 text-sm font-bold mb-1" style={{ textShadow: "0 0 8px #39ff14" }}>
              NEO // THE_ONE
            </div>
            <div className="text-green-300 text-xs mb-3 italic">
              &quot;I know TypeScript.&quot;
            </div>
            <div className="text-green-400/60 text-xs leading-relaxed">
              {formattedCount} commits in the neural matrix
            </div>
          </div>

          {/* Morpheus */}
          <div
            className="group border border-green-400/30 bg-black p-5 font-mono transition-all duration-300 hover:border-green-400/70 hover:bg-green-400/5"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,255,65,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div className="text-green-400/40 text-xs mb-2">// CHARACTER_02</div>
            <div className="text-lime-400 text-sm font-bold mb-1" style={{ textShadow: "0 0 8px #39ff14" }}>
              MORPHEUS // THE_GUIDE
            </div>
            <div className="text-green-300 text-xs mb-3 italic">
              &quot;Free your mind.&quot;
            </div>
            <div className="text-green-400/60 text-xs leading-relaxed">
              What if I told you... every commit matters?
            </div>
          </div>

          {/* Agent Smith */}
          <div
            className="group border border-green-400/30 bg-black p-5 font-mono transition-all duration-300 hover:border-green-400/70 hover:bg-green-400/5"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,255,65,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div className="text-green-400/40 text-xs mb-2">// CHARACTER_03</div>
            <div className="text-lime-400 text-sm font-bold mb-1" style={{ textShadow: "0 0 8px #39ff14" }}>
              AGENT_SMITH // THE_SYSTEM
            </div>
            <div className="text-green-300 text-xs mb-3 italic">
              &quot;Inevitable, Mr. Anderson.&quot;
            </div>
            <div className="text-green-400/60 text-xs leading-relaxed">
              System analysis: contribution pattern detected
            </div>
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
          {/* Enter the Matrix */}
          <a
            href="/ar?view=skyline"
            data-testid="skyline-ar-btn"
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-green-400/50 bg-black font-mono text-xs text-green-400 tracking-widest transition-all duration-200 hover:border-green-400 hover:bg-green-400/10 hover:text-lime-300"
            style={{ textShadow: "0 0 6px #00ff41" }}
          >
            <span className="text-green-400/50 group-hover:text-green-400">[</span>
            ENTER_THE_MATRIX
            <span className="text-green-400/50 group-hover:text-green-400">]</span>
            <span className="text-green-400/40 ml-1">/ar?view=skyline</span>
          </a>

          {/* Download Consciousness */}
          <button
            type="button"
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-green-400/30 bg-black font-mono text-xs text-green-400/70 tracking-widest transition-all duration-200 hover:border-green-400/60 hover:bg-green-400/5 hover:text-green-400"
            onClick={() => {
              if (data) {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `skyline-${data.year}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
          >
            <span className="text-green-400/40 group-hover:text-green-400/60">[</span>
            DOWNLOAD_CONSCIOUSNESS
            <span className="text-green-400/40 group-hover:text-green-400/60">]</span>
          </button>

          {/* Jack In */}
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-green-400/30 bg-black font-mono text-xs text-green-400/70 tracking-widest transition-all duration-200 hover:border-green-400/60 hover:bg-green-400/5 hover:text-green-400"
          >
            <span className="text-green-400/40 group-hover:text-green-400/60">[</span>
            JACK_IN
            <span className="text-green-400/40 group-hover:text-green-400/60">]</span>
            <span className="text-green-400/40 ml-1">github.com/{username}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
