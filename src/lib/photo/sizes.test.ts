import { describe, expect, it } from "vitest";

import { planTiers } from "./sizes.ts";

describe("planTiers", () => {
  it("preserves aspect ratio within 1 px for a landscape source", () => {
    const width = 6000;
    const height = 4000;
    const ratio = width / height;

    for (const plan of planTiers(width, height)) {
      const expectedHeight = plan.width / ratio;
      expect(Math.abs(plan.height - expectedHeight)).toBeLessThanOrEqual(1);
    }
  });

  it("preserves aspect ratio within 1 px for a portrait source", () => {
    const width = 4000;
    const height = 6000;
    const ratio = height / width;

    for (const plan of planTiers(width, height)) {
      const expectedWidth = plan.height / ratio;
      expect(Math.abs(plan.width - expectedWidth)).toBeLessThanOrEqual(1);
    }
  });

  it("never upscales — a 900 px source plans only thumb and grid", () => {
    const plans = planTiers(900, 600);
    expect(plans.map((p) => p.tier)).toEqual(["thumb", "grid"]);
    // The grid tier (1200 > source) is capped at the source's own size.
    const grid = plans[plans.length - 1];
    expect(grid.width).toBe(900);
    expect(grid.height).toBe(600);
  });

  it("a 5000 px source plans all four tiers", () => {
    const plans = planTiers(5000, 3000);
    expect(plans.map((p) => p.tier)).toEqual(["thumb", "grid", "full", "loupe"]);
  });

  it("never produces dimensions larger than the source", () => {
    for (const plan of planTiers(900, 1600)) {
      expect(plan.width).toBeLessThanOrEqual(900);
      expect(plan.height).toBeLessThanOrEqual(1600);
    }
  });
});
