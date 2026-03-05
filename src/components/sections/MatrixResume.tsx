"use client";

import { useState, useEffect, useRef } from "react";
import MatrixResumeScene from "@/components/three/MatrixResumeScene";

// ─── Typing animation hook ──────────────────────────────────────────────────

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

// ─── MatrixResume Section ───────────────────────────────────────────────────

export default function MatrixResume() {
  const [decryptStatus, setDecryptStatus] = useState("IN_PROGRESS");
  const [flickerVisible, setFlickerVisible] = useState(true);
  const [timestamp, setTimestamp] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const canvasCardRef = useRef<HTMLDivElement>(null);

  // Typing effects
  const cmd = useTypingEffect("> DECODING IDENTITY...", 45, 200);
  const subCmd = useTypingEffect(
    "[MORPHEUS.exe] What if I told you... your resume is just code?",
    30,
    1400
  );

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimestamp(now.toISOString().replace("T", " ").slice(0, 19));
    };
    tick();
    const id = setInterval(tick, 1000);
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

  // Transition decrypt status after decode completes (~10s)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDecryptStatus("COMPLETE");
    }, 10000);
    return () => clearTimeout(timeout);
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
      id="resume"
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
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-lime-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,65,0.03)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* ── Header ── */}
        <div ref={headerRef} className="mb-10">
          {/* Hidden heading for accessibility */}
          <h2 className="sr-only">Matrix Resume</h2>

          {/* Terminal command line */}
          <div className="font-mono mb-3">
            <span
              className="text-green-400 text-lg sm:text-xl tracking-tight"
              style={{
                textShadow: "0 0 10px #00ff41",
                opacity: flickerVisible ? 1 : 0.85,
              }}
            >
              {cmd.displayed}
              {!cmd.done && (
                <span className="inline-block w-2 h-4 bg-green-400 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
          </div>

          {/* Sub-header */}
          <div className="font-mono text-sm text-green-400/70 mb-8 h-5">
            {subCmd.displayed}
            {!subCmd.done && subCmd.displayed.length > 0 && (
              <span className="inline-block w-1.5 h-3.5 bg-green-400/60 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* ── Canvas Card ── */}
        <div
          ref={canvasCardRef}
          className="relative border border-green-400/20 bg-black/80 overflow-hidden w-full"
          style={{
            minHeight: "600px",
            height: "clamp(600px, 70vh, 800px)",
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
          <div
            className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-green-400/70 z-10"
            aria-hidden="true"
          />
          <div
            className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-green-400/70 z-10"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-lime-400/60 z-10"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-lime-400/60 z-10"
            aria-hidden="true"
          />

          {/* ── HUD: Top-left ── */}
          <div
            className="absolute top-5 left-14 z-10 flex items-center gap-2 font-mono"
            aria-hidden="true"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                decryptStatus === "COMPLETE"
                  ? "bg-lime-400"
                  : "bg-green-400 animate-pulse"
              }`}
              style={{ boxShadow: "0 0 6px #00ff41" }}
            />
            <span
              className="text-green-400 text-xs tracking-widest"
              style={{ textShadow: "0 0 6px #00ff41" }}
            >
              DECRYPT: {decryptStatus}
            </span>
            <span className="text-green-400/50 text-xs">{timestamp}</span>
          </div>

          {/* ── HUD: Top-right ── */}
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

          {/* ── HUD: Bottom-left ── */}
          <div
            className="absolute bottom-5 left-14 z-10 font-mono"
            aria-hidden="true"
          >
            <a
              href="/resume.pdf"
              download
              className="text-green-400/60 text-xs tracking-wider hover:text-green-400 transition-colors duration-200"
            >
              [VIEW_SOURCE] &rarr; /resume.pdf
            </a>
          </div>

          {/* ── HUD: Bottom-right ── */}
          <div
            className="absolute bottom-5 right-14 z-10 font-mono"
            aria-hidden="true"
          >
            <a
              href="/ar?view=resume"
              className="text-green-400/60 text-xs tracking-wider hover:text-green-400 transition-colors duration-200"
            >
              [ENTER_THE_MATRIX] &rarr; /ar?view=resume
            </a>
          </div>

          {/* ── Canvas scene ── */}
          <div className="absolute inset-0 z-[1]">
            <MatrixResumeScene autoPlay decodeDelay={2000} />
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
          {/* Download Resume */}
          <a
            href="/resume.pdf"
            download
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-green-400/50 bg-black font-mono text-xs text-green-400 tracking-widest transition-all duration-200 hover:border-green-400 hover:bg-green-400/10 hover:text-lime-300"
            style={{ textShadow: "0 0 6px #00ff41" }}
          >
            <span className="text-green-400/50 group-hover:text-green-400">
              [
            </span>
            DOWNLOAD_SOURCE
            <span className="text-green-400/50 group-hover:text-green-400">
              ]
            </span>
            <span className="text-green-400/40 ml-1">resume.pdf</span>
          </a>

          {/* Enter the Matrix */}
          <a
            href="/ar?view=resume"
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-green-400/30 bg-black font-mono text-xs text-green-400/70 tracking-widest transition-all duration-200 hover:border-green-400/60 hover:bg-green-400/5 hover:text-green-400"
          >
            <span className="text-green-400/40 group-hover:text-green-400/60">
              [
            </span>
            ENTER_THE_MATRIX
            <span className="text-green-400/40 group-hover:text-green-400/60">
              ]
            </span>
            <span className="text-green-400/40 ml-1">/ar?view=resume</span>
          </a>

          {/* View CodePrism */}
          <a
            href="https://codeprism.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-green-400/30 bg-black font-mono text-xs text-green-400/70 tracking-widest transition-all duration-200 hover:border-green-400/60 hover:bg-green-400/5 hover:text-green-400"
          >
            <span className="text-green-400/40 group-hover:text-green-400/60">
              [
            </span>
            ACTIVE_PROJECT
            <span className="text-green-400/40 group-hover:text-green-400/60">
              ]
            </span>
            <span className="text-green-400/40 ml-1">codeprism.dev</span>
          </a>
        </div>
      </div>
    </section>
  );
}
