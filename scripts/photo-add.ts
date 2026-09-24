// ─── Photo ingest CLI ───────────────────────────────────────────────────
// Usage: node scripts/photo-add.ts [--series "Name"] [--publish] <files...>
//
// For each JPEG: sniffs magic bytes, hashes, reads EXIF, generates WebP
// tiers with sharp, and upserts an entry in src/data/photos/manifest.json.
// Re-running on the same bytes (same sha256) updates the entry in place.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { readExif } from "../src/lib/photo/exif.ts";
import {
  MANIFEST_PATH,
  type PhotoEntry,
  readManifest,
  writeManifest,
} from "../src/lib/photo/manifest.ts";
import { planTiers } from "../src/lib/photo/sizes.ts";
import { slugify } from "../src/lib/photo/slug.ts";

const USAGE = `Usage: node scripts/photo-add.ts [--series "Name"] [--publish] <files...>

Ingests JPEG photos: reads EXIF, generates WebP tiers (thumb/grid/full/loupe),
and upserts entries in src/data/photos/manifest.json.

Options:
  --series <name>   Attach photos to a named series
  --publish         Mark new entries public immediately
  -h, --help        Show this help`;

const JPEG_MAGIC = [0xff, 0xd8, 0xff];

function isJpeg(buffer: Buffer): boolean {
  return JPEG_MAGIC.every((byte, i) => buffer[i] === byte);
}

/** Decode once (auto-oriented), write every planned WebP tier, return their dims + bytes. */
async function buildTiers(buffer: Buffer, id: string, publicDir: string) {
  const pipeline = sharp(buffer).rotate();
  const meta = await pipeline.metadata();
  const width = meta.autoOrient.width;
  const height = meta.autoOrient.height;

  const dir = path.join(publicDir, id);
  await mkdir(dir, { recursive: true });

  const tiers: PhotoEntry["tiers"] = {};
  for (const plan of planTiers(width, height)) {
    const { data, info } = await pipeline
      .clone()
      .resize({
        width: plan.width,
        height: plan.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: plan.quality })
      .toBuffer({ resolveWithObject: true });
    await writeFile(path.join(dir, `${plan.tier}.webp`), data);
    tiers[plan.tier] = { w: info.width, h: info.height, bytes: data.length };
  }

  return { width, height, tiers };
}

export interface AddPhotosOptions {
  series?: string;
  publish?: boolean;
}
export interface AddPhotosEnv {
  publicDir: string;
  manifestPath: string;
}
export interface AddPhotosResult {
  ok: boolean;
  added: PhotoEntry[];
  failures: { file: string; message: string }[];
}

/** Ingest a set of JPEG files into `publicDir` and upsert them into the manifest. */
export async function addPhotos(
  files: string[],
  opts: AddPhotosOptions,
  env: AddPhotosEnv
): Promise<AddPhotosResult> {
  const manifest = await readManifest(env.manifestPath);
  const added: PhotoEntry[] = [];
  const failures: { file: string; message: string }[] = [];

  for (const file of files) {
    try {
      const buffer = await readFile(file);
      if (!isJpeg(buffer)) {
        throw new Error("not a JPEG (bad magic bytes)");
      }

      const sha256 = createHash("sha256").update(buffer).digest("hex");
      const base = slugify(path.basename(file, path.extname(file)));
      const id = `${base}-${sha256.slice(0, 6)}`;
      const index = manifest.findIndex((e) => e.sha256 === sha256);
      const existing = index >= 0 ? manifest[index] : undefined;

      const { exif, exifSource } = await readExif(buffer);
      const { width, height, tiers } = await buildTiers(buffer, existing?.id ?? id, env.publicDir);

      const series = opts.series ?? existing?.series ?? null;
      const maxSort = manifest.reduce((max, e) => Math.max(max, e.sort), -1);

      const entry: PhotoEntry = {
        id: existing?.id ?? id,
        sha256,
        series,
        seriesSlug: series ? slugify(series) : null,
        title: existing?.title ?? "Untitled",
        alt: existing?.alt ?? "",
        story: existing?.story ?? null,
        location: existing?.location ?? null,
        takenAt: exif.takenAt,
        width,
        height,
        tiers,
        exif,
        exifSource,
        public: existing?.public ?? opts.publish ?? false,
        sort: existing?.sort ?? maxSort + 1,
        addedAt: existing?.addedAt ?? new Date().toISOString(),
      };

      if (index >= 0) manifest[index] = entry;
      else manifest.push(entry);
      added.push(entry);

      console.log(
        `${index >= 0 ? "updated" : "added"} ${entry.id} (${width}x${height}, ${Object.keys(tiers).length} tiers)`
      );
      console.log(JSON.stringify(entry, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ file, message });
      console.error(`failed: ${file}: ${message}`);
    }
  }

  await writeManifest(manifest, env.manifestPath);
  return { ok: failures.length === 0, added, failures };
}

function parseArgs(argv: string[]) {
  let series: string | undefined;
  let publish = false;
  let help = false;
  const files: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--series") series = argv[++i];
    else if (arg === "--publish") publish = true;
    else files.push(arg);
  }
  return { series, publish, files, help };
}

async function main(): Promise<void> {
  const { series, publish, files, help } = parseArgs(process.argv.slice(2));

  if (help || files.length === 0) {
    console.log(USAGE);
    process.exitCode = help ? 0 : 1;
    return;
  }

  const result = await addPhotos(
    files,
    { series, publish },
    { publicDir: path.join(process.cwd(), "public/photos"), manifestPath: MANIFEST_PATH }
  );

  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
