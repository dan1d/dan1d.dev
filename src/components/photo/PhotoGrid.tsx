"use client";

import { useRef, useState } from "react";

import type { PhotoEntry } from "@/lib/photo/manifest";
import { buildSrcSet } from "@/lib/photo/srcset";
import { tierUrl } from "@/lib/photo/urls";

import DevelopImage from "./DevelopImage";
import ExifStrip from "./ExifStrip";
import Lightbox from "./Lightbox";

interface PhotoGridProps {
  photos: PhotoEntry[];
}

/**
 * Aspect-respecting masonry (CSS columns, so nothing is ever cropped).
 * Hover reveals the title and EXIF; click opens the Lightbox.
 */
export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          onClick={(e) => {
            triggerRef.current = e.currentTarget;
            setOpenIndex(index);
          }}
          className="group relative mb-4 block w-full break-inside-avoid text-left"
        >
          <DevelopImage
            src={tierUrl(photo.id, "grid")}
            srcSet={buildSrcSet(photo, ["thumb", "grid"])}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p
              className="text-sm"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}
            >
              {photo.title}
            </p>
            <ExifStrip exif={photo.exif} />
          </div>
        </button>
      ))}

      {openIndex !== null && (
        <Lightbox
          photos={photos}
          index={openIndex}
          seriesSlug={photos[openIndex].seriesSlug ?? ""}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          returnFocusRef={triggerRef}
        />
      )}
    </div>
  );
}
