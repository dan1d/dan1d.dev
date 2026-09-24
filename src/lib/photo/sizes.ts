// ─── Photo tier table ───────────────────────────────────────────────────
// Used by: photo-add (ingest), urls (public paths), manifest (schema)

export type PhotoTier = "thumb" | "grid" | "full" | "loupe";

export interface TierSpec {
  tier: PhotoTier;
  /** Target long edge in px */
  longEdge: number;
  /** WebP quality (0-100) */
  quality: number;
}

/** Ordered smallest to largest. */
export const TIERS: readonly TierSpec[] = [
  { tier: "thumb", longEdge: 480, quality: 70 },
  { tier: "grid", longEdge: 1200, quality: 72 },
  { tier: "full", longEdge: 2560, quality: 78 },
  { tier: "loupe", longEdge: 4096, quality: 82 },
];

export interface PlannedTier extends TierSpec {
  width: number;
  height: number;
}

/**
 * Plan output dimensions for each tier from a (post-orientation) source size.
 * Tiers at or above the source's long edge are capped to the source size and
 * end the list — anything larger would just duplicate that same capped
 * image, so it's skipped. Never upscales.
 */
export function planTiers(width: number, height: number): PlannedTier[] {
  const sourceLongEdge = Math.max(width, height);
  const plans: PlannedTier[] = [];

  for (const spec of TIERS) {
    if (spec.longEdge >= sourceLongEdge) {
      plans.push({ ...spec, width, height });
      break;
    }
    const scale = spec.longEdge / sourceLongEdge;
    plans.push(
      width >= height
        ? { ...spec, width: spec.longEdge, height: Math.round(height * scale) }
        : { ...spec, width: Math.round(width * scale), height: spec.longEdge }
    );
  }

  return plans;
}
