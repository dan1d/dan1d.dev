import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Resume from "./Resume";

describe("Resume section", () => {
  it("renders section with id='resume'", () => {
    render(<Resume />);
    const section = document.querySelector("section#resume");
    expect(section).toBeInTheDocument();
  });

  it("renders a heading containing 'Resume'", () => {
    render(<Resume />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/resume/i);
  });

  it("renders a 'Download PDF' link that points to /api/resume", () => {
    render(<Resume />);
    const link = screen.getByRole("link", { name: /download pdf/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/api/resume");
  });

  it("renders a 'View in 3D' button with data-testid='resume-ar-btn'", () => {
    render(<Resume />);
    const btn = screen.getByTestId("resume-ar-btn");
    expect(btn).toBeInTheDocument();
  });

  it("renders key skills from the resume", () => {
    render(<Resume />);
    // Check for a few representative skills from the skills array in projects.ts
    // getAllByText because the description paragraph may also contain skill references
    const railsMatches = screen.getAllByText(/ruby on rails/i);
    expect(railsMatches.length).toBeGreaterThan(0);
    const tsMatches = screen.getAllByText(/typescript/i);
    expect(tsMatches.length).toBeGreaterThan(0);
    const reactMatches = screen.getAllByText(/^react$/i);
    expect(reactMatches.length).toBeGreaterThan(0);
  });

  it("renders work experience highlights", () => {
    render(<Resume />);
    // Recent roles mentioned in the spec
    const acimaMatches = screen.getAllByText(/acima credit/i);
    expect(acimaMatches.length).toBeGreaterThan(0);
    const twoUMatches = screen.getAllByText(/^2u$/i);
    expect(twoUMatches.length).toBeGreaterThan(0);
  });

  it("renders the years of experience stat", () => {
    render(<Resume />);
    // The dedicated stat span contains exactly "12+ years"
    const matches = screen.getAllByText(/12\+\s*years/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the senior full-stack engineer title", () => {
    render(<Resume />);
    // Multiple elements may contain this phrase; assert at least one exists
    const matches = screen.getAllByText(/senior full-stack engineer/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders an iframe for the PDF preview", () => {
    render(<Resume />);
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/api/resume");
  });

  it("the 'View in 3D' button links to /ar?view=resume", () => {
    render(<Resume />);
    const btn = screen.getByTestId("resume-ar-btn");
    expect(btn).toHaveAttribute("href", "/ar?view=resume");
  });
});
