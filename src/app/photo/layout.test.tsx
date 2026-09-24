import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PhotoLayout from "./layout";

// next/font/google requires network access at build time; stub it for tests
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "--font-fraunces" }),
}));

describe("photo layout", () => {
  it("does not render a matrix-scanlines element", () => {
    const { container } = render(
      <PhotoLayout>
        <div>photo content</div>
      </PhotoLayout>
    );
    expect(container.querySelector(".matrix-scanlines")).not.toBeInTheDocument();
  });

  it("does not render the Matrix Navbar's navigation landmark", () => {
    render(
      <PhotoLayout>
        <div>photo content</div>
      </PhotoLayout>
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders the children", () => {
    render(
      <PhotoLayout>
        <div>photo content</div>
      </PhotoLayout>
    );
    expect(screen.getByText("photo content")).toBeInTheDocument();
  });
});
