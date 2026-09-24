"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { IntroPhase } from "@/components/three/MatrixCorridorScene";

// ─── Visibility hook — unmount WebGL when offscreen to free GPU context ───────

function useCanvasVisibility(rootMargin = "200px") {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true); // hero starts visible
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
import { siteConfig } from "@/data/projects";
import { useOnboarding } from "@/context/OnboardingContext";

const MatrixCorridorScene = dynamic(
  () => import("@/components/three/MatrixCorridorScene"),
  {
    ssr: false,
    loading: () => (
      <div data-testid="hero-canvas" className="absolute inset-0 bg-black" />
    ),
  }
);

// ─── "Wake up, dan1d..." typing overlay ──────────────────────────────────────
// Driven by the camera's phase, not a wall-clock timer: it starts typing on
// the "wake" beat and is cut (not faded) on the "glitch" beat, so the text
// dies on the same frame the picture stutters.

function WakeUpText({ phase }: { phase: IntroPhase }) {
  const fullText = "Wake up, dan1d...";
  const [displayed, setDisplayed] = useState("");
  const [state, setState] = useState<"idle" | "typing" | "hold" | "cut" | "gone">("idle");
  const startedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start typing once, on the "wake" beat. The interval lives in a ref so a
  // re-render (state change) doesn't tear it down mid-word.
  useEffect(() => {
    if (phase !== "wake" || startedRef.current) return;
    startedRef.current = true;
    setState("typing");
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setState("hold");
      }
    }, 60);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Cut on "glitch" (or anything after it, in case a phase was skipped)
  useEffect(() => {
    if (state === "cut" || state === "gone" || state === "idle") return;
    if (phase === "glitch" || phase === "push" || phase === "settled") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setState("cut");
    }
  }, [phase, state]);

  // Once cut, unmount after the stutter transition has played
  useEffect(() => {
    if (state !== "cut") return;
    const id = setTimeout(() => setState("gone"), 220);
    return () => clearTimeout(id);
  }, [state]);

  // Safety: if the glitch beat never arrives, fade out on our own
  useEffect(() => {
    if (state !== "hold") return;
    const id = setTimeout(() => setState("cut"), 4000);
    return () => clearTimeout(id);
  }, [state]);

  if (state === "idle" || state === "gone") return null;

  const cut = state === "cut";
  return (
    <div
      className="absolute inset-0 z-[8] flex items-center justify-center pointer-events-none"
      style={{
        opacity: cut ? 0 : 1,
        transform: cut ? "translateX(6px) skewX(-8deg)" : "none",
        transition: cut ? "opacity 120ms steps(2), transform 120ms steps(2)" : "none",
      }}
    >
      <p
        className="font-mono text-lg md:text-2xl tracking-wider"
        style={{
          color: "#00ff41",
          textShadow: "0 0 10px #00ff41, 0 0 30px #00ff4160",
        }}
      >
        {displayed}
        <span className="animate-pulse">_</span>
      </p>
    </div>
  );
}

// ─── Glitch flash — a two-hit white-green flash on the stutter beat ──────────
// Rendered only while the camera is in its glitch beat; the CSS animation
// carries the two hits and ends transparent, so no timers are needed.

function GlitchFlash({ phase }: { phase: IntroPhase }) {
  if (phase !== "glitch") return null;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-[9] pointer-events-none glitch-flash"
      style={{
        background:
          "linear-gradient(180deg, rgba(180,255,200,0.9) 0%, rgba(0,255,65,0.55) 45%, rgba(0,0,0,0) 46%, rgba(0,0,0,0) 62%, rgba(0,255,65,0.5) 63%, rgba(180,255,200,0.85) 100%)",
      }}
    />
  );
}

// ─── Letterbox — 2.39:1 bars during the shot, retract once it settles ───────

function Letterbox({ open }: { open: boolean }) {
  const bar =
    "absolute left-0 right-0 bg-black z-[9] pointer-events-none";
  const style = (edge: "top" | "bottom") => ({
    height: "11vh",
    transform: open
      ? `translateY(${edge === "top" ? "-100%" : "100%"})`
      : "translateY(0)",
    transition: "transform 1400ms cubic-bezier(0.77, 0, 0.175, 1)",
    transitionDelay: open ? "200ms" : "0ms",
  });
  return (
    <>
      <div aria-hidden="true" className={`${bar} top-0`} style={style("top")} />
      <div aria-hidden="true" className={`${bar} bottom-0`} style={style("bottom")} />
    </>
  );
}

// ─── Matrix Quotes ───────────────────────────────────────────────────────────

const MATRIX_QUOTES = [
  "Follow the white rabbit",
  "There is no spoon",
  "The Matrix has you",
  "Free your mind",
  "I know kung fu",
  "Welcome to the real world",
  "What is the Matrix?",
  "Ignorance is bliss",
  "Everything that has a beginning has an end",
  "The answer is out there",
  "Choice is an illusion",
  "Not all those who wander are lost",
];

