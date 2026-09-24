import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PhotoEntry } from "@/lib/photo/manifest";

import PhotoGrid from "./PhotoGrid";

function makePhoto(overrides: Partial<PhotoEntry>): PhotoEntry {
  return {
    id: "id",
    sha256: "x",
    series: "Night Walks",
    seriesSlug: "night-walks",
    title: "Title",
    alt: "Alt text",
    story: null,
    location: null,
    takenAt: "2026-01-01T00:00:00.000Z",
    width: 1200,
    height: 800,
    tiers: {
      thumb: { w: 480, h: 320, bytes: 1 },
      grid: { w: 1200, h: 800, bytes: 1 },
    },
    exif: { camera: null, lens: null, focalLength: null, aperture: null, shutter: null, iso: null },
    exifSource: "none",
    public: true,
    sort: 0,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("PhotoGrid", () => {
  it("renders a portrait and a landscape frame with responsive, uncropped image markup", () => {
    const photos = [
      makePhoto({
        id: "portrait",
        alt: "Portrait alt",
        width: 800,
        height: 1200,
        tiers: { thumb: { w: 320, h: 480, bytes: 1 }, grid: { w: 800, h: 1200, bytes: 1 } },
      }),
      makePhoto({
        id: "landscape",
        alt: "Landscape alt",
        width: 1600,
        height: 900,
        tiers: { thumb: { w: 480, h: 270, bytes: 1 }, grid: { w: 1600, h: 900, bytes: 1 } },
      }),
    ];

    render(<PhotoGrid photos={photos} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);

    for (const img of images) {
      expect(img).toHaveAttribute("width");
      expect(img).toHaveAttribute("height");
      expect(img.getAttribute("alt")).not.toBe("");

      const srcSet = img.getAttribute("srcset") ?? "";
      expect(srcSet).toContain("/photos/");
      const candidates = srcSet.split(",").filter((s) => s.trim().length > 0);
      expect(candidates.length).toBeGreaterThanOrEqual(2);

      const wrapper = img.closest("div") as HTMLElement;
      expect(wrapper.style.aspectRatio).not.toBe("");
    }
  });
});
