"use client";

import { useEffect, useRef } from "react";
import { projects, openSourceProjects, railsContributions } from "@/data/projects";
import ProjectCard from "@/components/ui/ProjectCard";

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const initGsap = async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");

        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          if (!cardsRef.current) return;

          const cards = cardsRef.current.querySelectorAll("article");
          if (cards.length === 0) return;

          gsap.fromTo(
            cards,
            { opacity: 0, y: 60 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              stagger: 0.15,
              ease: "power3.out",
              scrollTrigger: {
                trigger: cardsRef.current,
                start: "top 80%",
                once: true,
              },
            }
          );
        }, sectionRef);
      } catch {
        // GSAP not available in test environment; skip animation
      }
    };

    initGsap();

    return () => {
      ctx?.revert();
    };
  }, []);

  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative py-24 bg-black overflow-hidden"
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

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-[2] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header — terminal style */}
        <div className="mb-14 font-mono">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px flex-1 bg-green-400/20" />
            <span className="text-green-400/30 text-[10px] tracking-widest">// SYSTEM</span>
            <span className="h-px flex-1 bg-green-400/20" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
            style={{ color: "#39ff14", textShadow: "0 0 10px #39ff14" }}
          >
            Projects
          </h2>
          <p className="text-sm text-green-400/50 max-w-xl">
            Things I&apos;ve built — from AI-powered tools to augmented reality experiences.
          </p>
          <p className="mt-2 text-green-400/40 text-xs">
            &gt; Inevitable, Mr. Anderson.
          </p>
        </div>

        {/* Featured projects grid */}
        {featuredProjects.length > 0 && (
          <div ref={cardsRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Open Source subsection — other non-featured items from projects array */}
        {otherProjects.length > 0 && (
          <div className="mt-16">
            <h3 className="text-sm font-mono text-green-400/50 tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-green-400/15" />
              // OPEN_SOURCE
              <span className="h-px flex-1 bg-green-400/15" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Open Source projects from openSourceProjects array */}
        {openSourceProjects.length > 0 && (
          <div className="mt-16" data-testid="open-source-section">
            <h3 className="text-sm font-mono text-green-400/50 tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-green-400/15" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-green-400/40"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              // OPEN_SOURCE
              <span className="h-px flex-1 bg-green-400/15" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openSourceProjects.map((project) => (
                <article
                  key={project.id}
                  data-testid="open-source-card"
                  className="group relative flex flex-col bg-black border border-green-400/15 p-5 font-mono transition-all duration-300 hover:border-green-400/50 hover:shadow-[0_0_20px_0_rgba(57,255,20,0.08)]"
                >
                  {/* Corner brackets */}
                  <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-green-400/30" aria-hidden="true" />
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-green-400/30" aria-hidden="true" />
                  <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-green-400/20" aria-hidden="true" />
                  <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-green-400/20" aria-hidden="true" />

                  {/* Title */}
                  <h4
                    className="text-sm font-bold text-lime-400 mb-1.5"
                    style={{ textShadow: "0 0 6px #39ff14" }}
                  >
                    {project.title}
                  </h4>

                  {/* Description */}
                  <p className="text-[11px] text-green-300/50 leading-relaxed mb-3 flex-1">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <ul
                    className="flex flex-wrap gap-1 mb-4"
                    aria-label={`${project.title} tags`}
                  >
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-green-400/15 bg-green-400/5 text-green-400/50">
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${project.title} on GitHub`}
                        data-testid="github-link"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono border border-green-400/20 text-green-400/60 hover:text-green-400 hover:border-green-400/50 transition-colors duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-3 h-3"
                          aria-hidden="true"
                        >
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        GitHub
                      </a>
                    )}
                    {project.url && project.url !== project.github && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${project.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors duration-200"
                      >
                        Visit
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Rails Contributions */}
        {railsContributions.length > 0 && (
          <div className="mt-16" data-testid="rails-contributions-section">
            <h3 className="text-sm font-mono text-green-400/50 tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-green-400/15" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-red-400/50"
                aria-hidden="true"
              >
                <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
              </svg>
              // RAILS_CONTRIBUTIONS
              <span className="h-px flex-1 bg-green-400/15" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {railsContributions.map((pr) => (
                <a
                  key={pr.id}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="rails-contribution-card"
                  className="group relative flex flex-col bg-black border border-green-400/15 p-5 font-mono transition-all duration-300 hover:border-red-400/30 hover:shadow-[0_0_20px_0_rgba(248,113,113,0.06)]"
                >
                  {/* Corner brackets */}
                  <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-green-400/20" aria-hidden="true" />
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-green-400/20" aria-hidden="true" />

                  <div className="flex items-start gap-3 mb-2">
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400/80 border border-red-400/20 font-mono">
                      PR
                    </span>
                    <h4 className="text-xs font-bold text-green-300 group-hover:text-red-300 transition-colors">
                      {pr.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-green-400/40 leading-relaxed">
                    {pr.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
