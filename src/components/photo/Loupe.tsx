"use client";

import { useState } from "react";

import type { PhotoEntry } from "@/lib/photo/manifest";
import { tierUrl } from "@/lib/photo/urls";

interface LoupeProps {
  photo: PhotoEntry;
}

/**
 * A "100%" toggle that loads the loupe (4096px) tier only once activated.
 * The pane scrolls natively. Hidden entirely when the photo has no loupe tier.
 */
export default function Loupe({ photo }: LoupeProps) {
  const [active, setActive] = useState(false);

  const loupeTier = photo.tiers.loupe;
  if (!loupeTier) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setActive((prev) => !prev)}
        aria-pressed={active}
        className="text-xs tracking-widest uppercase"
        style={{ color: active ? "var(--dk-safelight)" : "var(--dk-muted)" }}
      >
        100%
      </button>
      {active && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-black">
          <img
            src={tierUrl(photo.id, "loupe")}
            alt={photo.alt}
            width={loupeTier.w}
            height={loupeTier.h}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
