"use client";

import { skills, siteConfig } from "@/data/projects";
import { resumeData, formatDateRange } from "@/data/resume";

const recentRoles = resumeData.experience.slice(0, 3).map((exp) => ({
  company: exp.company,
  title: exp.title,
  period: formatDateRange(exp.startDate, exp.endDate),
  highlights: exp.highlights.slice(0, 3),
}));

export default function Resume() {
  return (
    <section
      id="resume"
      className="relative min-h-screen bg-black overflow-hidden flex items-center py-24"
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.08) 2px, rgba(0,255,65,0.08) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-mono">
        {/* Section header — terminal style */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: "0 0 6px #00ff41" }} />
            <span className="text-[10px] text-lime-400/70 uppercase tracking-widest">
              Status: Open to Opportunities
            </span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
            style={{ color: "#39ff14", textShadow: "0 0 10px #39ff14" }}
          >
            Resume
          </h2>
          <p className="text-sm text-green-400/50 max-w-2xl leading-relaxed">
            Senior Full-Stack Engineer with 12+ years crafting scalable
            products. View the highlights or download the full PDF.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-6 items-start mb-10">
          {/* Left column: highlights */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="border border-green-400/20 bg-black p-5 space-y-4 relative">
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-green-400/40" aria-hidden="true" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-green-400/40" aria-hidden="true" />

              <div className="flex flex-col">
                <span
                  className="text-3xl font-black text-lime-400"
                  style={{ textShadow: "0 0 10px #39ff14" }}
                >
                  12+ years
                </span>
                <span className="text-xs text-green-400/40 mt-1">
                  // PROFESSIONAL_EXPERIENCE
                </span>
              </div>

              <div className="h-px bg-green-400/15" />

              <div>
                <p className="text-[10px] text-green-400/40 tracking-widest uppercase mb-1">
                  // CURRENT_TITLE
                </p>
                <p className="text-sm font-bold text-green-300">
                  Senior Full-Stack Engineer
                </p>
                <p className="text-xs text-green-400/40 mt-0.5">
                  {siteConfig.name}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="border border-green-400/20 bg-black p-5 relative">
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-green-400/40" aria-hidden="true" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-green-400/40" aria-hidden="true" />

              <p className="text-[10px] text-green-400/40 tracking-widest uppercase mb-3">
                // KEY_SKILLS
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider border border-green-400/15 bg-green-400/5 text-green-400/60 hover:border-green-400/40 hover:text-green-400 transition-all duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent roles */}
            <div className="border border-green-400/20 bg-black p-5 space-y-5 relative">
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-green-400/40" aria-hidden="true" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-green-400/40" aria-hidden="true" />

              <p className="text-[10px] text-green-400/40 tracking-widest uppercase">
                // RECENT_ROLES
              </p>
              {recentRoles.map((role) => (
                <div key={role.company} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className="text-sm font-bold text-lime-400"
                        style={{ textShadow: "0 0 6px #39ff14" }}
                      >
                        {role.company}
                      </p>
                      <p className="text-[11px] text-green-400/70">{role.title}</p>
                    </div>
                    <span className="text-[10px] text-green-400/30 whitespace-nowrap mt-0.5 tracking-wider">
                      {role.period}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {role.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-[11px] text-green-300/50"
                      >
                        <span className="text-green-400/60 mt-0.5 shrink-0">
                          &gt;
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: PDF preview */}
          <div className="border border-green-400/20 bg-black overflow-hidden relative">
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-green-400/40 z-10" aria-hidden="true" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-green-400/40 z-10" aria-hidden="true" />

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-green-400/20 bg-black">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: "0 0 4px #00ff41" }} />
                <span className="text-xs text-green-400/50 font-mono">
                  resume.pdf
                </span>
              </div>
              <span className="text-[10px] text-green-400/30 tracking-wider">5 pages</span>
            </div>

            {/* iframe embed */}
            <div className="relative w-full" style={{ height: "600px" }}>
              <iframe
                src="/api/resume"
                title="Resume — Daniel Alejandro Dominguez Diaz"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/api/resume"
            download
            className="inline-flex items-center gap-3 px-6 py-3 font-mono text-sm tracking-widest border border-green-400/50 text-green-400 hover:border-green-400 hover:bg-green-400/10 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] transition-all duration-300"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span aria-hidden="true">[</span>
            Download PDF
            <span aria-hidden="true">]</span>
          </a>

          <a
            href="/ar?view=resume"
            data-testid="resume-ar-btn"
            className="inline-flex items-center gap-3 px-6 py-3 font-mono text-sm tracking-widest border border-green-400/25 text-green-400/70 hover:border-green-400/60 hover:text-green-400 hover:bg-green-400/5 transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-lime-400"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span aria-hidden="true">[</span>
            View in AR
            <span aria-hidden="true">]</span>
          </a>
        </div>
      </div>
    </section>
  );
}
