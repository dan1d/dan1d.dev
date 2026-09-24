"use client";

import { useEffect, useRef, useState } from "react";

interface DevelopImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  className?: string;
}

/**
 * A plain <img> (never next/image, per the static-site cost constraint) that
 * "develops" into view from black once loaded, like a print coming up in the
 * tray. Reserves its aspect ratio up front so there is no layout shift.
 */
export default function DevelopImage({
  src,
  alt,
  width,
  height,
  srcSet,
  sizes,
  loading,
  fetchPriority,
  className,
}: DevelopImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Image may already be cached and complete before onLoad can fire.
    const img = imgRef.current;
    if (img && img.complete) setLoaded(img.complete);
  }, []);

  return (
    <div className={className} style={{ aspectRatio: `${width} / ${height}` }}>
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          filter: loaded ? "contrast(1)" : "contrast(1.15)",
          transition: "opacity var(--dk-develop) ease-out, filter var(--dk-develop) ease-out",
        }}
      />
    </div>
  );
}
