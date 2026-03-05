import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renders the site name 'dan1d' as a logo/brand", () => {
    render(<Navbar />);
    expect(screen.getByText("dan1d")).toBeInTheDocument();
  });

  it("has a navigation landmark with an accessible label", () => {
    render(<Navbar />);
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
  });

  it("renders a Projects navigation link with correct href", () => {
    render(<Navbar />);
    const link = screen.getByRole("link", { name: /projects/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/#projects");
  });

  it("renders an AR Experience navigation link with correct href", () => {
    render(<Navbar />);
    const link = screen.getByRole("link", { name: /ar experience/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/#ar");
  });

  it("renders a GitHub navigation link with correct href", () => {
    render(<Navbar />);
    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/#github");
  });

  it("renders a 'View in AR' CTA button", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /view in ar/i })).toBeInTheDocument();
  });
});
