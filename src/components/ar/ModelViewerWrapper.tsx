"use client";

import { useEffect } from "react";

interface ModelViewerWrapperProps {
  src: string;
  alt: string;
  arSupported: boolean;
}

/**
 * Wraps the <model-viewer> web component from @google/model-viewer.
 * We dynamically import the side-effect-only package (which registers the
 * custom element) and then render the element directly. Because model-viewer
 * is a custom element we declare its JSX types in src/types/model-viewer.d.ts.
 */
export default function ModelViewerWrapper({
  src,
  alt,
  arSupported,
}: ModelViewerWrapperProps) {
  // Import @google/model-viewer as a side-effect to register the custom element
  useEffect(() => {
    import("@google/model-viewer").catch(() => {
      // model-viewer may not be available in all environments; fail silently
    });
  }, []);

  return (
    <model-viewer
      src={src}
      alt={alt}
      ar={arSupported || undefined}
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      loading="lazy"
      reveal="auto"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
        background: "transparent",
        "--progress-bar-color": "#22d3ee",
        "--progress-mask": "transparent",
      } as React.CSSProperties}
    />
  );
}
