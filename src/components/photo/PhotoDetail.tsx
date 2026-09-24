import type { PhotoEntry } from "@/lib/photo/manifest";
import { buildSrcSet } from "@/lib/photo/srcset";
import { tierUrl } from "@/lib/photo/urls";

import DevelopImage from "./DevelopImage";
import ExifStrip from "./ExifStrip";

interface PhotoDetailProps {
  photo: PhotoEntry;
}

/**
 * The photo itself plus title, EXIF, location and story — the inner view
 * shared by the standalone photo page and the Lightbox.
 */
export default function PhotoDetail({ photo }: PhotoDetailProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4">
      <DevelopImage
        src={tierUrl(photo.id, "full")}
        srcSet={buildSrcSet(photo, ["grid", "full"])}
        sizes="100vw"
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="eager"
        className="max-h-[70vh] w-auto"
      />
      <div className="w-full max-w-2xl space-y-2 text-center">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}>
          {photo.title}
        </h1>
        <ExifStrip exif={photo.exif} />
        {photo.location && (
          <p className="text-xs" style={{ color: "var(--dk-muted)" }}>
            {photo.location}
          </p>
        )}
        {photo.story && (
          <p className="text-sm" style={{ color: "var(--dk-fg)" }}>
            {photo.story}
          </p>
        )}
      </div>
    </div>
  );
}
