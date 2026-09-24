import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CodeLayout from "./layout";

// Mock the canvas-based rain background (uses browser APIs that don't run in happy-dom)
vi.mock("@/components/ui/GlobalMatrixRain", () => ({
  default: () => <div data-testid="matrix-rain" aria-hidden="true" />,
}));

// Mock Instructions and its localStorage-backed OnboardingProvider (happy-dom has no localStorage)
vi.mock("@/components/ui/Instructions", () => ({
  default: () => null,
}));

vi.mock("@/context/OnboardingContext", () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("(code) layout", () => {
  it("renders a wrapper with the matrix-scanlines class", () => {
    const { container } = render(
      <CodeLayout>
        <div>page content</div>
      </CodeLayout>
    );
    expect(container.querySelector(".matrix-scanlines")).toBeInTheDocument();
  });

  it("renders the Navbar", () => {
    render(
      <CodeLayout>
        <div>page content</div>
      </CodeLayout>
    );
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
  });

  it("renders the children", () => {
    render(
      <CodeLayout>
        <div>page content</div>
      </CodeLayout>
    );
    expect(screen.getByText("page content")).toBeInTheDocument();
  });
});
