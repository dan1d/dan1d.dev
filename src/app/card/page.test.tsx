import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CardPage from "./page";

// Mock the 3D background canvas (uses WebGL/R3F which can't render in happy-dom)
vi.mock("@/components/three/CardScene", () => ({
  default: () => <canvas data-testid="card-canvas" aria-hidden="true" />,
}));

// Mock next/dynamic so the dynamic import resolves synchronously in tests
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>, opts?: { loading?: () => React.ReactElement }) => {
    // Return the loading placeholder during tests (avoids async resolution issues)
    if (opts?.loading) return opts.loading;
    return fn().then((m) => m.default);
  },
}));

// Mock qrcode.react
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value, "data-testid": testId }: { value: string; "data-testid"?: string }) => (
    <svg data-testid={testId ?? "qr-code"} data-value={value} aria-label="QR Code" />
  ),
}));

describe("AR Business Card page", () => {
  it("renders Daniel's full name", () => {
    render(<CardPage />);
    // GlitchText renders name multiple times (main + glitch copies)
    const matches = screen.getAllByText("Daniel Alejandro Dominguez Diaz");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the handle @dan1d", () => {
    render(<CardPage />);
    expect(screen.getByText("@dan1d")).toBeInTheDocument();
  });

  it("renders social links for GitHub, LinkedIn, Email, and CodePrism", () => {
    render(<CardPage />);
    const githubLink = screen.getByRole("link", { name: /github/i });
    const linkedinLink = screen.getByRole("link", { name: /linkedin/i });
    const emailLink = screen.getByRole("link", { name: /email/i });
    const codeprismLink = screen.getByRole("link", { name: /codeprism/i });

    expect(githubLink).toBeInTheDocument();
    expect(linkedinLink).toBeInTheDocument();
    expect(emailLink).toBeInTheDocument();
    expect(codeprismLink).toBeInTheDocument();
  });

  it("renders a QR code with data-testid='card-qr'", () => {
    render(<CardPage />);
    const qr = screen.getByTestId("card-qr");
    expect(qr).toBeInTheDocument();
  });

  it("the QR code encodes https://dan1d.dev/card", () => {
    render(<CardPage />);
    const qr = screen.getByTestId("card-qr");
    expect(qr).toHaveAttribute("data-value", "https://dan1d.dev/card");
  });

  it("renders an email contact link", () => {
    render(<CardPage />);
    const emailLink = screen.getByRole("link", { name: /email/i });
    expect(emailLink).toHaveAttribute("href", "mailto:danielfromarg@gmail.com");
  });

  it("renders a 'Save Contact' button with data-testid='save-contact-btn'", () => {
    render(<CardPage />);
    const btn = screen.getByTestId("save-contact-btn");
    expect(btn).toBeInTheDocument();
  });

  it("renders a back to portfolio link", () => {
    render(<CardPage />);
    // There may be multiple links to "/", just check at least one exists
    const links = screen.getAllByRole("link").filter(el => el.getAttribute("href") === "/");
    expect(links.length).toBeGreaterThan(0);
  });
});
