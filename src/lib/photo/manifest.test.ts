import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MANIFEST_PATH, type PhotoEntry, readManifest, validateManifest } from "./manifest.ts";

// Guards against a bad hand-edit of the real manifest reaching a deploy —
// see docs/v2-photography-plan.md §1 and §4.
describe("the committed manifest", () => {
  it("validates cleanly against public/photos", async () => {
    const entries = await readManifest(MANIFEST_PATH);
    const publicDir = path.join(process.cwd(), "public/photos");

    expect(validateManifest(entries, { publicDir })).toEqual([]);
  });
});

function makeEntry(overrides: Partial<PhotoEntry> = {}): PhotoEntry {
  return {
    id: "sunset-walk-abc123",
    sha256: "abc123",
    series: null,
    seriesSlug: null,
    title: "Sunset Walk",
    alt: "A sunset over the bay",
    story: null,
    location: null,
    takenAt: "2026-09-20T18:42:11.000Z",
    width: 4000,
    height: 3000,
    tiers: {},
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutter: null,
      iso: null,
    },
    exifSource: "none",
    public: false,
    sort: 0,
    addedAt: "2026-09-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("validateManifest", () => {
  let publicDir: string;

  beforeEach(() => {
    publicDir = mkdtempSync(path.join(tmpdir(), "photo-manifest-test-"));
  });

  afterEach(() => {
    rmSync(publicDir, { recursive: true, force: true });
  });

  function writeTierFile(id: string, tier: string): void {
    const dir = path.join(publicDir, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${tier}.webp`), "fake");
  }

  it("accepts a good entry", () => {
    const entry = makeEntry({
      public: true,
      tiers: { thumb: { w: 480, h: 360, bytes: 100 } },
    });
    writeTierFile(entry.id, "thumb");

    expect(validateManifest([entry], { publicDir })).toEqual([]);
  });

  it("rejects a public entry with an empty alt", () => {
    const entry = makeEntry({ public: true, alt: "" });

    const problems = validateManifest([entry], { publicDir });
    expect(problems.some((p) => p.includes("empty alt"))).toBe(true);
  });

  it("rejects a public entry with an empty title", () => {
    const entry = makeEntry({ public: true, title: "" });

    const problems = validateManifest([entry], { publicDir });
    expect(problems.some((p) => p.includes("empty title"))).toBe(true);
  });

  it("rejects an entry whose tier file is missing on disk", () => {
    const entry = makeEntry({ tiers: { thumb: { w: 480, h: 360, bytes: 100 } } });
    // Deliberately not writing the file.

    const problems = validateManifest([entry], { publicDir });
    expect(problems.some((p) => p.includes("missing tier file"))).toBe(true);
  });

  it("rejects duplicate ids", () => {
    const a = makeEntry();
    const b = makeEntry({ sha256: "a-different-hash" });

    const problems = validateManifest([a, b], { publicDir });
    expect(problems.some((p) => p.includes("duplicate id"))).toBe(true);
  });

  it("rejects a seriesSlug that doesn't match series", () => {
    const entry = makeEntry({ series: "Night Walks", seriesSlug: "wrong-slug" });

    const problems = validateManifest([entry], { publicDir });
    expect(problems.some((p) => p.includes("seriesSlug"))).toBe(true);
  });

  it("rejects a non-ISO takenAt", () => {
    const entry = makeEntry({ takenAt: "not-a-date" });

    const problems = validateManifest([entry], { publicDir });
    expect(problems.some((p) => p.includes("takenAt"))).toBe(true);
  });
});
