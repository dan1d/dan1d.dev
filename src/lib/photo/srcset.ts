// ─── Responsive srcSet builder ───────────────────────────────────────────
// Used by: PhotoGrid, PhotoDetail, PhotoSequence (Phase 3)

import type { PhotoEntry } from "./manifest.ts";
import type { PhotoTier } from "./sizes.ts";
import { tierUrl } from "./urls.ts";

/** Build a srcSet string from whichever of the given tiers the entry actually has. */
export function buildSrcSet(entry: PhotoEntry, tiers: PhotoTier[]): string {
  return tiers
    .filter((tier) => entry.tiers[tier])
    .map((tier) => `${tierUrl(entry.id, tier)} ${entry.tiers[tier]!.w}w`)
    .join(", ");
}
