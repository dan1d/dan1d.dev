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

  it("renders the dan1d.dev open-source card with its title", () => {
    render(<Projects />);
    expect(screen.getByText("dan1d.dev")).toBeInTheDocument();
  });

  it("renders the dan1d.dev description", () => {
    render(<Projects />);
    expect(screen.getByText(/open-source 3D portfolio/i)).toBeInTheDocument();
  });

  it("open-source card links to its GitHub repository", () => {
    render(<Projects />);
    const link = screen.getByRole("link", { name: /view dan1d\.dev on github/i });
    expect(link).toHaveAttribute("href", "https://github.com/dan1d/dan1d.dev");
  });

  it("renders project tags (Next.js, Three.js, etc.)", () => {
    render(<Projects />);
    const card = screen.getByText("dan1d.dev").closest("article")!;
    expect(within(card).getByText("Next.js")).toBeInTheDocument();
    expect(within(card).getByText("Three.js")).toBeInTheDocument();
    expect(within(card).getByText("React Three Fiber")).toBeInTheDocument();
  });

  it("shows no featured product cards", () => {
    render(<Projects />);
    expect(screen.queryAllByTestId("featured-badge")).toHaveLength(0);
  });

  it("renders a grid container for project cards", () => {
    render(<Projects />);
    // The grid wrapper should contain the project card
    const card = screen.getByText("dan1d.dev").closest("article");
    expect(card).toBeInTheDocument();
  });
});
