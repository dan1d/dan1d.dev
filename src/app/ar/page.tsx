"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { projects } from "@/data/projects";
import dynamic from "next/dynamic";
import type { SkylineCell } from "@/components/three/SkylineScene";

const ModelViewerWrapper = dynamic(
  () => import("@/components/ar/ModelViewerWrapper"),
  { ssr: false, loading: () => <ARLoadingPlaceholder /> }
);

const SkylineScene = dynamic(
  () => import("@/components/three/SkylineScene"),
  { ssr: false, loading: () => <ARLoadingPlaceholder /> }
);

type ViewMode = "models" | "resume" | "skyline";

function ARLoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-sm text-white/60">Loading 3D viewer…</p>
      </div>
    </div>
  );
}

function ARPageContent() {
  const searchParams = useSearchParams();
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);

  const initialView =
    (searchParams.get("view") as ViewMode | null) ?? "models";
  const [activeView, setActiveView] = useState<ViewMode>(initialView);

  // Skyline data
  const [skylineData, setSkylineData] = useState<SkylineCell[]>([]);
  const [skylineLoading, setSkylineLoading] = useState(false);
  const [skylineStats, setSkylineStats] = useState<{
    total: number;
    year: number;
  } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<SkylineCell | null>(null);

  const activeProject = projects[activeProjectIndex];

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
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/80 backdrop-blur-md">
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
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
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
      <div className="flex items-center gap-1 px-4 sm:px-6 py-3 border-b border-white/10 bg-black/60 backdrop-blur-sm">
        {(
          [
            { key: "models", label: "3D Models" },
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
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-sm"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Resume view */}
        {activeView === "resume" && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/5 border-b border-white/10">
              <div>
                <p className="text-xs text-cyan-400 font-semibold tracking-widest uppercase">
                  Viewing
                </p>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Resume — Daniel Alejandro Dominguez Diaz
                </h1>
              </div>
              <a
                href="/resume.pdf"
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </a>
            </div>

            <div className="flex-1 relative">
              <iframe
                src="/resume.pdf"
                title="Resume PDF"
                className="absolute inset-0 w-full h-full border-0"
                style={{ border: "none" }}
              >
                <p className="p-6 text-white/50 text-sm">
                  Your browser does not support inline PDF viewing.{" "}
                  <a
                    href="/resume.pdf"
                    className="text-cyan-400 underline hover:text-cyan-300"
                  >
                    Download the PDF
                  </a>{" "}
                  to view it.
                </p>
              </iframe>
            </div>

            {arSupported !== null && (
              <div className="px-4 sm:px-6 py-3 bg-white/5 border-t border-white/10">
                {arSupported ? (
                  <p className="text-xs text-purple-300/70 text-center">
                    AR-capable device detected — future update will support
                    overlaying resume data in augmented reality.
                  </p>
                ) : (
                  <p className="text-xs text-white/30 text-center">
                    Use a WebXR-capable device to experience AR resume overlay
                    in a future update.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Skyline view — uses the actual R3F SkylineScene */}
        {activeView === "skyline" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            <div className="flex-1 relative min-h-[50vh] lg:min-h-0 bg-black/50">
              {/* Corner accents */}
              <div
                className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-400/40 pointer-events-none z-10"
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
                    <span className="text-cyan-400 font-semibold">
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
                <p className="text-xs text-cyan-400 font-semibold tracking-widest uppercase mb-2">
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
                    <p className="text-2xl font-bold text-cyan-400">
                      {skylineStats.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/40 mt-1">Contributions</p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">
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
                    <span className="text-cyan-400 font-bold mt-0.5">1</span>
                    Drag to orbit around the skyline
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">2</span>
                    Scroll to zoom in and out
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">3</span>
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
                    {["#1a1a2e", "#06b6d4", "#0891b2", "#7c3aed", "#8b5cf6"].map(
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

        {/* 3D Models view (default) */}
        {activeView === "models" && (
          <div className="flex-1 flex flex-col lg:flex-row">
            <div className="flex-1 relative min-h-[50vh] lg:min-h-0 bg-black/50">
              <div
                className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-400/40 pointer-events-none z-10"
                aria-hidden="true"
              />

              <ModelViewerWrapper
                src={
                  activeProject.modelUrl ??
                  "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                }
                alt={`3D model of ${activeProject.title}`}
                arSupported={arSupported ?? false}
              />

              {arSupported === false && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-black/70 border border-white/10 text-xs text-white/50 backdrop-blur-sm">
                  Orbit controls active — use a WebXR device for AR
                </div>
              )}
            </div>

            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
              <div>
                <p className="text-xs text-cyan-400 font-semibold tracking-widest uppercase mb-2">
                  Viewing
                </p>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {activeProject.title}
                </h1>
                <p className="text-sm text-white/60 leading-relaxed">
                  {activeProject.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-white/70 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {activeProject.url && (
                <a
                  href={activeProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Visit {activeProject.title}
                </a>
              )}

              {projects.length > 1 && (
                <div>
                  <p className="text-xs text-white/40 font-medium tracking-widest uppercase mb-3">
                    All Projects
                  </p>
                  <ul className="space-y-2">
                    {projects.map((project, i) => (
                      <li key={project.id}>
                        <button
                          type="button"
                          onClick={() => setActiveProjectIndex(i)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            i === activeProjectIndex
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30"
                              : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          {project.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 tracking-widest uppercase">
                  How to use
                </p>
                <ul className="space-y-2 text-xs text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">1</span>
                    {arSupported
                      ? "Tap the AR button in the model viewer"
                      : "Drag to orbit around the 3D model"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">2</span>
                    {arSupported
                      ? "Point your camera at a flat surface"
                      : "Pinch to zoom in and out"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">3</span>
                    {arSupported
                      ? "Tap to place and explore the project"
                      : "Scroll to switch between projects"}
                  </li>
                </ul>
              </div>
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
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ARPageContent />
    </Suspense>
  );
}
