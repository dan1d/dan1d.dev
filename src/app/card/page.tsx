"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { siteConfig, socialLinks, skills } from "@/data/projects";

// ─── 3D Background (SSR-off) ─────────────────────────────────────────────────
const CardScene = dynamic(() => import("@/components/three/CardScene"), {
  ssr: false,
  loading: () => <div data-testid="card-canvas" className="absolute inset-0" />,
});

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_URL = "https://dan1d.dev/card";
const displaySkills = skills.slice(0, 10);
const RAIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>{}[]|/\\~";

// ─── Typing animation hook ──────────────────────────────────────────────────
function useTypingEffect(text: string, speed = 45, delay = 0, startTyping = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!startTyping) return;
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
  }, [text, speed, delay, startTyping]);

  return { displayed, done };
}

// ─── Glitch text component ──────────────────────────────────────────────────
function GlitchText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`relative inline-block ${className ?? ""}`} style={style}>
      <span className="relative z-10">{text}</span>
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 z-20 opacity-0"
        style={{
          animation: "glitch-1 4s infinite linear",
          color: "#ff00ff",
          clipPath: "inset(0 0 65% 0)",
        }}
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 z-20 opacity-0"
        style={{
          animation: "glitch-2 4s infinite linear",
          color: "#00ffff",
          clipPath: "inset(35% 0 0 0)",
        }}
      >
        {text}
      </span>
    </span>
  );
}

// ─── Full-screen Matrix rain canvas ─────────────────────────────────────────
function FullScreenMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 14;
    const columns = Math.floor(window.innerWidth / fontSize);
    const drops: number[] = new Array(columns).fill(0).map(() => Math.random() * -100);

    let animFrame: number;

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        if (drops[i] < 0) {
          drops[i] += 0.5;
          continue;
        }
        const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
        const y = drops[i] * fontSize;

        const alpha = y > window.innerHeight - fontSize * 3 ? 0.08 : 0.2;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.fillText(char, i * fontSize, y);

        if (Math.random() > 0.9) {
          ctx.fillStyle = "rgba(57, 255, 20, 0.7)";
          ctx.fillText(char, i * fontSize, y);
        }

        if (y > window.innerHeight && Math.random() > 0.975) {
          drops[i] = Math.random() * -30;
        }
        drops[i] += 0.3 + Math.random() * 0.3;
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-50"
      aria-hidden="true"
    />
  );
}

// ─── Mini card rain overlay ─────────────────────────────────────────────────
function CardMatrixRain({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const fontSize = 10;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(0).map(() => Math.random() * -50);

    let animFrame: number;

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        if (drops[i] < 0) {
          drops[i] += 0.3;
          continue;
        }
        const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
        const y = drops[i] * fontSize;

        const alpha = y > height - fontSize * 3 ? 0.15 : 0.4;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.fillText(char, i * fontSize, y);

        if (Math.random() > 0.85) {
          ctx.fillStyle = "rgba(57, 255, 20, 0.9)";
          ctx.fillText(char, i * fontSize, y);
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
        }
        drops[i] += 0.4 + Math.random() * 0.2;
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animFrame);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="absolute inset-0 pointer-events-none opacity-40"
      aria-hidden="true"
    />
  );
}

