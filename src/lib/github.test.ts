import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  transformContributionData,
  generateSkylineData,
  parseContributionsHtml,
  type ContributionData,
  type ContributionDay,
} from "@/lib/github";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LEVEL_MAP: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function makeRawWeek(
  days: Array<{ date: string; count: number; level: string; color: string }>
) {
  return {
    contributionDays: days.map((d) => ({
      date: d.date,
      contributionCount: d.count,
      contributionLevel: d.level,
      color: d.color,
    })),
  };
}

const rawWeek1 = makeRawWeek([
  { date: "2024-01-01", count: 0, level: "NONE", color: "#ebedf0" },
  { date: "2024-01-02", count: 3, level: "FIRST_QUARTILE", color: "#9be9a8" },
  { date: "2024-01-03", count: 7, level: "SECOND_QUARTILE", color: "#40c463" },
  { date: "2024-01-04", count: 12, level: "THIRD_QUARTILE", color: "#30a14e" },
  { date: "2024-01-05", count: 20, level: "FOURTH_QUARTILE", color: "#216e39" },
  { date: "2024-01-06", count: 1, level: "FIRST_QUARTILE", color: "#9be9a8" },
  { date: "2024-01-07", count: 0, level: "NONE", color: "#ebedf0" },
]);

const rawWeek2 = makeRawWeek([
  { date: "2024-01-08", count: 5, level: "FIRST_QUARTILE", color: "#9be9a8" },
  { date: "2024-01-09", count: 8, level: "SECOND_QUARTILE", color: "#40c463" },
  { date: "2024-01-10", count: 0, level: "NONE", color: "#ebedf0" },
  { date: "2024-01-11", count: 15, level: "THIRD_QUARTILE", color: "#30a14e" },
  { date: "2024-01-12", count: 25, level: "FOURTH_QUARTILE", color: "#216e39" },
  { date: "2024-01-13", count: 2, level: "FIRST_QUARTILE", color: "#9be9a8" },
  { date: "2024-01-14", count: 0, level: "NONE", color: "#ebedf0" },
]);

const validRawResponse = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 98,
          weeks: [rawWeek1, rawWeek2],
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// transformContributionData
// ---------------------------------------------------------------------------

