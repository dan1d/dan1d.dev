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
    updateProgress(); // Set initial value

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <nav
        aria-label="Main Navigation"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <a
          href="#"
          className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-tight"
        >
          dan1d
        </a>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                className="text-sm text-white/70 hover:text-white transition-colors duration-200"
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
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 transition-opacity duration-200"
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
            <span className="block w-5 h-0.5 bg-white transition-transform duration-200" />
            <span className="block w-5 h-0.5 bg-white transition-opacity duration-200" />
            <span className="block w-5 h-0.5 bg-white transition-transform duration-200" />
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
            background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
            willChange: "width",
          }}
        />
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-4 pb-4">
          <ul className="flex flex-col gap-4 pt-4" role="list">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-white/70 hover:text-white transition-colors duration-200 block"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#ar"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
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
