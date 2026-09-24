"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { SkylineCell } from "@/components/three/SkylineScene";
import DecodeText from "@/components/ui/DecodeText";

// ─── 3D experience ──────────────────────────────────────────────────────────
// Two rooms in the same building as the hero corridor. RESUME: the identity
// decoder floating as a hologram inside a hall of code. SKYLINE: a year of
// commits standing as a city of glyph towers inside a larger hall. Both carry
// the corridor's art direction: luminous code fabric, cabling, doorway light,
// bloom. The chrome around them is the site's terminal language.

const SkylineScene = dynamic(() => import("@/components/three/SkylineScene"), { ssr: false, loading: () => <Loading /> });
const MatrixResumeScene = dynamic(() => import("@/components/three/MatrixResumeScene"), { ssr: false, loading: () => <Loading /> });
const ResumeHallScene = dynamic(() => import("@/components/three/ResumeHallScene"), { ssr: false, loading: () => null });

type ViewMode = "resume" | "skyline";

function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px] font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border border-green-400/60 border-t-transparent animate-spin" />
        <p className="text-[11px] tracking-[0.3em] text-green-400/60">LOADING_CONSTRUCT</p>
      </div>
    </div>
  );
}

function Brackets({ tone = "green" }: { tone?: "green" | "lime" }) {
  const c = tone === "lime" ? "border-lime-400/60" : "border-green-400/70";
  return (
    <>
      <div className={`absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 ${c} pointer-events-none z-10`} aria-hidden="true" />
      <div className={`absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 ${c} pointer-events-none z-10`} aria-hidden="true" />
      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-lime-400/50 pointer-events-none z-10" aria-hidden="true" />
      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-lime-400/50 pointer-events-none z-10" aria-hidden="true" />
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative border border-green-400/20 bg-green-400/[0.03] p-4 space-y-3">
      <span className="absolute top-1 left-1 w-2 h-2 border-t border-l border-green-400/50" aria-hidden="true" />
      <span className="absolute top-1 right-1 w-2 h-2 border-t border-r border-green-400/50" aria-hidden="true" />
      <span className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-green-400/30" aria-hidden="true" />
      <span className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-green-400/30" aria-hidden="true" />
      <p className="text-[10px] tracking-[0.3em] text-green-400/50">{`// ${title}`}</p>
      {children}
    </div>
  );
}