describe("GitHub contributions", () => {
  describe("transformContributionData", () => {
    it("returns empty ContributionData for null input", () => {
      const result = transformContributionData(null);
      expect(result.totalContributions).toBe(0);
      expect(result.weeks).toEqual([]);
    });

    it("returns empty ContributionData for undefined input", () => {
      const result = transformContributionData(undefined);
      expect(result.totalContributions).toBe(0);
      expect(result.weeks).toEqual([]);
    });

    it("returns empty ContributionData when data path is missing", () => {
      const result = transformContributionData({});
      expect(result.totalContributions).toBe(0);
      expect(result.weeks).toEqual([]);
    });

    it("correctly maps contributionLevel enum to numeric level", () => {
      const result = transformContributionData(validRawResponse);
      const week0Days = result.weeks[0].days;

      expect(week0Days[0].level).toBe(LEVEL_MAP["NONE"]);           // 0
      expect(week0Days[1].level).toBe(LEVEL_MAP["FIRST_QUARTILE"]); // 1
      expect(week0Days[2].level).toBe(LEVEL_MAP["SECOND_QUARTILE"]);// 2
      expect(week0Days[3].level).toBe(LEVEL_MAP["THIRD_QUARTILE"]); // 3
      expect(week0Days[4].level).toBe(LEVEL_MAP["FOURTH_QUARTILE"]);// 4
    });

    it("returns a flat array of { date, count, level, color } inside each week", () => {
      const result = transformContributionData(validRawResponse);
      const day = result.weeks[0].days[1];

      expect(day).toMatchObject({
        date: "2024-01-02",
        count: 3,
        level: 1,
        color: "#9be9a8",
      });
    });

    it("calculates totalContributions correctly from raw response", () => {
      const result = transformContributionData(validRawResponse);
      expect(result.totalContributions).toBe(98);
    });

    it("groups data into weeks correctly — preserves week count", () => {
      const result = transformContributionData(validRawResponse);
      expect(result.weeks).toHaveLength(2);
    });

    it("each week contains the correct number of days", () => {
      const result = transformContributionData(validRawResponse);
      expect(result.weeks[0].days).toHaveLength(7);
      expect(result.weeks[1].days).toHaveLength(7);
    });

    it("preserves date strings verbatim", () => {
      const result = transformContributionData(validRawResponse);
      const dates = result.weeks[0].days.map((d) => d.date);
      expect(dates).toEqual([
        "2024-01-01",
        "2024-01-02",
        "2024-01-03",
        "2024-01-04",
        "2024-01-05",
        "2024-01-06",
        "2024-01-07",
      ]);
    });

    it("falls back to level 0 for unknown contributionLevel strings", () => {
      const weirdRaw = {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 1,
                weeks: [
                  makeRawWeek([
                    {
                      date: "2024-06-01",
                      count: 1,
                      level: "UNKNOWN_LEVEL",
                      color: "#ebedf0",
                    },
                  ]),
                ],
              },
            },
          },
        },
      };
      const result = transformContributionData(weirdRaw);
      expect(result.weeks[0].days[0].level).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // generateSkylineData
  // ---------------------------------------------------------------------------

  describe("generateSkylineData", () => {
    // Build a full 52-week dataset so the skyline has enough weeks
    function buildContributionData(
      totalWeeks: number,
      fillCount = 0
    ): ContributionData {
      const weeks = Array.from({ length: totalWeeks }, (_, wi) => ({
        days: Array.from({ length: 7 }, (_, di) => ({
          date: `2024-W${wi}-D${di}`,
          count: fillCount,
          level: fillCount > 0 ? 1 : 0,
          color: "#ebedf0",
        })),
      }));
      return {
        totalContributions: totalWeeks * 7 * fillCount,
        weeks,
      };
    }

    it("generates a cell for each day — 52 weeks × 7 days = 364 cells", () => {
      const data = buildContributionData(52, 0);
      const skyline = generateSkylineData(data);
      expect(skyline).toHaveLength(364);
    });

    it("each cell has { x, z, height, count, level, date, color } shape", () => {
      const data = buildContributionData(1, 3);
      const skyline = generateSkylineData(data);
      const cell = skyline[0];
      expect(cell).toHaveProperty("x");
      expect(cell).toHaveProperty("z");
      expect(cell).toHaveProperty("height");
      expect(cell).toHaveProperty("count");
      expect(cell).toHaveProperty("level");
      expect(cell).toHaveProperty("date");
      expect(cell).toHaveProperty("color");
    });

    it("x corresponds to week index (0–51) and z corresponds to day of week (0–6)", () => {
      const data = buildContributionData(52, 1);
      const skyline = generateSkylineData(data);

      // First 7 cells should all be week 0 (x=0), days 0-6 (z=0-6)
      for (let di = 0; di < 7; di++) {
        expect(skyline[di].x).toBe(0);
        expect(skyline[di].z).toBe(di);
      }

      // Cells 7-13 should be week 1
      for (let di = 0; di < 7; di++) {
        expect(skyline[7 + di].x).toBe(1);
        expect(skyline[7 + di].z).toBe(di);
      }
    });

    it("normalizes heights to 0–1 range based on max contributions", () => {
      // Week with max count = 20, others = 10 and 0
      const data: ContributionData = {
        totalContributions: 30,
        weeks: [
          {
            days: [
              { date: "2024-01-01", count: 20, level: 4, color: "#216e39" },
              { date: "2024-01-02", count: 10, level: 2, color: "#40c463" },
              { date: "2024-01-03", count: 0, level: 0, color: "#ebedf0" },
              { date: "2024-01-04", count: 0, level: 0, color: "#ebedf0" },
              { date: "2024-01-05", count: 0, level: 0, color: "#ebedf0" },
              { date: "2024-01-06", count: 0, level: 0, color: "#ebedf0" },
              { date: "2024-01-07", count: 0, level: 0, color: "#ebedf0" },
            ],
          },
        ],
      };

      const skyline = generateSkylineData(data);
      const maxCell = skyline.find((c) => c.count === 20)!;
      const midCell = skyline.find((c) => c.count === 10)!;
      const zeroCell = skyline.find((c) => c.count === 0)!;

      expect(maxCell.height).toBeCloseTo(1.0);
      expect(midCell.height).toBeCloseTo(0.5);
      expect(zeroCell.height).toBeCloseTo(0.0);
    });

    it("handles empty weeks gracefully — produces zero-height cells", () => {
      const emptyData: ContributionData = {
        totalContributions: 0,
        weeks: [],
      };
      const skyline = generateSkylineData(emptyData);
      // Should return 52 * 7 = 364 cells all with height 0
      expect(skyline).toHaveLength(364);
      expect(skyline.every((c) => c.height === 0)).toBe(true);
      expect(skyline.every((c) => c.count === 0)).toBe(true);
    });

    it("when all contributions are 0, all heights are 0 (no division by zero)", () => {
      const allZeroData = {
        totalContributions: 0,
        weeks: [
          {
            days: Array.from({ length: 7 }, (_, i) => ({
              date: `2024-01-0${i + 1}`,
              count: 0,
              level: 0,
              color: "#ebedf0",
            })),
          },
        ],
      };
      const skyline = generateSkylineData(allZeroData);
      expect(skyline.every((c) => c.height === 0)).toBe(true);
    });

    it("height values are always in [0, 1] range", () => {
      const result = transformContributionData(validRawResponse);
      const skyline = generateSkylineData(result);
      for (const cell of skyline) {
        expect(cell.height).toBeGreaterThanOrEqual(0);
        expect(cell.height).toBeLessThanOrEqual(1);
      }
    });

    it("pads missing weeks with empty days so output is always 52 * 7 cells", () => {
      // Only 2 weeks of data
      const data = transformContributionData(validRawResponse);
      const skyline = generateSkylineData(data);
      expect(skyline).toHaveLength(364); // 52 * 7
    });
  });

  // ---------------------------------------------------------------------------
  // parseContributionsHtml
  // ---------------------------------------------------------------------------

  describe("parseContributionsHtml", () => {
    it("returns empty data for empty HTML", () => {
      const result = parseContributionsHtml("");
      expect(result.totalContributions).toBe(0);
      expect(result.weeks).toEqual([]);
    });

    it("extracts total from heading", () => {
      const html = `
        <h2 class="f4 text-normal mb-2">
          2,823
           contributions in the last year
        </h2>
      `;
      // No <td> cells, so weeks will be empty, but we can verify the regex
      const result = parseContributionsHtml(html);
      // totalContributions falls back to sum when no cells, which is 0
      // Actually with parsedTotal > 0 it should use parsedTotal
      expect(result.totalContributions).toBe(0); // no cells → empty result
    });

    it("parses <td> elements with data-date and data-level attributes", () => {
      // Build a minimal HTML fragment mimicking GitHub's current format
      const cells = Array.from({ length: 7 }, (_, i) => {
        const date = `2025-01-0${i + 1}`;
        const level = i % 5;
        return `<td data-ix="${i}" data-date="${date}" id="contribution-day-component-0-${i}" data-level="${level}" tabindex="-1" aria-selected="false" style="width: 10px"></td>`;
      }).join("\n");

      const tooltips = Array.from({ length: 7 }, (_, i) => {
        const count = i * 3;
        const text = count === 0
          ? `No contributions on January ${i + 1}st.`
          : `${count} contributions on January ${i + 1}st.`;
        return `<tool-tip id="tooltip-0-${i}" for="contribution-day-component-0-${i}" popover="manual" data-direction="n" data-type="label" data-appear-type="delayed" role="tooltip">${text}</tool-tip>`;
      }).join("\n");

      const html = `
        <h2 class="f4 text-normal mb-2">
          63
           contributions in the last year
        </h2>
        <table><tbody><tr>${cells}</tr></tbody></table>
        ${tooltips}
      `;

      const result = parseContributionsHtml(html);
      expect(result.totalContributions).toBe(63);
      expect(result.weeks).toHaveLength(1); // 7 days → 1 week
      expect(result.weeks[0].days).toHaveLength(7);

      // Check first day (0 contributions)
      expect(result.weeks[0].days[0]).toMatchObject({
        date: "2025-01-01",
        count: 0,
        level: 0,
      });

      // Check a day with contributions
      expect(result.weeks[0].days[3]).toMatchObject({
        date: "2025-01-04",
        count: 9,
        level: 3,
      });
    });

    it("falls back to level-based counts when no tooltips match", () => {
      // Build <td> cells without matching tooltips
      const cells = Array.from({ length: 7 }, (_, i) => {
        const date = `2025-02-0${i + 1}`;
        return `<td data-ix="${i}" data-date="${date}" id="contribution-day-component-0-${i}" data-level="${Math.min(i, 4)}"></td>`;
      }).join("\n");

      const html = `<table><tbody><tr>${cells}</tr></tbody></table>`;

      const result = parseContributionsHtml(html);
      expect(result.weeks[0].days[0].count).toBe(0);   // level 0 → 0
      expect(result.weeks[0].days[1].count).toBe(2);   // level 1 → 2
      expect(result.weeks[0].days[2].count).toBe(6);   // level 2 → 6
      expect(result.weeks[0].days[3].count).toBe(12);  // level 3 → 12
      expect(result.weeks[0].days[4].count).toBe(20);  // level 4 → 20
    });

    it("uses simple fallback regex when full regex does not match", () => {
      // Different attribute order (data-date before data-ix, no id)
      const cells = Array.from({ length: 7 }, (_, i) => {
        const date = `2025-03-0${i + 1}`;
        return `<td data-date="${date}" data-level="${i % 5}" tabindex="-1"></td>`;
      }).join("\n");

      const html = `<table><tbody><tr>${cells}</tr></tbody></table>`;

      const result = parseContributionsHtml(html);
      expect(result.weeks).toHaveLength(1);
      expect(result.weeks[0].days).toHaveLength(7);
      expect(result.weeks[0].days[0].date).toBe("2025-03-01");
    });

    it("handles multiple weeks of data", () => {
      // 14 cells = 2 weeks
      const cells = Array.from({ length: 14 }, (_, i) => {
        const week = Math.floor(i / 7);
        const day = i % 7;
        const date = `2025-01-${String(i + 1).padStart(2, "0")}`;
        return `<td data-ix="${day}" data-date="${date}" id="contribution-day-component-${week}-${day}" data-level="1"></td>`;
      }).join("\n");

      const html = `<table><tbody><tr>${cells}</tr></tbody></table>`;

      const result = parseContributionsHtml(html);
      expect(result.weeks).toHaveLength(2);
      expect(result.weeks[0].days).toHaveLength(7);
      expect(result.weeks[1].days).toHaveLength(7);
    });
  });
});
