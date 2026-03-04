"use client";

import { skills, siteConfig } from "@/data/projects";

const recentRoles = [
  {
    company: "Acima Credit",
    title: "Sr Software Engineer",
    period: "2022 – 2024",
    highlights: [
      "Led Ruby on Rails + React platform serving 1M+ users",
      "Architected microservices reducing latency by 40%",
      "Mentored team of 6 engineers across 3 squads",
    ],
  },
  {
    company: "2U",
    title: "Sr Software Engineer",
    period: "2020 – 2022",
    highlights: [
      "Built edtech platform used by 100k+ learners globally",
      "Implemented GraphQL API layer with TypeScript",
      "Improved CI/CD pipelines cutting deploy time by 60%",
    ],
  },
];

export default function Resume() {
  return (
    <section
      id="resume"
      className="relative min-h-screen bg-black overflow-hidden flex items-center py-24"
    >
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.03)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest text-purple-400 uppercase mb-4 px-3 py-1 rounded-full border border-purple-400/30 bg-purple-400/5">
            Open to Opportunities
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            My{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Resume
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Senior Full-Stack Engineer with 12+ years crafting scalable
            products. View the highlights or download the full PDF.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-10">
          {/* Left column: highlights */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    12+ years
                  </span>
                  <span className="text-sm text-white/50 mt-1">
                    of professional experience
                  </span>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <p className="text-xs text-cyan-400 font-semibold tracking-widest uppercase mb-1">
                  Current Title
                </p>
                <p className="text-lg font-semibold text-white">
                  Senior Full-Stack Engineer
                </p>
                <p className="text-sm text-white/50">
                  {siteConfig.name}
                </p>
              </div>
            </div>

            {/* Skills pills */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-4">
                Key Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 transition-all duration-200 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:scale-105"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent roles */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
              <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase">
                Recent Roles
              </p>
              {recentRoles.map((role) => (
                <div key={role.company} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {role.company}
                      </p>
                      <p className="text-xs text-cyan-400">{role.title}</p>
                    </div>
                    <span className="text-xs text-white/40 whitespace-nowrap mt-0.5">
                      {role.period}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {role.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-xs text-white/50"
                      >
                        <span className="text-cyan-400 mt-0.5 shrink-0">
                          ›
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
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-white/50 font-mono">
                  resume.pdf
                </span>
              </div>
              <span className="text-xs text-white/30">5 pages</span>
            </div>

            {/* iframe embed */}
            <div className="relative w-full" style={{ height: "600px" }}>
              <iframe
                src="/resume.pdf"
                title="Resume — Daniel Alejandro Dominguez Diaz"
                className="w-full h-full border-0 rounded-b-2xl"
                style={{
                  border: "none",
                  borderRadius: "0 0 1rem 1rem",
                }}
              >
                <p className="p-4 text-white/50 text-sm">
                  Your browser does not support embedded PDF viewing.{" "}
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
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/resume.pdf"
            download
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <span
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              aria-hidden="true"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative w-5 h-5"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="relative">Download PDF</span>
          </a>

          <a
            href="/ar?view=resume"
            data-testid="resume-ar-btn"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-white/80 border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-400/40 hover:text-white hover:bg-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-purple-400"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View in AR
          </a>
        </div>
      </div>
    </section>
  );
}
