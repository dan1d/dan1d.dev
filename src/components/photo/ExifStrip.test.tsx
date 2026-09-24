import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExifStrip from "./ExifStrip";

describe("ExifStrip", () => {
  it('renders "Nikon D850 · 85mm · f/1.8 · 1/250 · ISO 200" exactly', () => {
    render(
      <ExifStrip
        exif={{
          camera: "Nikon D850",
          lens: "NIKKOR 85mm f/1.8G",
          focalLength: 85,
          aperture: 1.8,
          shutter: "1/250",
          iso: 200,
        }}
      />
    );
    expect(screen.getByText("Nikon D850 · 85mm · f/1.8 · 1/250 · ISO 200")).toBeInTheDocument();
  });

  it("omits missing values", () => {
    render(
      <ExifStrip
        exif={{
          camera: "Nikon D850",
          lens: null,
          focalLength: null,
          aperture: 1.8,
          shutter: null,
          iso: 200,
        }}
      />
    );
    expect(screen.getByText("Nikon D850 · f/1.8 · ISO 200")).toBeInTheDocument();
  });

  it('shows "EXIF unavailable" when every field is null', () => {
    render(
      <ExifStrip
        exif={{ camera: null, lens: null, focalLength: null, aperture: null, shutter: null, iso: null }}
      />
    );
    expect(screen.getByText("EXIF unavailable")).toBeInTheDocument();
  });
});
