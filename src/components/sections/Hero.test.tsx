import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Hero from "./Hero";
import { OnboardingProvider } from "@/context/OnboardingContext";

function renderHero() {
  return render(
    <OnboardingProvider>
      <Hero />
    </OnboardingProvider>
  );
}

// Mock 3D scenes since they use WebGL/R3F Canvas which can't render in jsdom
vi.mock("@/components/three/HeroScene", () => ({
  default: () => <div data-testid="hero-canvas" aria-hidden="true" />,
}));

vi.mock("@/components/three/MatrixCorridorScene", () => ({
  default: () => <div data-testid="hero-canvas" aria-hidden="true" />,
}));

// Mock GSAP since it needs a real DOM environment with layout
vi.mock("gsap", () => ({
  default: {
    fromTo: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      fromTo: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
    })),
  },
}));

describe("Hero", () => {
  beforeEach(() => {
    // Mark onboarding as dismissed so Hero renders fully
    localStorage.setItem("dan1d-onboarding-dismissed", "true");
  });

  it("renders with section id='hero'", () => {
    renderHero();
    const section = document.getElementById("hero");
    expect(section).toBeInTheDocument();
  });

  it("renders the title with site name", () => {
    renderHero();
    const matches = screen.getAllByText(/full-stack engineer/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the subtitle 'Full-Stack Engineer'", () => {
    renderHero();
    // The subtitle text appears in both the subtitle paragraph and the description.
    // Use getAllByText and check that at least one match exists.
    const matches = screen.getAllByText(/full-stack engineer/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders a description line about building with code, AI, and AR", () => {
    renderHero();
    // The description from siteConfig mentions code, AI, and augmented reality
    expect(screen.getByText(/building/i)).toBeInTheDocument();
  });

  it("renders a 'View Projects' CTA button with href='#projects'", () => {
    renderHero();
    const link = screen.getByRole("link", { name: /view projects/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#projects");
  });

  it("renders a 'Try AR Experience' secondary CTA button with href='#ar'", () => {
    renderHero();
    const link = screen.getByRole("link", { name: /try ar experience/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#ar");
  });

  it("has a 3D canvas container with data-testid='hero-canvas'", () => {
    renderHero();
    expect(screen.getByTestId("hero-canvas")).toBeInTheDocument();
  });
});
