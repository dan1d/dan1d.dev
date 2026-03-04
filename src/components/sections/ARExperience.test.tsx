import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ARExperience from "./ARExperience";

// Mock qrcode.react since it relies on canvas APIs
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({
    value,
    "data-testid": testId,
    ...props
  }: {
    value: string;
    "data-testid"?: string;
    [key: string]: unknown;
  }) => (
    <svg
      data-testid={testId ?? "qr-code-svg"}
      data-value={value}
      aria-label="QR Code"
      {...props}
    />
  ),
}));

// Mock next/dynamic so dynamic imports resolve synchronously in tests
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return a placeholder that renders the ar-preview-canvas testid
    // This simulates the ARPreviewScene being loaded
    const MockDynamic = () => (
      <div data-testid="ar-preview-canvas" aria-hidden="true" />
    );
    MockDynamic.displayName = "MockDynamicComponent";
    return MockDynamic;
  },
}));

describe("ARExperience section", () => {
  it("renders a section with id='ar'", () => {
    render(<ARExperience />);
    const section = document.querySelector("section#ar");
    expect(section).toBeInTheDocument();
  });

  it("renders a section title containing 'AR' or 'Augmented Reality'", () => {
    render(<ARExperience />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/ar|augmented reality|experience/i);
  });

  it("renders descriptive text explaining the AR feature", () => {
    render(<ARExperience />);
    // Use getAllByText since multiple elements may match; at least one must exist
    const matches = screen.getAllByText(
      /point your phone|scan|qr code|projects come alive/i
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders a QR code component with data-testid='ar-qr-code'", () => {
    render(<ARExperience />);
    const qrCode = screen.getByTestId("ar-qr-code");
    expect(qrCode).toBeInTheDocument();
  });

  it("the QR code encodes the correct AR page URL", () => {
    render(<ARExperience />);
    const qrCode = screen.getByTestId("ar-qr-code");
    expect(qrCode).toHaveAttribute("data-value", "https://dan1d.dev/ar");
  });

  it("renders instructions text for how to use AR", () => {
    render(<ARExperience />);
    // Check for step-by-step instructions keywords (multiple elements may match)
    const scanMatches = screen.getAllByText(/scan/i);
    expect(scanMatches.length).toBeGreaterThan(0);
    const surfaceMatches = screen.getAllByText(/surface|camera|point/i);
    expect(surfaceMatches.length).toBeGreaterThan(0);
  });

  it("renders a 'Launch AR' button with data-testid='launch-ar-btn'", () => {
    render(<ARExperience />);
    const btn = screen.getByTestId("launch-ar-btn");
    expect(btn).toBeInTheDocument();
  });

  it("the 'Launch AR' button links to the /ar page", () => {
    render(<ARExperience />);
    const btn = screen.getByTestId("launch-ar-btn");
    expect(btn).toHaveAttribute("href", "/ar");
  });

  it("renders the 3D preview canvas", () => {
    render(<ARExperience />);
    const canvas = screen.getByTestId("ar-preview-canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders numbered steps (1, 2, 3) as instructions", () => {
    render(<ARExperience />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
