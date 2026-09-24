// ─── Slugify ─────────────────────────────────────────────────────────────
// Used by: photo-add (id + series slugs), manifest validation

/** Lowercase ASCII slug: strips accents, collapses everything else into hyphens */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