function MatrixQuotes({ show }: { show: boolean }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "reveal" | "hold" | "dissolve" | "gap">("idle");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!show || phase !== "idle") return;
    const timer = setTimeout(() => setPhase("reveal"), 1800);
    return () => clearTimeout(timer);
  }, [show, phase]);

  useEffect(() => {
    if (phase === "idle") return;

    const quote = MATRIX_QUOTES[index];
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case "reveal": {
        if (visibleCount < quote.length) {
          timer = setTimeout(() => setVisibleCount((c) => c + 1), 40);
        } else {
          timer = setTimeout(() => setPhase("hold"), 100);
        }
        break;
      }
      case "hold":
        timer = setTimeout(() => {
          setPhase("dissolve");
          setVisibleCount(quote.length);
        }, 2500);
        break;
      case "dissolve": {
        if (visibleCount > 0) {
          timer = setTimeout(() => setVisibleCount((c) => c - 1), 30);
        } else {
          timer = setTimeout(() => {
            setIndex((i) => (i + 1) % MATRIX_QUOTES.length);
            setPhase("gap");
          }, 100);
        }
        break;
      }
      case "gap":
        timer = setTimeout(() => {
          setVisibleCount(0);
          setPhase("reveal");
        }, 800);
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, visibleCount, index]);

  if (phase === "idle") return null;

  const quote = MATRIX_QUOTES[index];

  return (
    <div className="h-6 flex items-center justify-center">
      <p className="font-mono text-xs md:text-sm tracking-[0.25em] uppercase whitespace-nowrap">
        {quote.split("").map((char, i) => (
          <span
            key={`${index}-${i}`}
            style={{
              color: "#00ff41",
              textShadow: "0 0 6px #00ff4150",
              opacity: i < visibleCount ? 0.6 : 0,
              transition: "opacity 120ms ease",
            }}
          >
            {char}
          </span>
        ))}
      </p>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export default function Hero() {
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("rain");
  const { ref: sectionVisRef, visible: canvasVisible } = useCanvasVisibility("0px");
  const { ready: onboardingReady } = useOnboarding();

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);
  const handlePhase = useCallback((p: IntroPhase) => setPhase(p), []);

  // Reveal UI elements after cinematic intro completes — film-title style:
  // the rule draws from the center, the title's tracking tightens into place
  useEffect(() => {
    if (!introComplete) return;

    let ctx: { revert: () => void } | null = null;

    const animate = async () => {
      try {
        const { default: gsap } = await import("gsap");

        ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          if (overlayRef.current) {
            tl.to(overlayRef.current, { opacity: 1, duration: 1.2 }, 0);
          }

          tl.fromTo(
              ruleRef.current,
              { scaleX: 0, opacity: 0 },
              { scaleX: 1, opacity: 1, duration: 1.1, ease: "power4.inOut" },
              0.35
            )
            .fromTo(
              subtitleRef.current,
              { opacity: 0, y: 14, letterSpacing: "0.55em" },
              { opacity: 1, y: 0, letterSpacing: "0.12em", duration: 1.5, ease: "power4.out" },
              0.55
            )
            .fromTo(
              descRef.current,
              { opacity: 0, y: 18 },
              { opacity: 1, y: 0, duration: 0.9 },
              1.5
            )
            .fromTo(
              ctaRef.current,
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.8 },
              1.9
            );
        });
      } catch {
        // GSAP not available — just show everything
        [subtitleRef, descRef, ctaRef].forEach((ref) => {
          if (ref.current) ref.current.style.opacity = "1";
        });
        if (ruleRef.current) ruleRef.current.style.opacity = "1";
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

  // Fallback: force intro complete after 16s (only starts counting after onboarding dismissed)
  useEffect(() => {
    if (!onboardingReady) return;
    const timeout = setTimeout(() => setIntroComplete(true), 16000);
    return () => clearTimeout(timeout);
  }, [onboardingReady]);

  return (
    <section
      id="hero"
      ref={sectionVisRef}
      data-intro-phase={phase}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* 3D Matrix corridor — waits for onboarding dismiss, unmounts when scrolled offscreen */}
      <div ref={canvasWrapperRef} className="absolute inset-0">
        {onboardingReady && canvasVisible ? (
          <MatrixCorridorScene onIntroComplete={handleIntroComplete} onPhase={handlePhase} />
        ) : (
          <div className="absolute inset-0 bg-black" data-testid="hero-canvas" />
        )}
      </div>

      {/* "Wake up, dan1d..." — typed on the wake beat, cut on the glitch beat */}
      <WakeUpText phase={phase} />

      {/* Two-hit flash on the glitch beat */}
      <GlitchFlash phase={phase} />

      {/* Darkening overlay for text readability (animated by GSAP on intro complete) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none z-[5] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.30) 20%, rgba(0,0,0,0.78) 100%)",
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

      {/* Film grain */}
      <div className="film-grain z-[6]" aria-hidden="true" />

      {/* Hero content — always in DOM (for tests), animated visible after intro */}
      <div className="absolute inset-0 z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Rotating Matrix quotes — upper area */}
        <div className="mt-[15vh] md:mt-[13vh]">
          <MatrixQuotes show={introComplete} />
        </div>

        {/* Title block — bottom third, film-title reveal */}
        <div className="mt-auto mb-[10vh] md:mb-[9vh] flex flex-col items-center">
          <div
            ref={ruleRef}
            className="w-40 md:w-64 h-px mb-5 opacity-0 origin-center"
            style={{
              background:
                "linear-gradient(90deg, transparent, #00ff41 30%, #00ff41 70%, transparent)",
              boxShadow: "0 0 8px #00ff4180",
            }}
            aria-hidden="true"
          />

          <p
            ref={subtitleRef}
            className="text-xl md:text-3xl font-mono uppercase mb-4 opacity-0"
            style={{ color: "#39ff14", textShadow: "0 0 8px #39ff14", letterSpacing: "0.12em" }}
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
            href="/ar"
            aria-label="Try 3D Experience"
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

      {/* Letterbox bars — cinema aspect during the shot, retract when it settles */}
      <Letterbox open={introComplete} />

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
