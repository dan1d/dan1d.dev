"use client";

import type { Project } from "@/data/projects";
import HoloCard from "@/components/ui/HoloCard";
import DecodeText from "@/components/ui/DecodeText";

// ─── OpenSourceCard ─────────────────────────────────────────────────────────
// A repository rendered as a construct on the Matrix: numbered header strip
// with a per-repo data signature, decoding title and summary, chip tags,
// bracketed actions, and layered decoration (edge accent, glyph texture,
// watermark index) that lifts on hover. All text stays fully readable.

interface OpenSourceCardProps {
  project: Project;
  index: number;
}

/** Deterministic 16-bar "signature" from the repo id, so each card differs but never flickers. */
function signature(id: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const bars: number[] = [];
  for (let i = 0; i < 16; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177); bars.push(3 + ((h >>> 0) % 9)); }
  return bars;
}

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function OpenSourceCard({ project, index }: OpenSourceCardProps) {
  const bars = signature(project.id);
  const num = String(index + 1).padStart(2, "0");

  return (
    <HoloCard
      data-testid="open-source-card"
      className="os-card group relative flex flex-col font-mono border border-green-400/20 hover:border-green-400/60 hover:shadow-[0_0_28px_0_rgba(0,255,65,0.14)]"
    >
      {/* Edge accent + corner brackets */}
      <span className="os-card-accent" aria-hidden="true" />
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-green-400/40 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-green-400/80" aria-hidden="true" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-green-400/40 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-green-400/80" aria-hidden="true" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-green-400/25 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-green-400/60" aria-hidden="true" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-green-400/25 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-green-400/60" aria-hidden="true" />

      {/* Watermark index */}
      <span className="os-card-watermark" aria-hidden="true">{num}</span>

      {/* Header strip: index, repo signature, status */}
      <div className="relative flex items-center justify-between px-5 pt-4 pb-3 border-b border-green-400/10">
        <span className="text-[10px] tracking-[0.25em] text-green-400/45">
          <span className="text-green-400/70">[{num}]</span> REPO
        </span>
        <div className="flex items-end gap-[2px] h-3" aria-hidden="true">
          {bars.map((b, i) => (
            <span key={i} className="os-card-bar" style={{ height: `${b}px`, animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-[9px] tracking-widest text-green-400/50">
          <span className="os-card-led" aria-hidden="true" />
          ONLINE
        </span>
      </div>

      {/* Body */}
      <div className="relative flex flex-col flex-1 px-5 pt-4 pb-5">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-green-400/40 text-sm" aria-hidden="true">&gt;</span>
          <DecodeText
            as="h4"
            text={project.title}
            duration={600}
            delay={350}
            className="text-[15px] font-bold text-lime-400 tracking-wide break-all"
            style={{ textShadow: "0 0 10px rgba(57,255,20,0.55)" }}
          />
        </div>

        <DecodeText
          as="p"
          text={project.description}
          duration={1000}
          delay={500}
          className="text-[11.5px] text-green-200/60 leading-relaxed mb-4 flex-1"
        />

        <ul className="flex flex-wrap gap-1.5 mb-5" aria-label={`${project.title} tags`}>
          {project.tags.map((tag) => (
            <li key={tag}>
              <span className="os-card-chip">{tag}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 mt-auto">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${project.title} on GitHub`}
              data-testid="github-link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest border border-green-400/30 text-green-400/80 hover:text-lime-300 hover:border-green-400/70 hover:bg-green-400/10 transition-colors duration-200"
            >
              <span className="text-green-400/40" aria-hidden="true">[</span>
              <GitHubIcon />
              GITHUB
              <span className="text-green-400/40" aria-hidden="true">]</span>
            </a>
          )}
          {project.url && project.url !== project.github && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.title}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest border border-green-400/50 text-green-300 hover:bg-green-400/15 hover:border-green-400 transition-colors duration-200"
              style={{ textShadow: "0 0 6px rgba(0,255,65,0.5)" }}
            >
              <span className="text-green-400/50" aria-hidden="true">[</span>
              VISIT
              <span className="text-green-400/50" aria-hidden="true">]</span>
            </a>
          )}
        </div>
      </div>
    </HoloCard>
  );
}
