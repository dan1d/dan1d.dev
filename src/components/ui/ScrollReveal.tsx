"use client";

import { useEffect, useRef } from "react";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: number;
}

function getTranslateFrom(direction: Direction): { x: number; y: number } {
  switch (direction) {
    case "up":
      return { x: 0, y: 60 };
    case "down":
      return { x: 0, y: -60 };
    case "left":
      return { x: 60, y: 0 };
    case "right":
      return { x: -60, y: 0 };
  }
}

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.9,
  className,
  stagger = 0,
}: ScrollRevealProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");

        gsap.registerPlugin(ScrollTrigger);

        const el = wrapperRef.current;
        if (!el) return;

        const { x, y } = getTranslateFrom(direction);

        // If stagger is set, animate direct children individually
        const targets =
          stagger > 0 ? Array.from(el.children) : [el];

        ctx = gsap.context(() => {
          gsap.fromTo(
            targets,
            { opacity: 0, x, y },
            {
              opacity: 1,
              x: 0,
              y: 0,
              duration,
              delay,
              stagger: stagger > 0 ? stagger : 0,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                once: true,
              },
            }
          );
        }, el);
      } catch {
        // GSAP not available (e.g. test environment) — skip animation
      }
    };

    init();

    return () => {
      ctx?.revert();
    };
  }, [direction, delay, duration, stagger]);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
}
