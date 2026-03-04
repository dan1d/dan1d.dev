import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GitHubSkyline from "./GitHubSkyline";

// Mock next/dynamic so dynamic imports resolve synchronously in tests
vi.mock("next/dynamic", () => ({
  default: (_loader: () => Promise<{ default: React.ComponentType }>) => {
    const MockSkylineScene = () => (
      <div data-testid="skyline-canvas" aria-hidden="true" />
    );
    MockSkylineScene.displayName = "MockSkylineScene";
    return MockSkylineScene;
  },
}));

// Sample contribution data matching the SkylineCell shape
const sampleContributions = Array.from({ length: 364 }, (_, i) => ({
  date: new Date(2024, 0, 1 + i).toISOString().split("T")[0],
  count: i % 5,
  level: (i % 5) as 0 | 1 | 2 | 3 | 4,
}));

const mockApiResponse = {
  username: "dan1d",
  year: 2024,
  totalContributions: 1234,
  contributions: sampleContributions,
};

describe("GitHubSkyline section", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders section with id='github'", async () => {
    render(<GitHubSkyline />);
    const section = document.querySelector("section#github");
    expect(section).toBeInTheDocument();
  });

  it("renders a heading containing 'GitHub'", async () => {
    render(<GitHubSkyline />);
    // Wait for loading to complete
    await waitFor(() => {
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toMatch(/github/i);
    });
  });

  it("renders total contributions count after data loads", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      expect(screen.getByText(/1[,.]?234/)).toBeInTheDocument();
    });
  });

  it("renders a 'View Skyline in AR' button with data-testid='skyline-ar-btn'", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      const btn = screen.getByTestId("skyline-ar-btn");
      expect(btn).toBeInTheDocument();
    });
  });

  it("'View Skyline in AR' button links to /ar?view=skyline", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      const btn = screen.getByTestId("skyline-ar-btn");
      expect(btn).toHaveAttribute("href", "/ar?view=skyline");
    });
  });

  it("renders the 3D canvas container with data-testid='skyline-canvas'", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      expect(screen.getByTestId("skyline-canvas")).toBeInTheDocument();
    });
  });

  it("shows a loading state while data is being fetched", () => {
    // Make fetch never resolve so we can catch the loading state
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {}))
    );
    render(<GitHubSkyline />);
    // Loading skeleton or indicator should be present before data arrives
    const loadingEl = document.querySelector("[data-testid='skyline-loading']");
    expect(loadingEl).toBeInTheDocument();
  });

  it("renders username 'dan1d' somewhere in the section", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      expect(screen.getByText(/dan1d/i)).toBeInTheDocument();
    });
  });

  it("renders a year label showing the current or fetched year", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      // Should show the year from the API response (2024) or current year
      // Multiple occurrences are expected (canvas label + subtext + year selector)
      const yearEls = screen.getAllByText(/2024|2025|2026/);
      expect(yearEls.length).toBeGreaterThan(0);
    });
  });

  it("fetches data from /api/github/contributions?username=dan1d", async () => {
    render(<GitHubSkyline />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/github/contributions")
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("dan1d")
      );
    });
  });
});
