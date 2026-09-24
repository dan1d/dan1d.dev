// ─── Photo manifest queries ─────────────────────────────────────────────
// Used by: photo pages, sitemap (Phase 3)
//
// Pure, synchronous selectors over an already-loaded manifest array. Pages
// call readManifest() once and pass the entries in here.

import type { PhotoEntry } from "./manifest.ts";

export interface SeriesSummary {
  slug: string;
  title: string;
  cover: PhotoEntry;
  count: number;
}

/** Public photos, most recently taken first (ties broken by `sort` ascending). */
export function publicPhotos(entries: PhotoEntry[]): PhotoEntry[] {
  return entries
    .filter((entry) => entry.public)
    .slice()
    .sort((a, b) => {
      const aTime = a.takenAt ? Date.parse(a.takenAt) : -Infinity;
      const bTime = b.takenAt ? Date.parse(b.takenAt) : -Infinity;
      if (aTime !== bTime) return bTime - aTime;
      return a.sort - b.sort;
    });
}

/** The `n` most recent public photos. */
export function recent(entries: PhotoEntry[], n: number): PhotoEntry[] {
  return publicPhotos(entries).slice(0, n);
}

/** Distinct series among public photos, covered by their most recent photo. */
export function seriesList(entries: PhotoEntry[]): SeriesSummary[] {
  const bySlug = new Map<string, PhotoEntry[]>();

  for (const photo of publicPhotos(entries)) {
    if (!photo.series || !photo.seriesSlug) continue;
    const group = bySlug.get(photo.seriesSlug);
    if (group) group.push(photo);
    else bySlug.set(photo.seriesSlug, [photo]);
  }

  return Array.from(bySlug.entries()).map(([slug, group]) => ({
    slug,
    title: group[0].series as string,
    cover: group[0],
    count: group.length,
  }));
}

/** Public photos in a given series, most recent first. */
export function photosInSeries(entries: PhotoEntry[], slug: string): PhotoEntry[] {
  return publicPhotos(entries).filter((photo) => photo.seriesSlug === slug);
}

export function photoById(entries: PhotoEntry[], id: string): PhotoEntry | undefined {
  return entries.find((photo) => photo.id === id);
}

/** The photo before/after `id` within its own series (or among all public photos, if series-less). */
export function neighbours(
  entries: PhotoEntry[],
  id: string
): { prev: PhotoEntry | null; next: PhotoEntry | null } {
  const photo = photoById(entries, id);
  if (!photo) return { prev: null, next: null };

  const siblings = photo.seriesSlug
    ? photosInSeries(entries, photo.seriesSlug)
    : publicPhotos(entries);
  const index = siblings.findIndex((sibling) => sibling.id === id);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? siblings[index - 1] : null,
    next: index < siblings.length - 1 ? siblings[index + 1] : null,
  };
}
