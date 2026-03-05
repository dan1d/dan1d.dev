"use client";

import { useState, useEffect, useRef } from "react";

const navLinks = [
  { label: "Projects", href: "#projects" },
  { label: "GitHub", href: "#github" },
  { label: "Resume", href: "#resume" },
  { label: "AR Experience", href: "#ar" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (progressRef.current) {
        progressRef.current.style.width = `${Math.min(progress, 100)}%`;
      }
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        updateProgress();
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-b border-green-400/15">
      <nav
        aria-label="Main Navigation"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between font-mono"
      >
        {/* Logo */}
        <a
          href="#"
          className="text-base font-bold tracking-tight"
          style={{ color: "#00ff41", textShadow: "0 0 8px #00ff41" }}
        >
          dan1d
        </a>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-6" role="list">
          {navLinks.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                className="text-xs text-green-400/50 hover:text-green-400 transition-colors duration-200 tracking-wider uppercase"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-4">
          <a
            href="#ar"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono tracking-widest border border-green-400/40 text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-all duration-200"
          >
            View in AR
          </a>

          {/* Hamburger */}
          <button
            type="button"
            aria-label="Toggle mobile menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <span className="block w-5 h-0.5 bg-green-400/70 transition-transform duration-200" />
            <span className="block w-5 h-0.5 bg-green-400/70 transition-opacity duration-200" />
            <span className="block w-5 h-0.5 bg-green-400/70 transition-transform duration-200" />
          </button>
        </div>
      </nav>

      {/* Scroll progress bar */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden"
      >
        <div
          ref={progressRef}
          className="h-full w-0 origin-left"
          style={{
            background: "linear-gradient(to right, #00ff41, #39ff14)",
            willChange: "width",
          }}
        />
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 border-t border-green-400/15 px-4 pb-4 font-mono">
          <ul className="flex flex-col gap-4 pt-4" role="list">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-xs text-green-400/50 hover:text-green-400 transition-colors duration-200 block uppercase tracking-wider"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#ar"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs tracking-widest border border-green-400/40 text-green-400"
              >
                View in AR
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