function Row({ k, v, tone = "green" }: { k: string; v: string; tone?: "green" | "lime" }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-green-400/45">{k}</span>
      <span className={tone === "lime" ? "text-lime-400" : "text-green-300"} style={{ textShadow: "0 0 6px rgba(0,255,65,0.35)" }}>{v}</span>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[11px] text-green-300/60 leading-relaxed">
      {items.map((t, i) => (
        <li key={t} className="flex items-start gap-2">
          <span className="text-green-400/70 font-bold">{String(i + 1).padStart(2, "0")}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ARPageContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as ViewMode | null) ?? "resume";
  const [activeView, setActiveView] = useState<ViewMode>(initialView);

  const [skylineData, setSkylineData] = useState<SkylineCell[]>([]);
  const [skylineLoading, setSkylineLoading] = useState(false);
  const [skylineStats, setSkylineStats] = useState<{ total: number; year: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<SkylineCell | null>(null);

  useEffect(() => {
    if (activeView !== "skyline" || skylineData.length > 0) return;
    let cancelled = false;
    setSkylineLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/github/contributions?username=dan1d");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (!cancelled) {
          setSkylineData(json.contributions ?? []);
          setSkylineStats({ total: json.totalContributions ?? 0, year: json.year ?? new Date().getFullYear() });
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setSkylineLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeView, skylineData.length]);

  const tabs: { key: ViewMode; label: string }[] = [
    { key: "resume", label: "RESUME" },
    { key: "skyline", label: "SKYLINE" },
  ];

  return (
    <div className="min-h-screen bg-black text-green-300 flex flex-col font-mono">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-green-400/15 bg-black/85 backdrop-blur-md">
        <Link href="/" className="text-xs tracking-widest text-green-400/60 hover:text-green-400 transition-colors">
          <span className="text-green-400/35" aria-hidden="true">[</span> &larr; BACK <span className="text-green-400/35" aria-hidden="true">]</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-green-400 animate-pulse" style={{ boxShadow: "0 0 6px #00ff41" }} />
          <DecodeText as="span" text="// 3D_EXPERIENCE" duration={700} className="text-xs tracking-[0.3em] text-lime-400" style={{ textShadow: "0 0 8px rgba(57,255,20,0.6)" }} />
        </div>
        <span className="hidden sm:inline text-[10px] tracking-[0.25em] px-2.5 py-1 border border-green-400/30 text-green-400/70">
          NEURAL_LINK: ACTIVE
        </span>
      </header>

      {/* Mode tabs */}
      <div className="relative z-50 flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-green-400/10 bg-black/70 backdrop-blur-sm">
        {tabs.map(({ key, label }) => {
          const active = activeView === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              aria-pressed={active}
              className={`px-3 py-1.5 text-[11px] tracking-[0.25em] border transition-all duration-200 ${
                active
                  ? "border-green-400/70 text-lime-300 bg-green-400/10"
                  : "border-green-400/15 text-green-400/50 hover:text-green-400 hover:border-green-400/40"
              }`}
              style={active ? { textShadow: "0 0 8px rgba(57,255,20,0.7)", boxShadow: "0 0 18px rgba(0,255,65,0.15)" } : undefined}
            >
              <span className={active ? "text-green-400/60" : "text-green-400/25"} aria-hidden="true">[ </span>
              {label}
              <span className={active ? "text-green-400/60" : "text-green-400/25"} aria-hidden="true"> ]</span>
            </button>
          );
        })}
        <span className="ml-auto hidden md:inline text-[10px] tracking-widest text-green-400/35">
          {activeView === "resume" ? "ROOM_01 // IDENTITY_HALL" : "ROOM_02 // CONTRIBUTION_CITY"}
        </span>
      </div>

      <main className="flex-1 flex flex-col">
        {/* ── Resume: decoder hologram inside a hall of code ── */}
        {activeView === "resume" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            <div className="flex-1 relative min-h-[70vh] lg:min-h-0 bg-black overflow-hidden">
              <div className="absolute inset-0 z-0"><ResumeHallScene /></div>
              <Brackets />
              <div className="absolute inset-0 pointer-events-none z-[2]" aria-hidden="true"
                style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.025) 3px, rgba(0,255,65,0.025) 6px)" }} />
              <div className="absolute top-5 left-14 z-10 flex items-center gap-2" aria-hidden="true">
                <span className="w-2 h-2 bg-green-400 animate-pulse" style={{ boxShadow: "0 0 6px #00ff41" }} />
                <DecodeText as="span" text="DECRYPTING IDENTITY..." duration={900} className="text-green-400 text-xs tracking-widest" style={{ textShadow: "0 0 6px #00ff41" }} />
              </div>
              <div className="absolute top-5 right-14 z-10 text-right" aria-hidden="true">
                <DecodeText as="span" text="CLEARANCE: LEVEL_4" duration={900} delay={200} className="text-green-400 text-xs tracking-widest" style={{ textShadow: "0 0 6px #00ff41" }} />
              </div>
              <div className="absolute inset-0 z-[1]">
                <MatrixResumeScene autoPlay decodeDelay={1500} transparent />
              </div>
            </div>

            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-green-400/15 bg-black/80 backdrop-blur-xl p-6 space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-green-400/50 mb-2">{"// VIEWING"}</p>
                <DecodeText as="h1" text="Matrix Resume" duration={700} className="text-2xl font-bold text-lime-400 mb-2" style={{ textShadow: "0 0 12px rgba(57,255,20,0.5)" }} />
                <DecodeText as="p" text={'"What if I told you... your resume is just code?"'} duration={1100} delay={300} className="text-xs text-green-300/60 leading-relaxed" />
                <p className="text-[10px] text-green-400/40 mt-1">&mdash; Morpheus</p>
              </div>

              <Panel title="SUBJECT">
                <Row k="Name" v="Daniel A. Dominguez" />
                <Row k="Role" v="Sr Full-Stack Eng" />
                <Row k="Experience" v="14+ years" />
                <Row k="Status" v="ONLINE" tone="lime" />
              </Panel>

              <div className="space-y-2">
                <a href="/api/resume" download
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs text-lime-300 border border-green-400/50 bg-green-400/5 tracking-widest hover:bg-green-400/15 hover:border-green-400 transition-all duration-200"
                  style={{ textShadow: "0 0 6px rgba(0,255,65,0.6)" }}>
                  [DOWNLOAD_SOURCE] resume.pdf
                </a>
                <Link href="/" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs text-green-400/60 border border-green-400/20 tracking-widest hover:text-green-400 hover:border-green-400/40 transition-all duration-200">
                  [EXIT_MATRIX] &rarr; dan1d.dev
                </Link>
              </div>

              <Panel title="HOW_IT_WORKS">
                <Steps items={[
                  "The hall of code initializes the neural feed",
                  "Characters decode from noise to identity data",
                  "Skills, mission log and open source materialize",
                ]} />
              </Panel>
            </aside>
          </div>
        )}

        {/* ── Skyline: a city of commits inside a hall of code ── */}
        {activeView === "skyline" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            <div className="flex-1 relative min-h-[60vh] lg:min-h-0 bg-black overflow-hidden">
              <Brackets />
              {skylineLoading ? <Loading /> : <SkylineScene data={skylineData} onHover={setHoveredCell} cinematic />}

              {hoveredCell && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className="px-4 py-2 bg-black/85 border border-green-400/40 text-xs text-green-300 whitespace-nowrap" style={{ boxShadow: "0 0 18px rgba(0,255,65,0.15)" }}>
                    <span className="text-lime-400 font-bold" style={{ textShadow: "0 0 6px rgba(57,255,20,0.7)" }}>{hoveredCell.count}</span>
                    {" contributions on "}
                    <span className="text-green-400/80">{hoveredCell.date}</span>
                  </div>
                </div>
              )}
              {!skylineLoading && !hoveredCell && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/70 border border-green-400/20 text-[10px] tracking-widest text-green-400/50">
                  DRAG_TO_ORBIT &middot; SCROLL_TO_ZOOM &middot; HOVER_FOR_DETAILS
                </div>
              )}
            </div>

            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-green-400/15 bg-black/80 backdrop-blur-xl p-6 space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-green-400/50 mb-2">{"// VIEWING"}</p>
                <DecodeText as="h1" text="GitHub Skyline" duration={700} className="text-2xl font-bold text-lime-400 mb-2" style={{ textShadow: "0 0 12px rgba(57,255,20,0.5)" }} />
                <DecodeText as="p" text="A year of contributions standing as a city of code. Each tower is a day; its height is the commit count." duration={1200} delay={300} className="text-xs text-green-300/60 leading-relaxed" />
              </div>

              {skylineStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-green-400/20 bg-green-400/[0.03] p-3 text-center">
                    <p className="text-2xl font-bold text-lime-400" style={{ textShadow: "0 0 10px rgba(57,255,20,0.6)" }}>{skylineStats.total.toLocaleString()}</p>
                    <p className="text-[10px] tracking-widest text-green-400/45 mt-1">CONTRIBUTIONS</p>
                  </div>
                  <div className="border border-green-400/20 bg-green-400/[0.03] p-3 text-center">
                    <p className="text-2xl font-bold text-green-300" style={{ textShadow: "0 0 10px rgba(0,255,65,0.5)" }}>{skylineStats.year}</p>
                    <p className="text-[10px] tracking-widest text-green-400/45 mt-1">YEAR</p>
                  </div>
                </div>
              )}

              <Panel title="HOW_TO_USE">
                <Steps items={["Drag to orbit the city", "Scroll to zoom in and out", "Hover a tower for that day's commits"]} />
              </Panel>

              <Panel title="LEGEND">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-400/45">LESS</span>
                  <div className="flex gap-1">
                    {["#1e6b35", "#2aa552", "#3fd671", "#7dff9f", "#d6ffe3"].map((c) => (
                      <div key={c} className="w-4 h-4" style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}66` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-green-400/45">MORE</span>
                </div>
              </Panel>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ARPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-10 h-10 border border-green-400/60 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ARPageContent />
    </Suspense>
  );
}
