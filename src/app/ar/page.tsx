"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { SkylineCell } from "@/components/three/SkylineScene";

// TODO: Re-enable when projects have modelUrl set
// const ModelViewerWrapper = dynamic(
//   () => import("@/components/ar/ModelViewerWrapper"),
//   { ssr: false, loading: () => <ARLoadingPlaceholder /> }
// );

const SkylineScene = dynamic(
  () => import("@/components/three/SkylineScene"),
  { ssr: false, loading: () => <ARLoadingPlaceholder /> }
);

const MatrixResumeScene = dynamic(
  () => import("@/components/three/MatrixResumeScene"),
  { ssr: false, loading: () => <ARLoadingPlaceholder /> }
);

type ViewMode = "resume" | "skyline";

function ARLoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
        <p className="text-sm text-white/60">Loading 3D viewer…</p>
      </div>
    </div>
  );
}

function ARPageContent() {
  const searchParams = useSearchParams();
  const [arSupported, setArSupported] = useState<boolean | null>(null);

  const initialView =
    (searchParams.get("view") as ViewMode | null) ?? "resume";
  const [activeView, setActiveView] = useState<ViewMode>(initialView);

  // Skyline data
  const [skylineData, setSkylineData] = useState<SkylineCell[]>([]);
  const [skylineLoading, setSkylineLoading] = useState(false);
  const [skylineStats, setSkylineStats] = useState<{
    total: number;
    year: number;
  } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<SkylineCell | null>(null);

  useEffect(() => {
    async function checkAR() {
      if (!navigator.xr) {
        setArSupported(false);
        return;
      }
      try {
        const supported =
          await navigator.xr.isSessionSupported("immersive-ar");
        setArSupported(supported);
      } catch {
        setArSupported(false);
      }
    }
    checkAR();
  }, []);

  // Fetch skyline data when switching to skyline view
  useEffect(() => {
    if (activeView !== "skyline" || skylineData.length > 0) return;

    let cancelled = false;
    setSkylineLoading(true);

    async function load() {
      try {
        const res = await fetch(
          "/api/github/contributions?username=dan1d"
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (!cancelled) {
          setSkylineData(json.contributions ?? []);
          setSkylineStats({
            total: json.totalContributions ?? 0,
            year: json.year ?? new Date().getFullYear(),
          });
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setSkylineLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeView, skylineData.length]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <a
          href="/"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2"
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </a>

        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-semibold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            AR Experience
          </span>
        </div>

        {arSupported !== null && (
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              arSupported
                ? "text-green-400 border-green-400/30 bg-green-400/5"
                : "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
            }`}
          >
            {arSupported ? "AR Ready" : "3D Mode"}
          </span>
        )}
      </header>

      {/* Mode tab bar */}
      <div className="relative z-50 flex items-center gap-1 px-4 sm:px-6 py-3 border-b border-white/10 bg-black/60 backdrop-blur-sm">
        {(
          [
            // TODO: Re-enable when projects have modelUrl set
            // { key: "models", label: "3D Models" },
            { key: "resume", label: "Resume" },
            { key: "skyline", label: "Skyline" },
          ] as { key: ViewMode; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveView(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeView === key
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Resume view — Matrix decoder */}
        {activeView === "resume" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Matrix decode canvas */}
            <div className="flex-1 relative min-h-[60vh] lg:min-h-0 bg-black">
              {/* Corner HUD brackets */}
              <div
                className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-green-400/70 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-green-400/70 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-lime-400/60 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-lime-400/60 pointer-events-none z-10"
                aria-hidden="true"
              />

              {/* Scanline overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-[2]"
                aria-hidden="true"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.02) 3px, rgba(0,255,65,0.02) 6px)",
                }}
              />

              {/* HUD: Top-left */}
              <div
                className="absolute top-5 left-14 z-10 flex items-center gap-2 font-mono"
                aria-hidden="true"
              >
                <span
                  className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
                  style={{ boxShadow: "0 0 6px #00ff41" }}
                />
                <span
                  className="text-green-400 text-xs tracking-widest"
                  style={{ textShadow: "0 0 6px #00ff41" }}
                >
                  DECRYPTING IDENTITY...
                </span>
              </div>

              {/* HUD: Top-right */}
              <div
                className="absolute top-5 right-14 z-10 font-mono text-right"
                aria-hidden="true"
              >
                <div
                  className="text-green-400 text-xs tracking-widest"
                  style={{ textShadow: "0 0 6px #00ff41" }}
                >
                  CLEARANCE: LEVEL_4
                </div>
              </div>

              {/* The Matrix resume decoder */}
              <div className="absolute inset-0 z-[1]">
                <MatrixResumeScene autoPlay decodeDelay={1500} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
              <div>
                <p className="text-xs text-green-400 font-semibold tracking-widest uppercase mb-2">
                  Viewing
                </p>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Matrix Resume
                </h1>
                <p className="text-sm text-white/60 leading-relaxed font-mono">
                  &quot;What if I told you... your resume is just code?&quot;
                </p>
                <p className="text-xs text-green-400/50 mt-1 font-mono">
                  — Morpheus
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">
                  Subject
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Name</span>
                    <span className="text-green-400 font-mono">Daniel A. Dominguez</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Role</span>
                    <span className="text-green-400 font-mono">Sr Full-Stack Eng</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Experience</span>
                    <span className="text-green-400 font-mono">12+ years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Status</span>
                    <span className="text-lime-400 font-mono">ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="/resume.pdf"
                  download
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg font-mono text-xs text-green-400 border border-green-400/40 bg-green-400/5 tracking-widest hover:bg-green-400/10 hover:border-green-400/60 transition-all duration-200"
                  style={{ textShadow: "0 0 6px #00ff41" }}
                >
                  [DOWNLOAD_SOURCE] resume.pdf
                </a>
                <a
                  href="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg font-mono text-xs text-green-400/60 border border-green-400/20 tracking-widest hover:text-green-400 hover:border-green-400/40 transition-all duration-200"
                >
                  [EXIT_MATRIX] &rarr; dan1d.dev
                </a>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">
                  How it works
                </p>
                <ul className="space-y-2 text-xs text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold mt-0.5">1</span>
                    Matrix rain initializes the neural feed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold mt-0.5">2</span>
                    Characters decode from noise to identity data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold mt-0.5">3</span>
                    Skills, experience, and mission log materialize
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        )}

        {/* Skyline view — uses the actual R3F SkylineScene */}
        {activeView === "skyline" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            <div className="flex-1 relative min-h-[50vh] lg:min-h-0 bg-black/50">
              {/* Corner accents */}
              <div
                className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-green-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-green-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-lime-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-lime-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />

              {skylineLoading ? (
                <ARLoadingPlaceholder />
              ) : (
                <SkylineScene
                  data={skylineData}
                  onHover={setHoveredCell}
                />
              )}

              {/* Hover tooltip */}
              {hoveredCell && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className="px-4 py-2 rounded-lg bg-black/80 border border-white/10 backdrop-blur-sm text-sm text-white/90 font-mono whitespace-nowrap">
                    <span className="text-green-400 font-semibold">
                      {hoveredCell.count}
                    </span>
                    {" contributions on "}
                    <span className="text-white/70">{hoveredCell.date}</span>
                  </div>
                </div>
              )}

              {!skylineLoading && !hoveredCell && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-black/70 border border-white/10 text-xs text-white/50 backdrop-blur-sm">
                  Drag to orbit · Scroll to zoom · Hover for details
                </div>
              )}
            </div>

            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
              <div>
                <p className="text-xs text-green-400 font-semibold tracking-widest uppercase mb-2">
                  Viewing
                </p>
                <h1 className="text-2xl font-bold text-white mb-2">
                  GitHub Skyline
                </h1>
                <p className="text-sm text-white/60 leading-relaxed">
                  A 3D visualization of GitHub contribution history. Each bar
                  represents a day — height shows contribution count.
                </p>
              </div>

              {skylineStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {skylineStats.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Contributions</p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-2xl font-bold text-lime-400">
                      {skylineStats.year}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Year</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">
                  How to use
                </p>
                <ul className="space-y-2 text-xs text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold mt-0.5">1</span>
                    Drag to orbit around the skyline
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold mt-0.5">2</span>
                    Scroll to zoom in and out
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold mt-0.5">3</span>
                    Hover over bars to see contribution details
                  </li>
                </ul>
              </div>

              {/* Color legend */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">
                  Legend
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Less</span>
                  <div className="flex gap-1">
                    {["#0d1117", "#0e4429", "#006d32", "#26a641", "#39d353"].map(
                      (c) => (
                        <div
                          key={c}
                          className="w-4 h-4 rounded-sm"
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                  <span className="text-xs text-white/40">More</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* TODO: Re-enable 3D Models view when projects have modelUrl set */}
      </main>
    </div>
  );
}

export default function ARPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ARPageContent />
    </Suspense>
  );
}
