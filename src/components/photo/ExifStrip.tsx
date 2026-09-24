import type { PhotoEntry } from "@/lib/photo/manifest";

interface ExifStripProps {
  exif: PhotoEntry["exif"];
}

/**
 * Renders e.g. "Nikon D850 · 85mm · f/1.8 · 1/250 · ISO 200", omitting any
 * missing field, or "EXIF unavailable" when nothing is known.
 */
export default function ExifStrip({ exif }: ExifStripProps) {
  const parts = [
    exif.camera,
    exif.focalLength !== null ? `${exif.focalLength}mm` : null,
    exif.aperture !== null ? `f/${exif.aperture}` : null,
    exif.shutter,
    exif.iso !== null ? `ISO ${exif.iso}` : null,
  ].filter((part): part is string => part !== null);

  return (
    <p
      className="text-xs"
      style={{ fontFamily: "monospace", color: "var(--dk-muted)" }}
    >
      {parts.length > 0 ? parts.join(" · ") : "EXIF unavailable"}
    </p>
  );
}
