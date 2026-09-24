# dan1d.dev v2 — "Darkroom" photography site: execution plan (final, static)

Decision (Daniel, 2026-09-24): no money spent, ever. The site is fully static. Photos are processed on Daniel's machine and committed to the repo; Vercel serves files. No database, no storage service, no server functions for visitors. Loupe tier is 4096 px long edge; originals stay on Daniel's disk.

Earlier revisions (Supabase-backed) were reviewed by the plan and taste judges; this version keeps their surviving gates and removes every service-dependent part. Design brief: docs/v2-photography-concept.md.

## 1. Architecture

- Routing: dan1d.dev/photo inside this app. Subdomain and any move of / to /code are follow-ups.
- Layout isolation: app/layout.tsx keeps only html/body, globals.css and font variables. All Matrix chrome (Navbar, GlobalMatrixRain, Instructions, OnboardingProvider, matrix-scanlines, the engineer metadata) moves onto a wrapper div in app/(code)/layout.tsx; existing pages move into the (code) group, URLs unchanged. app/photo/layout.tsx has its own wrapper, tokens and metadata.
- Data: `src/data/photos/manifest.json`, committed. One entry per photo (schema below). Series are a field on the photo; the series slug is stored.
- Files: derived WebP tiers committed under `public/photos/<id>/{thumb,grid,full,loupe}.webp` (480 / 1200 / 2560 / 4096 long edge, skipped when the source is smaller). About 3 MB per photo. Originals never enter the repo (`.gitignore` covers `photos/inbox/`).
- Ingest: `pnpm photo:add <files...>` (scripts/photo-add.ts, run with tsx). For each JPEG: sniff magic bytes, read EXIF with exifr (camera, lens, focal length, aperture, shutter, ISO, taken date; GPS never written), apply orientation, emit the tiers with sharp from one decode, write the manifest entry with `public: false` and empty title/alt/story so Daniel fills them in, and print the entry. Re-running on the same file (same SHA-256) updates the existing entry instead of duplicating. `--series "Night Walks"` and `--publish` flags set fields at ingest time.
- Publishing: edit the manifest (title, alt, story, location, series, public: true), commit, push. Vercel builds. A manifest validation test runs in `pnpm test` so a bad entry fails before deploy.
- Pages: all static (generateStaticParams from the manifest). Plain `<img>` with srcset/sizes in aspect-ratio boxes; `images: { unoptimized: true }` app-wide (zero next/image usage exists). Zero Vercel image transformations, zero functions.
- Cost: 0. Vercel Hobby static bandwidth 100 GB a month. Repo growth about 120 MB a month at 40 photos; if it ever matters, old tiers move to a free Cloudflare R2 bucket by changing the URL base in one module.
- Dependencies: sharp and exifr as devDependencies (build never needs them). Tests for the script run under `// @vitest-environment node`.

## 2. Manifest schema

```ts
interface PhotoEntry {
  id: string;            // slug of filename + 6-char sha256 prefix
  sha256: string;
  series: string | null; seriesSlug: string | null;
  title: string; alt: string; story: string | null; location: string | null;
  takenAt: string | null;  // ISO, from DateTimeOriginal
  width: number; height: number;   // after orientation
  tiers: Partial<Record<"thumb"|"grid"|"full"|"loupe", { w: number; h: number; bytes: number }>>;
  exif: { camera: string|null; lens: string|null; focalLength: number|null; aperture: number|null; shutter: string|null; iso: number|null };
  exifSource: "file" | "manual" | "none";
  public: boolean; sort: number; addedAt: string;
}
```

Public URL for a tier: `/photos/<id>/<tier>.webp` (built in src/lib/photo/urls.ts from a single base constant).

## 3. Phases

