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

  it("renders CodePrism project card with correct title", () => {
    render(<Projects />);
    expect(screen.getByText("CodePrism")).toBeInTheDocument();
  });

  it("renders CodePrism description", () => {
    render(<Projects />);
    expect(
      screen.getByText(/Shared AI knowledge graph for engineering teams/i)
    ).toBeInTheDocument();
  });

  it("project card has a link to codeprism.dev", () => {
    render(<Projects />);
    const link = screen.getByRole("link", { name: /visit codeprism/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://codeprism.dev");
  });

  it("renders project tags (SaaS, AI, etc.)", () => {
    render(<Projects />);
    expect(screen.getByText("SaaS")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Knowledge Graph")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("featured projects have a featured badge with data-testid='featured-badge'", () => {
    render(<Projects />);
    const badge = screen.getByTestId("featured-badge");
    expect(badge).toBeInTheDocument();
  });

  it("each project card has a 'View in AR' button with data-testid='ar-view-btn'", () => {
    render(<Projects />);
    const arButtons = screen.getAllByTestId("ar-view-btn");
    expect(arButtons.length).toBeGreaterThan(0);
  });

  it("'View in AR' button is accessible with an aria-label", () => {
    render(<Projects />);
    const arButton = screen.getByTestId("ar-view-btn");
    expect(arButton).toHaveAttribute("aria-label");
  });

  it("renders a grid container for project cards", () => {
    render(<Projects />);
    // The grid wrapper should contain the project card
    const card = screen.getByText("CodePrism").closest("article");
    expect(card).toBeInTheDocument();
  });
});
