// ─── Photo URLs ─────────────────────────────────────────────────────────
// Used by: gallery pages (Phase 3), manifest validation

import type { PhotoTier } from "./sizes.ts";

const PHOTOS_BASE = "/photos";

/** Public URL for a photo tier, e.g. /photos/<id>/grid.webp */
export function tierUrl(id: string, tier: PhotoTier): string {
  return `${PHOTOS_BASE}/${id}/${tier}.webp`;
}
