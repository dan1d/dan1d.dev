"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PhotoEntry } from "@/lib/photo/manifest";

import Loupe from "./Loupe";
import PhotoDetail from "./PhotoDetail";

const CHROME_IDLE_MS = 2000;
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function photoUrl(seriesSlug: string, photoId: string): string {
  return `/photo/series/${seriesSlug}/${photoId}`;
}

interface LightboxProps {
  photos: PhotoEntry[];
  index: number;
  seriesSlug: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

/**
 * The photograph at maximum size on black. Keyboard-driven (Left/Right/Esc),
 * traps focus, pushes the photo's URL, and hides its chrome after two
 * seconds of no pointer movement.
 */
export default function Lightbox({
  photos,
  index,
  seriesSlug,
  onIndexChange,
  onClose,
  returnFocusRef,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const photo = photos[index];

  // Focus the dialog on open; restore focus to the originating tile on close.
  useEffect(() => {
    dialogRef.current?.focus();
    const trigger = returnFocusRef.current;
    return () => {
      trigger?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll while open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Push the photo's URL on open; Back (popstate) closes the overlay in step
  // with the history stack instead of leaving it mounted under a stale URL.
  useEffect(() => {
    window.history.pushState(null, "", photoUrl(seriesSlug, photos[index].id));
    pushedRef.current = true;

    const handlePopState = () => {
      pushedRef.current = false;
      onClose();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync as the viewer navigates between photos.
  useEffect(() => {
    window.history.replaceState(null, "", photoUrl(seriesSlug, photo.id));
  }, [seriesSlug, photo.id]);

  // Chrome fades out after two seconds of no pointer movement, returns on move.
  useEffect(() => {
    const dialog = dialogRef.current;
    let timer = window.setTimeout(() => setChromeVisible(false), CHROME_IDLE_MS);

    const handlePointerMove = () => {
      setChromeVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setChromeVisible(false), CHROME_IDLE_MS);
    };

    dialog?.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.clearTimeout(timer);
      dialog?.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  // Closing hands off to Back when we pushed an entry, so the popstate
  // listener above is the single path that calls onClose.
  const handleClose = useCallback(() => {
    if (pushedRef.current) {
      window.history.back();
    } else {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        onIndexChange(Math.max(0, index - 1));
        return;
      }
      if (e.key === "ArrowRight") {
        onIndexChange(Math.min(photos.length - 1, index + 1));
        return;
      }
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose, index, onIndexChange, photos.length]
  );

  const chromeClass = chromeVisible ? "opacity-100" : "opacity-0";
  const chromeTransition = { transition: "opacity var(--dk-develop) ease-out" };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex flex-col bg-black outline-none"
    >
      <div className={`flex items-center justify-end gap-4 p-4 ${chromeClass}`} style={chromeTransition}>
        <Loupe photo={photo} />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--dk-muted)" }}
        >
          Close
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <PhotoDetail photo={photo} />
      </div>

      <div className={`flex justify-between p-4 ${chromeClass}`} style={chromeTransition}>
        <button
          type="button"
          onClick={() => onIndexChange(Math.max(0, index - 1))}
          disabled={index === 0}
          aria-label="Previous photo"
          className="text-xs tracking-widest uppercase disabled:opacity-30"
          style={{ color: "var(--dk-muted)" }}
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onIndexChange(Math.min(photos.length - 1, index + 1))}
          disabled={index === photos.length - 1}
          aria-label="Next photo"
          className="text-xs tracking-widest uppercase disabled:opacity-30"
          style={{ color: "var(--dk-muted)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
