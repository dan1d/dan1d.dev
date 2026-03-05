import { NextRequest, NextResponse } from "next/server";
import {
  fetchContributions,
  scrapeContributions,
  generateSkylineData,
  type ContributionData,
  type DetailedContributions,
  type SkylineCell,
} from "@/lib/github";

// ---------------------------------------------------------------------------
// Cache settings
// ---------------------------------------------------------------------------

// Revalidate cached responses once per hour on the Next.js data cache layer.
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface ContributionsResponse {
  username: string;
  year: number;
  totalContributions: number;
  contributions: SkylineCell[];
  detailed?: DetailedContributions | null;
}

// ---------------------------------------------------------------------------
// GET /api/github/contributions?username=dan1d
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get("username") ?? "dan1d";

  let contributionData: ContributionData;
  let detailed: DetailedContributions | null = null;

  const token = process.env.GITHUB_TOKEN;

  try {
    if (token) {
      // Primary path: authenticated GraphQL query
      const result = await fetchContributions(username, token);
      contributionData = result.data;
      detailed = result.detailed;
    } else {
      // Fallback path: HTML scrape (no token required)
      contributionData = await scrapeContributions(username);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error fetching GitHub contributions";

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }

  const skyline = generateSkylineData(contributionData);

  const body: ContributionsResponse = {
    username,
    year: new Date().getFullYear(),
    totalContributions: contributionData.totalContributions,
    contributions: skyline,
    detailed,
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      // HTTP-level caching for CDN / browser
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
