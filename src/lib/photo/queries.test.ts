import { describe, expect, it, vi } from "vitest";

import type { PhotoEntry } from "./manifest.ts";
import { photosInSeries, publicPhotos, seriesList } from "./queries.ts";

function makeEntry(overrides: Partial<PhotoEntry>): PhotoEntry {
  return {
    id: "id",
    sha256: "x",
    series: null,
    seriesSlug: null,
    title: "Title",
    alt: "Alt",
    story: null,
    location: null,
    takenAt: "2026-01-01T00:00:00.000Z",
    width: 1200,
    height: 800,
    tiers: {},
    exif: { camera: null, lens: null, focalLength: null, aperture: null, shutter: null, iso: null },
    exifSource: "none",
    public: false,
    sort: 0,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("publicPhotos", () => {
  it("excludes unpublished entries and sorts the rest by takenAt desc", () => {
    const entries = [
      makeEntry({ id: "old", public: true, takenAt: "2025-01-01T00:00:00.000Z" }),
      makeEntry({ id: "hidden", public: false, takenAt: "2026-06-01T00:00:00.000Z" }),
      makeEntry({ id: "new", public: true, takenAt: "2026-06-01T00:00:00.000Z" }),
    ];

    expect(publicPhotos(entries).map((p) => p.id)).toEqual(["new", "old"]);
  });
});

describe("seriesList", () => {
  it("only counts public entries and covers with the most recent public photo", () => {
    const entries = [
      makeEntry({
        id: "a",
        public: true,
        series: "Night Walks",
        seriesSlug: "night-walks",
        takenAt: "2026-01-01T00:00:00.000Z",
      }),
      makeEntry({
        id: "b",
        public: true,
        series: "Night Walks",
        seriesSlug: "night-walks",
        takenAt: "2026-03-01T00:00:00.000Z",
      }),
      makeEntry({
        id: "hidden",
        public: false,
        series: "Night Walks",
        seriesSlug: "night-walks",
        takenAt: "2026-06-01T00:00:00.000Z",
      }),
    ];

    const series = seriesList(entries);
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ slug: "night-walks", title: "Night Walks", count: 2 });
    expect(series[0].cover.id).toBe("b");
  });
});

describe("photosInSeries", () => {
  it("excludes unpublished entries from a series", () => {
    const entries = [
      makeEntry({ id: "a", public: true, series: "Night Walks", seriesSlug: "night-walks" }),
      makeEntry({ id: "hidden", public: false, series: "Night Walks", seriesSlug: "night-walks" }),
    ];

    expect(photosInSeries(entries, "night-walks").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("the /photo sitemap", () => {
  it("never lists an unpublished photo", async () => {
    vi.resetModules();
    vi.doMock("@/lib/photo/manifest", async () => {
      const actual = await vi.importActual<typeof import("@/lib/photo/manifest")>("@/lib/photo/manifest");
      return {
        ...actual,
        readManifest: async () => [
          makeEntry({ id: "shown", public: true, series: "Night Walks", seriesSlug: "night-walks" }),
          makeEntry({ id: "hidden", public: false, series: "Night Walks", seriesSlug: "night-walks" }),
        ],
      };
    });

    const { default: sitemap } = await import("@/app/photo/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((u) => u.includes("shown"))).toBe(true);
    expect(urls.some((u) => u.includes("hidden"))).toBe(false);

    vi.doUnmock("@/lib/photo/manifest");
  });
});