// ─── Download progress button ───────────────────────────────────────────────
function DownloadButton() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("SAVE_CONTACT");

  const handleClick = useCallback(() => {
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    setStatusText("CONNECTING...");

    const steps = [
      { at: 10, text: "ESTABLISHING SECURE LINK..." },
      { at: 25, text: "DECRYPTING VCARD..." },
      { at: 40, text: "BYPASSING FIREWALL..." },
      { at: 55, text: "DOWNLOADING CONTACT..." },
      { at: 70, text: "VERIFYING CHECKSUM..." },
      { at: 85, text: "INJECTING PAYLOAD..." },
      { at: 95, text: "FINALIZING..." },
      { at: 100, text: "COMPLETE" },
    ];

    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 6 + 1.5;
      if (p > 100) p = 100;
      setProgress(p);

      const step = [...steps].reverse().find((s) => p >= s.at);
      if (step) setStatusText(step.text);

      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const vcard = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            `FN:${siteConfig.name}`,
            `N:Dominguez Diaz;Daniel Alejandro;;;`,
            `TITLE:${siteConfig.title}`,
            "EMAIL;TYPE=INTERNET:danielfromarg@gmail.com",
            `URL;TYPE=Portfolio:${siteConfig.url}`,
            "URL;TYPE=Project:https://cobroya.app",
            "END:VCARD",
          ].join("\r\n");

          const blob = new Blob([vcard], { type: "text/vcard" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "dan1d.vcf";
          a.click();
          URL.revokeObjectURL(url);

          setTimeout(() => {
            setDownloading(false);
            setProgress(0);
            setStatusText("SAVE_CONTACT");
          }, 1500);
        }, 400);
      }
    }, 80);
  }, [downloading]);

  return (
    <button
      type="button"
      data-testid="save-contact-btn"
      onClick={handleClick}
      className="relative flex-1 overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs tracking-widest border border-green-400/50 text-green-400 hover:border-green-400 hover:shadow-[0_0_30px_rgba(0,255,65,0.25)] transition-all duration-300 group"
    >
      {downloading && (
        <div
          className="absolute inset-0 bg-green-400/10 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {downloading ? (
          <>
            <span className="inline-block w-3 h-3 border border-green-400/60 border-t-green-400 rounded-full animate-spin" />
            <span className="text-[10px]">{statusText}</span>
            <span className="text-[10px] text-green-400/50">{Math.round(progress)}%</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span aria-hidden="true">[</span>
            {statusText}
            <span aria-hidden="true">]</span>
          </>
        )}
      </span>
    </button>
  );
}

// ─── Social icon SVGs ───────────────────────────────────────────────────────
const icons: Record<string, React.ReactNode> = {
  GitHub: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  ),
  LinkedIn: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Email: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
};

// ─── Hex ID generator ───────────────────────────────────────────────────────
function useHexId() {
  const [hexId, setHexId] = useState("0xD4N1D00000");
  useEffect(() => {
    const hex = "0x" + Array.from({ length: 10 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
    setHexId(hex);
  }, []);
  return hexId;
}

// ─── Floating data particles ────────────────────────────────────────────────
// Deterministic pseudo-random to avoid SSR hydration mismatch
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}
const r2 = (n: number) => Math.round(n * 100) / 100;

const CARD_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: r2(seededRandom(i * 5 + 1) * 100),
  y: r2(seededRandom(i * 5 + 2) * 100),
  delay: r2(seededRandom(i * 5 + 3) * 5),
  duration: r2(3 + seededRandom(i * 5 + 4) * 4),
  size: r2(1 + seededRandom(i * 5 + 5) * 2.5),
}));

function DataParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {CARD_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-green-400"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0,
            animation: `float-particle ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Scrolling data streams on card edges ───────────────────────────────────
function DataStreams() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Left edge data stream */}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={`l-${i}`}
          className="absolute left-1 text-[7px] text-green-400/15 font-mono"
          style={{
            top: `${i * 18}%`,
            animation: `data-stream ${3 + i * 0.5}s ${i * 0.8}s infinite linear`,
            writingMode: "vertical-rl",
          }}
        >
          {Array.from({ length: 8 }, (_, j) => RAIN_CHARS[(i * 8 + j * 7 + 3) % RAIN_CHARS.length]).join("")}
        </div>
      ))}
      {/* Right edge data stream */}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={`r-${i}`}
          className="absolute right-1 text-[7px] text-green-400/15 font-mono"
          style={{
            top: `${i * 18}%`,
            animation: `data-stream ${4 + i * 0.3}s ${i * 0.6}s infinite linear`,
            writingMode: "vertical-rl",
          }}
        >
          {Array.from({ length: 8 }, (_, j) => RAIN_CHARS[(i * 11 + j * 5 + 17) % RAIN_CHARS.length]).join("")}
        </div>
      ))}
    </div>
  );
}

// ─── Classified stamp overlay ───────────────────────────────────────────────
function ClassifiedStamp() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute top-12 right-6 rotate-[-12deg] pointer-events-none z-40 select-none"
      style={{ animation: "stamp-in 0.3s ease-out forwards" }}
      aria-hidden="true"
    >
      <div className="border-2 border-red-500/40 px-3 py-1 text-red-500/30 text-[10px] tracking-[0.4em] font-bold">
        CLASSIFIED
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CardPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [cardDimensions, setCardDimensions] = useState({ w: 480, h: 700 });

  const hexId = useHexId();
  const title = useTypingEffect(`> ${siteConfig.title}`, 40, 600, mounted);
  const accessLine = useTypingEffect("ACCESS GRANTED // CLEARANCE: OMEGA", 25, 1800, mounted);
  const systemLine = useTypingEffect("SYSTEM: DOSSIER DECRYPTED // IDENTITY CONFIRMED", 20, 3200, mounted);

  // ── Mount trigger ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  // ── 3D Holographic tilt on mouse ────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardInnerRef.current;
    const glow = glowRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    if (glow) {
      glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 255, 65, 0.2) 0%, transparent 60%)`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardInnerRef.current;
    const glow = glowRef.current;
    if (card) {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      card.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
      setTimeout(() => { if (card) card.style.transition = ""; }, 600);
    }
    if (glow) {
      glow.style.background = "transparent";
    }
  }, []);

  // ── Measure card for rain canvas ────────────────────────────────────────
  useEffect(() => {
    const card = cardInnerRef.current;
    if (!card) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCardDimensions({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes glitch-1 {
          0%, 92% { opacity: 0; transform: translate(0); }
          92.5% { opacity: 0.7; transform: translate(2px, -1px); }
          93% { opacity: 0; transform: translate(-1px, 2px); }
          93.5% { opacity: 0.5; transform: translate(1px, 1px); }
          94% { opacity: 0; transform: translate(0); }
          96% { opacity: 0; transform: translate(0); }
          96.5% { opacity: 0.8; transform: translate(-2px, -1px); }
          97% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes glitch-2 {
          0%, 94% { opacity: 0; transform: translate(0); }
          94.5% { opacity: 0.6; transform: translate(-2px, 1px); }
          95% { opacity: 0; transform: translate(1px, -2px); }
          95.5% { opacity: 0.4; transform: translate(-1px, -1px); }
          96% { opacity: 0; transform: translate(0); }
          98% { opacity: 0; transform: translate(0); }
          98.5% { opacity: 0.7; transform: translate(2px, 1px); }
          99% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes scanline-move {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(0, 255, 65, 0.2); box-shadow: 0 0 0 rgba(0, 255, 65, 0); }
          50% { border-color: rgba(0, 255, 65, 0.45); box-shadow: 0 0 40px rgba(0, 255, 65, 0.1); }
        }
        @keyframes float-particle {
          0%, 100% { opacity: 0; transform: translateY(0); }
          25% { opacity: 0.6; }
          50% { opacity: 0.3; transform: translateY(-20px); }
          75% { opacity: 0.5; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes holo-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes data-stream {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes card-entrance {
          0% { opacity: 0; transform: translateY(60px) scale(0.9) rotateX(15deg); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
        }
        @keyframes nav-entrance {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes stamp-in {
          0% { opacity: 0; transform: rotate(-12deg) scale(2); }
          60% { opacity: 0.8; transform: rotate(-12deg) scale(0.95); }
          100% { opacity: 1; transform: rotate(-12deg) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.6; }
          94% { opacity: 1; }
          96% { opacity: 0.8; }
          97% { opacity: 1; }
        }
      `}</style>

      <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden font-mono">
        {/* Full-screen matrix rain */}
        <FullScreenMatrixRain />

        {/* Dark vignette overlay */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
        </div>

        {/* Ambient green glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-green-500/[0.04] rounded-full blur-[150px]"
            style={{ animation: "pulse-glow 6s infinite ease-in-out" }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-[100px]" />
        </div>

        {/* Global CRT scanlines */}
        <div
          className="pointer-events-none absolute inset-0 z-50 opacity-[0.02]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.08) 2px, rgba(0,255,65,0.08) 4px)",
          }}
          aria-hidden="true"
        />

        {/* ── Top navigation bar ──────────────────────────────────────────── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
          style={{ animation: "nav-entrance 0.8s 0.3s ease-out both" }}
        >
          <a
            href="/"
            className="group flex items-center gap-2 px-3 py-1.5 border border-green-400/30 bg-black/60 backdrop-blur-sm text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-all duration-300 text-xs tracking-widest"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </a>
          <div className="text-[9px] text-green-400/25 tracking-[0.3em]">
            MATRIX.PROTOCOL.v3.1
          </div>
        </nav>

        {/* ── Two-column layout: Spoon left, Card right ───────────────────── */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-7xl mx-auto px-4 py-20">
          {/* Left: 3D Spoon Scene */}
          <div className="hidden lg:block relative w-1/2 h-[600px]" style={{ animation: "card-entrance 1.2s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            <CardScene />
            {/* "There is no spoon" quote */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-[11px] text-green-400/40 tracking-[0.2em] italic">
                &ldquo;There is no spoon.&rdquo;
              </p>
              <p className="text-[9px] text-green-400/20 tracking-[0.3em] mt-1">
                &mdash; SPOON BOY
              </p>
            </div>
          </div>

          {/* Right: Card content */}
          <main className="relative w-full lg:w-1/2 max-w-[500px] mx-auto lg:mx-0 lg:pl-8">
          {/* Terminal header above card */}
          <div
            className="mb-6 text-center"
            style={{ animation: "nav-entrance 0.6s 0.5s ease-out both" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px flex-1 bg-green-400/20" />
              <span className="text-green-400/30 text-[10px] tracking-[0.3em]">
                // IDENTITY_DOSSIER.exe
              </span>
              <span className="h-px flex-1 bg-green-400/20" />
            </div>
            <p className="text-[10px] text-green-400/25 tracking-[0.2em]">
              CLASSIFIED PERSONNEL FILE &mdash; AUTHORIZED ACCESS ONLY
            </p>
          </div>

          {/* Card container with perspective */}
          <div className="flex justify-center" style={{ perspective: "1200px" }}>
            <div
              ref={cardRef}
              className="relative w-full"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transformStyle: "preserve-3d",
                animation: "card-entrance 1.2s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              {/* Holographic card */}
              <div
                ref={cardInnerRef}
                className="relative border border-green-400/20 bg-black/90 backdrop-blur-md overflow-hidden"
                style={{
                  transition: "transform 0.1s ease-out",
                  transformStyle: "preserve-3d",
                  animation: "pulse-border 4s infinite ease-in-out, flicker 8s infinite",
                }}
              >
                {/* Matrix rain overlay on card */}
                <CardMatrixRain width={cardDimensions.w} height={cardDimensions.h} />

                {/* Moving scanline */}
                <div className="absolute inset-0 pointer-events-none z-30" aria-hidden="true">
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400/25 to-transparent"
                    style={{ animation: "scanline-move 3.5s linear infinite" }}
                  />
                </div>

                {/* Second scanline (slower, dimmer) */}
                <div className="absolute inset-0 pointer-events-none z-30" aria-hidden="true">
                  <div
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-400/10 to-transparent"
                    style={{ animation: "scanline-move 7s 2s linear infinite" }}
                  />
                </div>

                {/* Holographic shimmer */}
                <div
                  className="absolute inset-0 pointer-events-none z-20 opacity-[0.08]"
                  style={{
                    background: "linear-gradient(105deg, transparent 30%, rgba(0,255,65,0.3) 45%, transparent 55%, rgba(57,255,20,0.2) 70%, transparent 80%)",
                    backgroundSize: "200% 100%",
                    animation: "holo-shimmer 5s linear infinite",
                  }}
                  aria-hidden="true"
                />

                {/* Mouse-follow glow */}
                <div
                  ref={glowRef}
                  className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
                  aria-hidden="true"
                />

                {/* Data particles */}
                <DataParticles />

                {/* Edge data streams */}
                <DataStreams />

                {/* Classified stamp */}
                <ClassifiedStamp />

                {/* CRT scanlines on card */}
                <div
                  className="absolute inset-0 pointer-events-none z-30 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,65,0.1) 1px, rgba(0,255,65,0.1) 2px)",
                  }}
                  aria-hidden="true"
                />

                {/* Corner brackets */}
                {[
                  "top-3 left-3 border-t border-l",
                  "top-3 right-3 border-t border-r",
                  "bottom-3 left-3 border-b border-l",
                  "bottom-3 right-3 border-b border-r",
                ].map((classes, i) => (
                  <div
                    key={i}
                    className={`absolute w-6 h-6 ${classes} border-green-400/40 z-30`}
                    aria-hidden="true"
                  />
                ))}

                {/* ── Card Content ──────────────────────────────────────── */}
                <div className="relative z-10 p-8 sm:p-10 pt-7 flex flex-col items-center gap-5">
                  {/* Top bar -- hex id + status */}
                  <div className="w-full flex items-center justify-between text-[9px] tracking-widest text-green-400/30">
                    <span>{hexId}</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ animation: "blink 2s infinite", boxShadow: "0 0 8px #00ff41" }}
                      />
                      ACTIVE
                    </span>
                  </div>

                  {/* Avatar -- faceless hacker */}
                  <div className="relative group">
                    <div
                      className="w-32 h-32 border border-green-400/30 relative overflow-hidden"
                      style={{
                        boxShadow: "0 0 40px rgba(0,255,65,0.12), inset 0 0 40px rgba(0,255,65,0.05)",
                      }}
                    >
                      <img
                        src="/faceless.png"
                        alt={siteConfig.name}
                        className="w-full h-full object-cover"
                        style={{ filter: "brightness(0.9) contrast(1.1)" }}
                      />
                      {/* Scanline overlay on avatar */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.15) 2px, rgba(0,255,65,0.15) 3px)",
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    {/* Avatar corner ticks */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t border-l border-green-400/50" aria-hidden="true" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t border-r border-green-400/50" aria-hidden="true" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b border-l border-green-400/50" aria-hidden="true" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b border-r border-green-400/50" aria-hidden="true" />
                  </div>

                  {/* Name with glitch */}
                  <div className="text-center space-y-2">
                    <h1
                      className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight"
                      style={{ color: "#39ff14", textShadow: "0 0 15px rgba(57,255,20,0.5)" }}
                    >
                      <GlitchText text={siteConfig.name} />
                    </h1>
                    <p className="text-[11px] text-green-400/50 tracking-wider">
                      @{siteConfig.handle}
                    </p>
                  </div>

                  {/* Terminal typing title */}
                  <div className="w-full bg-green-400/[0.04] border border-green-400/10 px-4 py-3">
                    <p className="text-xs text-green-400/80 tracking-wider">
                      {title.displayed}
                      {!title.done && (
                        <span
                          className="inline-block w-[6px] h-[14px] bg-green-400/80 ml-0.5 align-middle"
                          style={{ animation: "blink 1s step-end infinite" }}
                        />
                      )}
                    </p>
                    {title.done && (
                      <p className="text-[10px] text-green-400/30 tracking-wider mt-1.5">
                        {accessLine.displayed}
                        {!accessLine.done && (
                          <span
                            className="inline-block w-[5px] h-[12px] bg-green-400/50 ml-0.5 align-middle"
                            style={{ animation: "blink 1s step-end infinite" }}
                          />
                        )}
                      </p>
                    )}
                    {accessLine.done && (
                      <p className="text-[9px] text-green-400/20 tracking-wider mt-1">
                        {systemLine.displayed}
                        {!systemLine.done && (
                          <span
                            className="inline-block w-[4px] h-[10px] bg-green-400/30 ml-0.5 align-middle"
                            style={{ animation: "blink 1s step-end infinite" }}
                          />
                        )}
                      </p>
                    )}
                  </div>

                  {/* Divider -- NETWORK */}
                  <div className="w-full flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                    <span className="text-[9px] text-green-400/25 tracking-[0.3em]">NETWORK</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                  </div>

                  {/* Social links -- all 4 */}
                  <div className="flex items-center gap-3">
                    {socialLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        aria-label={link.name}
                        target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                        rel={link.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                        className="relative p-3 border border-green-400/20 text-green-400/50 hover:text-green-400 hover:border-green-400/60 hover:bg-green-400/10 hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all duration-300 group/link"
                      >
                        {icons[link.name] ?? icons.GitHub}
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-green-400/0 group-hover/link:text-green-400/50 transition-colors whitespace-nowrap tracking-wider">
                          {link.name.toUpperCase()}
                        </span>
                      </a>
                    ))}
                  </div>

                  {/* Divider -- STACK */}
                  <div className="w-full flex items-center gap-3 mt-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                    <span className="text-[9px] text-green-400/25 tracking-[0.3em]">STACK</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                  </div>

                  {/* Skills grid */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {displaySkills.map((skill, i) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-[9px] tracking-wider text-green-400/40 border border-green-400/10 hover:border-green-400/30 hover:text-green-400/70 transition-all duration-300 cursor-default"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Divider -- SCAN */}
                  <div className="w-full flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                    <span className="text-[9px] text-green-400/25 tracking-[0.3em]">SCAN</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-2.5">
                    <div
                      className="relative p-3 border border-green-400/15 bg-black"
                      style={{ boxShadow: "0 0 25px rgba(0,255,65,0.06)" }}
                    >
                      <QRCodeSVG
                        value={CARD_URL}
                        size={120}
                        data-testid="card-qr"
                        bgColor="#000000"
                        fgColor="#00ff41"
                        level="M"
                        includeMargin={false}
                      />
                      {/* QR corner accents */}
                      <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t border-l border-green-400/40" aria-hidden="true" />
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t border-r border-green-400/40" aria-hidden="true" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b border-l border-green-400/40" aria-hidden="true" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b border-r border-green-400/40" aria-hidden="true" />
                    </div>
                    <p className="text-[9px] text-green-400/25 tracking-[0.2em]">{CARD_URL}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full mt-1">
                    <DownloadButton />
                    <a
                      href="/"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs tracking-widest border border-green-400/25 text-green-400/60 hover:border-green-400/50 hover:text-green-400 hover:bg-green-400/5 hover:shadow-[0_0_20px_rgba(0,255,65,0.1)] transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span aria-hidden="true">[</span>
                      VIEW_PORTFOLIO
                      <span aria-hidden="true">]</span>
                    </a>
                  </div>

                  {/* Bottom metadata bar */}
                  <div className="w-full flex items-center justify-between text-[8px] tracking-widest text-green-400/20 pt-2 border-t border-green-400/5">
                    <span>MATRIX.PROTOCOL.v3.1</span>
                    <span>{siteConfig.url.replace("https://", "")}</span>
                  </div>
                </div>
              </div>

              {/* Card reflection/shadow */}
              <div
                className="absolute -bottom-6 left-4 right-4 h-12 bg-gradient-to-b from-green-400/[0.04] to-transparent blur-xl"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Bottom terminal prompt */}
          <div
            className="mt-8 text-center"
            style={{ animation: "nav-entrance 0.6s 1.5s ease-out both" }}
          >
            <p className="text-[10px] text-green-400/20 tracking-[0.15em]">
              <span className="text-green-400/10">$</span> cat /sys/matrix/node/{siteConfig.handle}/identity.dat
            </p>
          </div>
        </main>
        </div>
      </div>
    </>
  );
}
