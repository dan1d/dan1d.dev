"use client";

import { useEffect, useRef } from "react";
import { projects, openSourceProjects } from "@/data/projects";
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
      className="relative py-24 bg-black"
    >
      {/* Subtle background gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent"
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-14 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Projects
          </h2>
          {/* Gradient underline */}
          <div className="mt-3 mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
          <p className="mt-4 text-white/50 text-base max-w-xl mx-auto">
            Things I&apos;ve built — from AI-powered tools to augmented reality experiences.
          </p>
        </div>

        {/* Featured projects grid */}
        {featuredProjects.length > 0 && (
          <div ref={cardsRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Open Source subsection — other non-featured items from projects array */}
        {otherProjects.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-white/80 mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              Open Source
              <span className="h-px flex-1 bg-white/10" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Open Source projects from openSourceProjects array */}
        {openSourceProjects.length > 0 && (
          <div className="mt-16" data-testid="open-source-section">
            <h3 className="text-xl font-semibold text-white/80 mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              {/* GitHub icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-white/60"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Open Source
              <span className="h-px flex-1 bg-white/10" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openSourceProjects.map((project) => (
                <article
                  key={project.id}
                  data-testid="open-source-card"
                  className="group relative flex flex-col rounded-xl bg-white/4 backdrop-blur border border-white/8 p-5 transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_20px_0_rgba(139,92,246,0.10)]"
                >
                  {/* Title */}
                  <h4 className="text-base font-bold text-white mb-1.5">
                    {project.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-white/55 leading-relaxed mb-3 flex-1">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <ul
                    className="flex flex-wrap gap-1.5 mb-4"
                    aria-label={`${project.title} tags`}
                  >
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/6 border border-white/8 text-white/60">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-purple-400/50 transition-colors duration-200"
                      >
                        {/* GitHub icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white hover:opacity-90 transition-opacity duration-200"
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
      </div>
    </section>
  );
}
