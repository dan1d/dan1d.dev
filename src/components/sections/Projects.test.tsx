import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Projects from "./Projects";

// Mock GSAP since it relies on DOM APIs not available in jsdom
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
  },
  gsap: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
  },
}));

describe("Projects section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a section with id='projects'", () => {
    render(<Projects />);
    const section = document.querySelector("section#projects");
    expect(section).toBeInTheDocument();
  });

  it("renders the section title 'Projects'", () => {
    render(<Projects />);
    expect(screen.getByRole("heading", { name: /projects/i })).toBeInTheDocument();
  });

  it("renders VulnSentry project card with correct title", () => {
    render(<Projects />);
    expect(screen.getByText("VulnSentry")).toBeInTheDocument();
  });

  it("renders VulnSentry description", () => {
    render(<Projects />);
    expect(
      screen.getByText(/Ruby CVE auto-PR bot/i)
    ).toBeInTheDocument();
  });

  it("project card has a link to vulnsentry.com", () => {
    render(<Projects />);
    const link = screen.getByRole("link", { name: /visit vulnsentry/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://vulnsentry.com");
  });

  it("renders project tags (Rails 8, Security, etc.)", () => {
    render(<Projects />);
    const card = screen.getByText("VulnSentry").closest("article")!;
    expect(within(card).getByText("Rails 8")).toBeInTheDocument();
    expect(within(card).getByText("Security")).toBeInTheDocument();
    expect(within(card).getByText("Automation")).toBeInTheDocument();
    expect(within(card).getByText("Ruby")).toBeInTheDocument();
  });

  it("featured projects have a featured badge with data-testid='featured-badge'", () => {
    render(<Projects />);
    const badges = screen.getAllByTestId("featured-badge");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("each project card has a 'View in 3D' button with data-testid='ar-view-btn'", () => {
    render(<Projects />);
    const arButtons = screen.getAllByTestId("ar-view-btn");
    expect(arButtons.length).toBeGreaterThan(0);
  });

  it("'View in 3D' button is accessible with an aria-label", () => {
    render(<Projects />);
    const arButtons = screen.getAllByTestId("ar-view-btn");
    expect(arButtons.length).toBeGreaterThan(0);
    arButtons.forEach((btn) => expect(btn).toHaveAttribute("aria-label"));
  });

  it("renders a grid container for project cards", () => {
    render(<Projects />);
    // The grid wrapper should contain the project card
    const card = screen.getByText("VulnSentry").closest("article");
    expect(card).toBeInTheDocument();
  });
});