### Phase 1 — Layout isolation and the darkroom shell (nextjs-pro)
Create app/(code)/layout.tsx, move page.tsx, ar/, card/, admin/ into (code), slim app/layout.tsx, add app/photo/layout.tsx with its own metadata, app/photo/page.tsx placeholder, src/styles/darkroom.css tokens (bg #050505, surface #0C0C0C, fg #EDEAE4, muted #8A8681, safelight #F2B441, Fraunces plus Geist via next/font, develop 900 ms, reduced-motion cuts), src/components/photo/DevelopImage.tsx, `images: { unoptimized: true }` in next.config.ts.
Done when: `pnpm build` succeeds and the route list for /, /ar, /card, /admin, /api/* is unchanged; the test baseline (64 passed / 20 known-red in Hero.test.tsx and Instructions.test.tsx) is unchanged; a render test per moved route asserts the (code) wrapper carries matrix-scanlines and renders Navbar; a photo layout test asserts no matrix-scanlines element and no Navbar; DevelopImage test asserts width, height and aspect-ratio are set and that reduced motion applies no transition; /photo metadata title differs from the engineer title.

### Phase 2 — Ingest script and manifest (typescript-pro)
Create scripts/photo-add.ts, src/lib/photo/{exif,sizes,manifest,urls,slug}.ts, src/data/photos/manifest.json (empty array), `.gitignore` entry for photos/inbox/, docs section "Adding photos". Fixtures: a synthetic JPEG with EXIF written by sharp and a 4 px JPEG without EXIF.
Done when: exif test reports camera, lens, aperture, shutter (as `1/250`), iso, focalLength, takenAt from the fixture and never writes a GPS key; the stripped fixture yields exifSource none without throwing; sizes test proves aspect ratio within 1 px and that a 900 px source plans only thumb and grid; script test on a synthetic 8256×5504 image writes four WebP tiers within 1 px of the planned long edge and under 60/250/900/3000 KB, writes a manifest entry with public false, and re-running on the same bytes updates rather than duplicates; a `.pdf` renamed `.jpg` is rejected with a readable message; manifest validation test rejects an entry with public true and empty alt; `pnpm photo:add` on one of Daniel's real D850 exports completes in under 30 s and prints the entry.

### Phase 3 — Public site and hardening (frontend-developer, then qa-expert)
Create app/photo/page.tsx (full-bleed cover, scroll through the last six developing from black, left progress rule, series tiles, one-line bio), app/photo/series/page.tsx, app/photo/series/[slug]/page.tsx (aspect-respecting masonry, never cropped), app/photo/series/[slug]/[photoId]/page.tsx, app/photo/about/page.tsx (portrait, first-person text, gear list, contact, one line linking to the code portfolio), sitemap.ts, opengraph-image.tsx, not-found.tsx, components PhotoGrid, Lightbox (client overlay with pushState URL, chrome hides after 2 s and returns on pointermove), Loupe (loads the 4096 tier only on activation), ExifStrip, SeriesTile, ProgressRule. Add a "Photography" link in the Matrix Navbar.
Done when: Lightbox test proves Left/Right navigate, Esc closes and returns focus to the originating tile, Tab stays inside the dialog, role dialog and aria-modal are set, reduced motion uses cuts; PhotoGrid test proves every img has width, height, non-empty alt, a srcset with at least two candidates under /photos/, and an aspect-ratio wrapper, for one portrait and one landscape frame; ExifStrip test proves "Nikon D850 · 85mm · f/1.8 · 1/250 · ISO 200", omits missing values, and shows "EXIF unavailable" when all are null; unpublished entries are absent from every page and the sitemap; Lighthouse mobile on /photo and one gallery scores Performance ≥ 90, Accessibility 100, CLS ≤ 0.01; the Vercel dashboard shows 0 image transformations and 0 function invocations for the deploy; a deep link to a photo URL and a refresh on it render the full page; the end-to-end script below passes locally and once in production.

End-to-end script: run `pnpm photo:add` on two real D850 exports with `--series "Night Walks"`; fill title, alt, story, location for one and set it public; commit and push. Then in a private window: /photo shows the photo developing from black; /photo/series/night-walks shows it uncropped with no layout shift; click opens the lightbox with the EXIF strip read from the file; keyboard Left/Right/Esc work; loupe activation is the first and only request for the loupe tier; the Network panel shows zero /_next/image requests; the second, unpublished photo is absent from /photo, the gallery and /photo/sitemap.xml.

## 4. Error paths
- Bad input: non-JPEG or a renamed PDF is rejected by magic bytes with a readable message; the script continues with the remaining files and exits non-zero at the end.
- Missing EXIF: nulls, exifSource none; ExifStrip omits missing values or shows "EXIF unavailable".
- Bad manifest: the validation test fails `pnpm test`, so a public entry without alt or a missing tier file never deploys.
- Duplicate photo: same SHA-256 updates the existing entry.
- Broken tier file: the validator checks every tier path exists on disk.

## 5. Non-goals for v1
Browser upload (possible later as GitHub commits via the existing token), subdomain, moving / to /code, RAW or TIFF input, originals in the repo, comments, likes, multi-user, print sales, search, tags, maps, AI captions, video, analytics, i18n, AVIF.

## 6. Adding photos

```
node scripts/photo-add.ts [--series "Name"] [--publish] <files...>
# or, via the package.json script:
pnpm photo:add [--series "Name"] [--publish] <files...>
```

For each JPEG passed in: sniffs magic bytes (rejects anything that isn't a real
JPEG, e.g. a renamed PDF), hashes the bytes (sha256), reads EXIF with exifr
(camera, lens, focal length, aperture, shutter, ISO, taken date — GPS is never
read or written), auto-orients once with sharp and derives `thumb` / `grid` /
`full` / `loupe` WebP tiers (skipping any tier at or above the source's own
size — never upscaled), writes them to `public/photos/<id>/<tier>.webp`, and
upserts the entry in `src/data/photos/manifest.json`.

- Re-running on the same file (same sha256) updates the existing entry's
  tiers/EXIF/dimensions in place rather than creating a duplicate — any
  `title`, `alt`, `story`, `location` or `public` you've already set by hand
  survive the update.
- New entries default to `title: "Untitled"`, `alt: ""`, and `public: false`
  so nothing goes live until you've written real copy. Pass `--publish` to
  flip a fresh batch public immediately, or edit the manifest and set
  `"public": true` by hand once it's ready.
- `--series "Night Walks"` sets `series` and derives `seriesSlug` for every
  file in that invocation.
- The script exits non-zero if any file failed (e.g. bad magic bytes), but
  still processes and writes the rest of the batch.
- Originals never enter the repo — drop them in `photos/inbox/`
  (git-ignored) or anywhere outside the repo before running the script.

After editing the manifest by hand, `pnpm test` runs `validateManifest`
(`src/lib/photo/manifest.ts`) over it — a public entry with an empty `alt`
or `title`, a missing tier file on disk, a duplicate `id`, or a `seriesSlug`
that doesn't match `series` fails the suite before it can reach a deploy.
