// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4
  color: string;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionData {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface SkylineCell {
  x: number;      // week index (0-51)
  z: number;      // day of week (0-6)
  height: number; // normalized 0-1
  count: number;  // raw count
  level: number;  // 0-4
  date: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTRIBUTION_LEVEL_MAP: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const WEEKS_PER_YEAR = 52;
const DAYS_PER_WEEK = 7;

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
  query($username: String!, $from: DateTime, $to: DateTime) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              color
            }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// transformContributionData
// ---------------------------------------------------------------------------

/**
 * Transforms a raw GitHub GraphQL contributionCalendar response into a
 * typed ContributionData object.
 *
 * Returns an empty ContributionData when the input is null/undefined or the
 * expected data path is missing.
 */
export function transformContributionData(raw: unknown): ContributionData {
  const empty: ContributionData = { totalContributions: 0, weeks: [] };

  if (raw == null) return empty;

  try {
    const calendar = (raw as any)?.data?.user?.contributionsCollection
      ?.contributionCalendar;

    if (calendar == null) return empty;

    const totalContributions: number =
      typeof calendar.totalContributions === "number"
        ? calendar.totalContributions
        : 0;

    const rawWeeks: any[] = Array.isArray(calendar.weeks) ? calendar.weeks : [];

    const weeks: ContributionWeek[] = rawWeeks.map((rawWeek: any) => {
      const rawDays: any[] = Array.isArray(rawWeek?.contributionDays)
        ? rawWeek.contributionDays
        : [];

      const days: ContributionDay[] = rawDays.map((rawDay: any) => ({
        date: String(rawDay?.date ?? ""),
        count:
          typeof rawDay?.contributionCount === "number"
            ? rawDay.contributionCount
            : 0,
        level: CONTRIBUTION_LEVEL_MAP[rawDay?.contributionLevel] ?? 0,
        color: String(rawDay?.color ?? "#ebedf0"),
      }));

      return { days };
    });

    return { totalContributions, weeks };
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// generateSkylineData
// ---------------------------------------------------------------------------

/**
 * Takes flat ContributionData and produces a 52 × 7 grid of SkylineCell
 * objects suitable for 3-D rendering.
 *
 * Heights are normalised to [0, 1] relative to the maximum daily count.
 * Weeks with missing data are padded with zero-count cells so the output
 * always contains exactly 52 * 7 = 364 cells.
 */
export function generateSkylineData(data: ContributionData): SkylineCell[] {
  // Determine the maximum contribution count across all days
  let maxCount = 0;
  for (const week of data.weeks) {
    for (const day of week.days) {
      if (day.count > maxCount) maxCount = day.count;
    }
  }

  const cells: SkylineCell[] = [];

  for (let wi = 0; wi < WEEKS_PER_YEAR; wi++) {
    const week = data.weeks[wi] ?? null;

    for (let di = 0; di < DAYS_PER_WEEK; di++) {
      const day: ContributionDay | null = week?.days[di] ?? null;

      const count = day?.count ?? 0;
      const height = maxCount > 0 ? count / maxCount : 0;

      cells.push({
        x: wi,
        z: di,
        height,
        count,
        level: day?.level ?? 0,
        date: day?.date ?? "",
        color: day?.color ?? "#ebedf0",
      });
    }
  }

  return cells;
}

// ---------------------------------------------------------------------------
// fetchContributions  (requires GITHUB_TOKEN)
// ---------------------------------------------------------------------------

/**
 * Fetches contribution data for the given username via the GitHub GraphQL API.
 * Requires a valid personal access token.
 */
export async function fetchContributions(
  username: string,
  token: string
): Promise<ContributionData> {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
  const to = now.toISOString();

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { username, from, to },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  const raw: unknown = await response.json();
  return transformContributionData(raw);
}

// ---------------------------------------------------------------------------
// scrapeContributions  (fallback — no token required)
// ---------------------------------------------------------------------------

/**
 * Fallback: fetches the public GitHub contributions page for a user and parses
 * the embedded SVG / HTML to extract contribution data.
 *
 * GitHub renders contribution data as <rect> elements with data attributes
 * inside the contributions calendar SVG.
 */
export async function scrapeContributions(
  username: string
): Promise<ContributionData> {
  const url = `https://github.com/users/${username}/contributions`;

  const response = await fetch(url, {
    headers: {
      // Request plain HTML; GitHub returns a partial HTML fragment for this
      // endpoint that contains the contribution graph.
      Accept: "text/html",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch GitHub contributions page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  return parseContributionsHtml(html);
}

// ---------------------------------------------------------------------------
// parseContributionsHtml  (internal helper, exported for testing)
// ---------------------------------------------------------------------------

/**
 * Parses the HTML fragment returned by github.com/users/USERNAME/contributions.
 *
 * GitHub renders contribution data as <td> elements (not <rect>) with
 * `data-date` and `data-level` attributes. Contribution counts come from
 * sibling <tool-tip> elements like:
 *   "10 contributions on March 2nd."
 *   "No contributions on March 9th."
 *
 * The total is extracted from the <h2> heading:
 *   "2,823 contributions in the last year"
 */
export function parseContributionsHtml(html: string): ContributionData {
  // Step 1: Extract total from the heading
  const totalMatch = html.match(
    />\s*([\d,]+)\s*\n?\s*contributions?\s/i
  );
  const parsedTotal = totalMatch
    ? parseInt(totalMatch[1].replace(/,/g, ""), 10)
    : 0;

  // Step 2: Match <td> elements with data-date and data-level
  // Format: <td ... data-date="2025-03-02" ... data-level="1" ...>
  const tdRegex =
    /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/gi;

  // Step 3: Match <tool-tip> elements to get exact counts
  // Format: <tool-tip ... for="contribution-day-component-X-Y" ...>10 contributions on March 2nd.</tool-tip>
  // or: <tool-tip ...>No contributions on March 9th.</tool-tip>
  const tooltipRegex =
    /<tool-tip[^>]+for="contribution-day-component-(\d+)-(\d+)"[^>]*>([^<]*)<\/tool-tip>/gi;

  // Build a map of (col-row) -> count from tooltips
  const tooltipCounts = new Map<string, number>();
  let tooltipMatch: RegExpExecArray | null;
  while ((tooltipMatch = tooltipRegex.exec(html)) !== null) {
    const key = `${tooltipMatch[1]}-${tooltipMatch[2]}`;
    const text = tooltipMatch[3].trim();
    if (text.startsWith("No ")) {
      tooltipCounts.set(key, 0);
    } else {
      const countMatch = text.match(/^(\d+)/);
      tooltipCounts.set(key, countMatch ? parseInt(countMatch[1], 10) : 0);
    }
  }

  // Step 4: Also extract the ix (column) from td elements for tooltip matching
  const tdFullRegex =
    /data-ix="(\d+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="contribution-day-component-(\d+)-(\d+)"[^>]*data-level="(\d)"/gi;

  interface RawCell {
    date: string;
    level: number;
    col: number;
    row: number;
  }

  const cells: RawCell[] = [];
  let match: RegExpExecArray | null;

  while ((match = tdFullRegex.exec(html)) !== null) {
    cells.push({
      date: match[2],
      level: parseInt(match[5], 10) || 0,
      col: parseInt(match[3], 10),
      row: parseInt(match[4], 10),
    });
  }

  // Fallback: simpler regex if the full one didn't match (different attribute order)
  if (cells.length === 0) {
    let simpleMatch: RegExpExecArray | null;
    let fallbackIdx = 0;
    while ((simpleMatch = tdRegex.exec(html)) !== null) {
      cells.push({
        date: simpleMatch[1],
        level: parseInt(simpleMatch[2], 10) || 0,
        col: Math.floor(fallbackIdx / DAYS_PER_WEEK),
        row: fallbackIdx % DAYS_PER_WEEK,
      });
      fallbackIdx++;
    }
  }

  if (cells.length === 0) {
    return { totalContributions: 0, weeks: [] };
  }

  // Map level -> approximate count when no tooltip data available
  const LEVEL_DEFAULT_COUNTS: Record<number, number> = {
    0: 0,
    1: 2,
    2: 6,
    3: 12,
    4: 20,
  };

  const days: ContributionDay[] = cells.map((cell) => {
    const key = `${cell.col}-${cell.row}`;
    const count = tooltipCounts.has(key)
      ? tooltipCounts.get(key)!
      : LEVEL_DEFAULT_COUNTS[cell.level] ?? 0;

    return {
      date: cell.date,
      count,
      level: cell.level,
      color: levelToDefaultColor(cell.level),
    };
  });

  // Group days into weeks
  const weeks: ContributionWeek[] = [];
  for (let i = 0; i < days.length; i += DAYS_PER_WEEK) {
    weeks.push({ days: days.slice(i, i + DAYS_PER_WEEK) });
  }

  // Use the heading total if available, otherwise sum up
  const totalContributions =
    parsedTotal > 0
      ? parsedTotal
      : days.reduce((sum, d) => sum + d.count, 0);

  return { totalContributions, weeks };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function levelToDefaultColor(level: number): string {
  const colors: Record<number, string> = {
    0: "#ebedf0",
    1: "#9be9a8",
    2: "#40c463",
    3: "#30a14e",
    4: "#216e39",
  };
  return colors[level] ?? "#ebedf0";
}
