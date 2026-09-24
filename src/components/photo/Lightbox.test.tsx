import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PhotoEntry } from "@/lib/photo/manifest";

import Lightbox from "./Lightbox";

function makePhoto(overrides: Partial<PhotoEntry>): PhotoEntry {
  return {
    id: "a",
    sha256: "x",
    series: "Night Walks",
    seriesSlug: "night-walks",
    title: "A",
    alt: "alt a",
    story: null,
    location: null,
    takenAt: "2026-01-01T00:00:00.000Z",
    width: 1200,
    height: 800,
    tiers: {
      thumb: { w: 480, h: 320, bytes: 1 },
      grid: { w: 1200, h: 800, bytes: 1 },
      full: { w: 2560, h: 1707, bytes: 1 },
    },
    exif: { camera: null, lens: null, focalLength: null, aperture: null, shutter: null, iso: null },
    exifSource: "none",
    public: true,
    sort: 0,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const photos = [
  makePhoto({ id: "a", title: "A" }),
  makePhoto({ id: "b", title: "B" }),
  makePhoto({ id: "c", title: "C" }),
];

function Harness() {
  const [index, setIndex] = useState(1);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div>
      <button ref={triggerRef}>trigger</button>
      <Lightbox
        photos={photos}
        index={index}
        seriesSlug="night-walks"
        onIndexChange={setIndex}
        onClose={vi.fn()}
        returnFocusRef={triggerRef}
      />
    </div>
  );
}

function ClosableHarness() {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div>
      <button ref={triggerRef}>trigger</button>
      {open && (
        <Lightbox
          photos={photos}
          index={index}
          seriesSlug="night-walks"
          onIndexChange={setIndex}
          onClose={() => setOpen(false)}
          returnFocusRef={triggerRef}
        />
      )}
    </div>
  );
}

describe("Lightbox", () => {
  it("has dialog role and aria-modal", () => {
    render(<Harness />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("navigates with ArrowLeft and ArrowRight", () => {
    render(<Harness />);
    expect(screen.getByRole("heading", { name: "B" })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowLeft" });
    expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "C" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the originating tile", () => {
    render(<ClosableHarness />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("trigger")).toHaveFocus();
  });

  it("traps Tab focus inside the dialog", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog");
    const buttons = Array.from(dialog.querySelectorAll("button"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("uses the --dk-develop token to drive the chrome opacity transition", () => {
    render(<Harness />);
    const closeButton = screen.getByRole("button", { name: "Close" });
    expect((closeButton.parentElement as HTMLElement).style.transition).toContain("var(--dk-develop)");
  });

  it("pushes a history entry on open, and a popstate event closes the dialog and returns focus to the trigger", () => {
    const lengthBefore = window.history.length;
    render(<ClosableHarness />);
    expect(window.history.length).toBe(lengthBefore + 1);

    fireEvent.popState(window);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("trigger")).toHaveFocus();
  });
});
