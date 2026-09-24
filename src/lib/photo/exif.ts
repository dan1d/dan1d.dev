// ─── EXIF normalization ─────────────────────────────────────────────────
// Used by: photo-add (ingest)

import exifr from "exifr";

export interface ExifData {
  camera: string | null;
  lens: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutter: string | null;
  iso: number | null;
  takenAt: string | null;
}

export interface ReadExifResult {
  exif: ExifData;
  exifSource: "file" | "none";
}

const EMPTY_EXIF: ExifData = {
  camera: null,
  lens: null,
  focalLength: null,
  aperture: null,
  shutter: null,
  iso: null,
  takenAt: null,
};

/**
 * Read and normalize camera EXIF from a JPEG buffer. GPS is never parsed or
 * returned. Never throws — missing or unparseable EXIF yields `exifSource: "none"`.
 */
export async function readExif(buffer: Buffer): Promise<ReadExifResult> {
  let raw: Record<string, unknown> | undefined;
  try {
    raw = await exifr.parse(buffer, { gps: false });
  } catch {
    return { exif: EMPTY_EXIF, exifSource: "none" };
  }

  if (!raw) return { exif: EMPTY_EXIF, exifSource: "none" };

  const exif: ExifData = {
    camera: formatCamera(asString(raw.Make), asString(raw.Model)),
    lens: asString(raw.LensModel),
    focalLength: asNumber(raw.FocalLength),
    aperture: asNumber(raw.FNumber),
    shutter: formatShutter(asNumber(raw.ExposureTime)),
    iso: asNumber(raw.ISO),
    takenAt: asIsoString(raw.DateTimeOriginal),
  };

  const isEmpty = Object.values(exif).every((v) => v === null);
  return { exif, exifSource: isEmpty ? "none" : "file" };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asIsoString(value: unknown): string | null {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString()
    : null;
}

/** Combine Make + Model into e.g. "Nikon D850", de-duplicating a repeated brand. */
function formatCamera(make: string | null, model: string | null): string | null {
  if (!make && !model) return null;

  const titleCase = (s: string) =>
    s
      .toLowerCase()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

  const modelTitled = model ? titleCase(model) : null;
  if (!make) return modelTitled;

  const makeWord = titleCase(make).split(" ")[0];
  if (!modelTitled) return makeWord;

  return modelTitled.toLowerCase().startsWith(makeWord.toLowerCase())
    ? modelTitled
    : `${makeWord} ${modelTitled}`;
}

/** Render exposure time in seconds as "1/250" (fast) or "2s" (slow). */
function formatShutter(exposureTime: number | null): string | null {
  if (exposureTime === null || exposureTime <= 0) return null;
  if (exposureTime >= 1) {
    return `${Math.round(exposureTime * 10) / 10}s`;
  }
  return `1/${Math.round(1 / exposureTime)}`;
}
