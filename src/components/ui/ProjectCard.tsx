"use client";

import { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { title, description, url, tags, featured, modelUrl } = project;

  return (
    <article className="group relative flex flex-col bg-black border border-green-400/20 p-6 font-mono transition-all duration-300 hover:border-green-400/60 hover:shadow-[0_0_20px_0_rgba(0,255,65,0.12)]">
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-green-400/40" aria-hidden="true" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-green-400/40" aria-hidden="true" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-green-400/30" aria-hidden="true" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-green-400/30" aria-hidden="true" />

      {/* Featured badge */}
      {featured && (
        <span
          data-testid="featured-badge"
          className="absolute top-4 right-6 text-[10px] tracking-widest text-lime-400/80 uppercase font-mono"
          style={{ textShadow: "0 0 6px #39ff14" }}
        >
          Featured
        </span>
      )}

      {/* Comment label */}
      <div className="text-green-400/30 text-[10px] mb-2 tracking-widest" aria-hidden="true">
        // PROJECT
      </div>

      {/* Title */}
      <h3
        className="text-sm font-bold text-lime-400 mb-2 pr-20 uppercase tracking-wide"
        style={{ textShadow: "0 0 8px #39ff14" }}
      >
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs text-green-300/60 leading-relaxed mb-4 flex-1">{description}</p>

      {/* Tags */}
      <ul className="flex flex-wrap gap-1.5 mb-5" aria-label={`${title} tags`}>
        {tags.map((tag) => (
          <li key={tag}>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-green-400/20 bg-green-400/5 text-green-400/60">
              {tag}
            </span>
          </li>
        ))}
      </ul>

      {/* Actions row */}
      <div className="flex items-center gap-3 mt-auto">
        {/* Visit link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${title}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-green-400/40 text-green-400 tracking-widest hover:border-green-400 hover:bg-green-400/10 transition-all duration-200"
        >
          <span className="text-green-400/50" aria-hidden="true">[</span>
          VISIT
          <span className="text-green-400/50" aria-hidden="true">]</span>
        </a>

        {/* View in AR button */}
        <button
          type="button"
          data-testid="ar-view-btn"
          aria-label={`View ${title} in AR`}
          disabled={!modelUrl}
          className="inline-flex items-center justify-center w-8 h-8 border border-green-400/20 bg-black text-green-400/60 hover:text-green-400 hover:border-green-400/50 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title={modelUrl ? "View in AR" : "AR model coming soon"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </button>
      </div>
    </article>
  );
}
