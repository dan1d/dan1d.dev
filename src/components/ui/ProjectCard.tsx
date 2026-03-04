"use client";

import { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { title, description, url, tags, featured, modelUrl } = project;

  return (
    <article className="group relative flex flex-col rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_24px_0_rgba(34,211,238,0.12)]">
      {/* Featured badge */}
      {featured && (
        <span
          data-testid="featured-badge"
          className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-400/30 text-cyan-300"
        >
          Featured
        </span>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2 pr-20">{title}</h3>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed mb-4 flex-1">{description}</p>

      {/* Tags */}
      <ul className="flex flex-wrap gap-2 mb-5" aria-label={`${title} tags`}>
        {tags.map((tag) => (
          <li key={tag}>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/8 border border-white/10 text-white/70">
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
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 transition-opacity duration-200"
        >
          Visit
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.25 5.5a.75.75 0 000 1.5h8.69L5.03 14.97a.75.75 0 101.06 1.06L14 8.12v8.63a.75.75 0 001.5 0V5.5a.75.75 0 00-.75-.75H4.25z"
              clipRule="evenodd"
            />
          </svg>
        </a>

        {/* View in AR button */}
        <button
          type="button"
          data-testid="ar-view-btn"
          aria-label={`View ${title} in AR`}
          disabled={!modelUrl}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={modelUrl ? "View in AR" : "AR model coming soon"}
        >
          {/* AR/Cube icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
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
