import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { addPhotos } from "./photo-add.ts";

const BYTE_LIMITS = { thumb: 60_000, grid: 250_000, full: 900_000, loupe: 3_000_000 } as const;

describe("addPhotos", () => {
  let root: string;
  let publicDir: string;
  let manifestPath: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "photo-add-test-"));
    publicDir = path.join(root, "public");
    manifestPath = path.join(root, "manifest.json");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("writes four WebP tiers within budget and records a non-public entry", async () => {
    const width = 8256;
    const height = 5504;
    const file = path.join(root, "d850-export.jpg");
    await sharp({ create: { width, height, channels: 3, background: { r: 40, g: 90, b: 60 } } })
      .jpeg({ quality: 90 })
      .toFile(file);

    const result = await addPhotos([file], {}, { publicDir, manifestPath });

    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.added).toHaveLength(1);

    const entry = result.added[0];
    expect(entry.public).toBe(false);

    const ratio = width / height;
    for (const [tier, planned] of Object.entries({ thumb: 480, grid: 1200, full: 2560, loupe: 4096 })) {
      const info = entry.tiers[tier as keyof typeof entry.tiers];
      expect(info).toBeDefined();
      expect(Math.abs(info!.w - planned)).toBeLessThanOrEqual(1);
      expect(Math.abs(info!.h - Math.round(planned / ratio))).toBeLessThanOrEqual(1);
      expect(info!.bytes).toBeLessThan(BYTE_LIMITS[tier as keyof typeof BYTE_LIMITS]);
    }
  }, 30_000);

  it("updates rather than duplicates on a re-run with the same bytes, preserving edits", async () => {
    const file = path.join(root, "night-walk.jpg");
    await sharp({ create: { width: 2000, height: 1200, channels: 3, background: { r: 10, g: 30, b: 20 } } })
      .jpeg({ quality: 90 })
      .toFile(file);

    const first = await addPhotos([file], {}, { publicDir, manifestPath });
    first.added[0].title = "Edited Title";
    const { writeManifest } = await import("../src/lib/photo/manifest.ts");
    await writeManifest([first.added[0]], manifestPath);

    const second = await addPhotos([file], {}, { publicDir, manifestPath });

    expect(second.added).toHaveLength(1);
    expect(second.added[0].id).toBe(first.added[0].id);
    expect(second.added[0].title).toBe("Edited Title");

    const { readManifest } = await import("../src/lib/photo/manifest.ts");
    const manifest = await readManifest(manifestPath);
    expect(manifest).toHaveLength(1);
  }, 20_000);

  it("rejects a PDF renamed to .jpg with a readable message and writes no files", async () => {
    const file = path.join(root, "fake.jpg");
    writeFileSync(file, Buffer.from("%PDF-1.4\n%fake pdf content"));

    const result = await addPhotos([file], {}, { publicDir, manifestPath });

    expect(result.ok).toBe(false);
    expect(result.added).toEqual([]);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].message).toMatch(/JPEG/i);

    expect(() => readdirSync(publicDir)).toThrow();
  });
});
