import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Instructions from "./Instructions";

describe("Instructions overlay", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders when visible (no dismissed key in localStorage)", () => {
    render(<Instructions />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a title like 'Welcome to dan1d.dev'", () => {
    render(<Instructions />);
    expect(
      screen.getByRole("heading", { name: /welcome to dan1d\.dev/i })
    ).toBeInTheDocument();
  });

  it("explains the 3D interactive features", () => {
    render(<Instructions />);
    const matches = screen.getAllByText(/3D/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("mentions AR capabilities", () => {
    render(<Instructions />);
    expect(screen.getByText(/AR Experience/i)).toBeInTheDocument();
  });

  it("has a dismiss button with data-testid='dismiss-instructions'", () => {
    render(<Instructions />);
    expect(screen.getByTestId("dismiss-instructions")).toBeInTheDocument();
  });

  it("dismiss button has accessible text like 'Got it'", () => {
    render(<Instructions />);
    expect(
      screen.getByRole("button", { name: /got it/i })
    ).toBeInTheDocument();
  });

  it("mentions scrolling to explore sections", () => {
    render(<Instructions />);
    const matches = screen.getAllByText(/scroll/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("lists the Projects section", () => {
    render(<Instructions />);
    const matches = screen.getAllByText(/projects/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("lists the GitHub Skyline section", () => {
    render(<Instructions />);
    const matches = screen.getAllByText(/github skyline/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("lists the AR Experience section", () => {
    render(<Instructions />);
    const matches = screen.getAllByText(/ar experience/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("does NOT render when dismissed via the button", () => {
    render(<Instructions />);
    const btn = screen.getByTestId("dismiss-instructions");
    fireEvent.click(btn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("saves dismissal to localStorage when dismissed", () => {
    render(<Instructions />);
    const btn = screen.getByTestId("dismiss-instructions");
    fireEvent.click(btn);
    expect(localStorage.getItem("dan1d-onboarding-dismissed")).toBeTruthy();
  });

  it("does NOT render when localStorage already has the dismissed key", () => {
    localStorage.setItem("dan1d-onboarding-dismissed", "true");
    render(<Instructions />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
