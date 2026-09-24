import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { readExif } from "./exif.ts";

/**
 * sharp's `withExif` only writes tags into a named IFD block; standard
 * "Photo" sub-IFD tags (aperture, shutter, ISO, focal length, lens, date)
 * only round-trip through exifr's tag dictionary when placed under "IFD2" —
 * placing them under "IFD0" (alongside Make/Model) or a literal "ExifIFD"
 * key leaves them as unnamed numeric tags. Verified empirically against
 * sharp 0.35.4 + exifr 7.1.3.
 */
async function jpegWithExif(): Promise<Buffer> {
  return sharp({
    create: { width: 200, height: 100, channels: 3, background: { r: 20, g: 80, b: 40 } },
  })
    .withExif({
      IFD0: { Make: "NIKON CORPORATION", Model: "NIKON D850" },
      IFD2: {
        LensModel: "NIKKOR 85mm f/1.8G",
        FNumber: "1.8",
        ExposureTime: "1/250",
        ISOSpeedRatings: "200",
        FocalLength: "85",
        DateTimeOriginal: "2026:09:20 18:42:11",
      },
    })
    .jpeg()
    .toBuffer();
}

async function jpegWithoutExif(): Promise<Buffer> {
  return sharp({ create: { width: 4, height: 4, channels: 3, background: "black" } })
    .jpeg()
    .toBuffer();
}

describe("readExif", () => {
  it("normalizes camera, lens, aperture, shutter, iso and takenAt from EXIF", async () => {
    const { exif, exifSource } = await readExif(await jpegWithExif());

    expect(exifSource).toBe("file");
    expect(exif.camera).toBe("Nikon D850");
    expect(exif.lens).toBe("NIKKOR 85mm f/1.8G");
    expect(exif.aperture).toBe(1.8);
    expect(exif.shutter).toBe("1/250");
    expect(exif.iso).toBe(200);
    expect(exif.focalLength).toBe(85);
    expect(typeof exif.takenAt).toBe("string");
    expect(new Date(exif.takenAt!).toString()).not.toBe("Invalid Date");
  });

  it("never returns a GPS key", async () => {
    const { exif } = await readExif(await jpegWithExif());

    const hasGpsKey = Object.keys(exif).some((k) => /gps/i.test(k));
    expect(hasGpsKey).toBe(false);
  });

  it("yields exifSource 'none' and all-null fields for a stripped image, without throwing", async () => {
    const { exif, exifSource } = await readExif(await jpegWithoutExif());

    expect(exifSource).toBe("none");
    expect(exif).toEqual({
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutter: null,
      iso: null,
      takenAt: null,
    });
  });

  it("does not throw on a non-JPEG buffer", async () => {
    const { exif, exifSource } = await readExif(Buffer.from([0x00, 0x01, 0x02, 0x03]));

    expect(exifSource).toBe("none");
    expect(exif.camera).toBeNull();
  });
});
