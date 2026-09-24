// ─── Photo manifest ─────────────────────────────────────────────────────
// Used by: photo-add (ingest), gallery pages + build validation (Phase 3)

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PhotoTier } from "./sizes.ts";
import { slugify } from "./slug.ts";

export const MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/photos/manifest.json"
);

export interface PhotoEntry {
  id: string;
  sha256: string;
  series: string | null;
  seriesSlug: string | null;
  title: string;
  alt: string;
  story: string | null;
  location: string | null;
  /** ISO, from DateTimeOriginal */
  takenAt: string | null;
  /** Post-orientation dimensions */
  width: number;
  height: number;
  tiers: Partial<Record<PhotoTier, { w: number; h: number; bytes: number }>>;
  exif: {
    camera: string | null;
    lens: string | null;
    focalLength: number | null;
    aperture: number | null;
    shutter: string | null;
    iso: number | null;
  };
  exifSource: "file" | "manual" | "none";
  public: boolean;
  sort: number;
  addedAt: string;
}

/** Read the manifest, or [] if it doesn't exist yet. */
export async function readManifest(
  manifestPath: string = MANIFEST_PATH
): Promise<PhotoEntry[]> {
  if (!existsSync(manifestPath)) return [];
  const raw = await readFile(manifestPath, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as PhotoEntry[]) : [];
}

export async function writeManifest(
  entries: PhotoEntry[],
  manifestPath: string = MANIFEST_PATH
): Promise<void> {
  await writeFile(manifestPath, JSON.stringify(entries, null, 2) + "\n", "utf-8");
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export interface ValidateManifestOptions {
  /** Absolute path to the public/photos directory, for tier-file existence checks */
  publicDir: string;
}

/** Validate manifest entries; returns a list of human-readable problems (empty = valid). */
export function validateManifest(
  entries: PhotoEntry[],
  { publicDir }: ValidateManifestOptions
): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();

  for (const entry of entries) {
    if (seenIds.has(entry.id)) {
      problems.push(`duplicate id: ${entry.id}`);
    }
    seenIds.add(entry.id);

    if (entry.public && !entry.alt.trim()) {
      problems.push(`${entry.id}: public entry has empty alt`);
    }
    if (entry.public && !entry.title.trim()) {
      problems.push(`${entry.id}: public entry has empty title`);
    }

    if (entry.series === null) {
      if (entry.seriesSlug !== null) {
        problems.push(`${entry.id}: seriesSlug set without series`);
      }
    } else if (entry.seriesSlug !== slugify(entry.series)) {
      problems.push(`${entry.id}: seriesSlug does not match series`);
    }

    if (entry.takenAt !== null && !ISO_DATE_RE.test(entry.takenAt)) {
      problems.push(`${entry.id}: takenAt is not an ISO date: ${entry.takenAt}`);
    }
    if (!ISO_DATE_RE.test(entry.addedAt)) {
      problems.push(`${entry.id}: addedAt is not an ISO date: ${entry.addedAt}`);
    }

    for (const [tier, info] of Object.entries(entry.tiers)) {
      if (!info) continue;
      const filePath = path.join(publicDir, entry.id, `${tier}.webp`);
      if (!existsSync(filePath)) {
        problems.push(`${entry.id}: missing tier file ${tier} at ${filePath}`);
      }
    }
  }

  return problems;
}
