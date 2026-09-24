"use client";

import { useEffect, useRef, useState } from "react";

import type { PhotoEntry } from "@/lib/photo/manifest";
import { buildSrcSet } from "@/lib/photo/srcset";
import { tierUrl } from "@/lib/photo/urls";

import DevelopImage from "./DevelopImage";
import ProgressRule from "./ProgressRule";

interface PhotoSequenceProps {
  photos: PhotoEntry[];
}

/** The last few photos, one per viewport section, developing in as they scroll into view. */
export default function PhotoSequence({ photos }: PhotoSequenceProps) {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const sections = sectionRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index !== -1) setActive(index);
        }
      },
      { threshold: 0.6 }
    );
    for (const section of sections) {
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [photos]);

  if (photos.length === 0) return null;

  return (
    <>
      <ProgressRule total={photos.length} active={active} />
      {photos.map((photo, i) => (
        <section
          key={photo.id}
          ref={(el) => {
            sectionRefs.current[i] = el;
          }}
          className="flex min-h-screen items-center justify-center p-6"
        >
          <DevelopImage
            src={tierUrl(photo.id, "full")}
            srcSet={buildSrcSet(photo, ["grid", "full"])}
            sizes="100vw"
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            className="max-h-[85vh] w-auto"
          />
        </section>
      ))}
    </>
  );
}
