import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DevelopImage from "./DevelopImage";

describe("DevelopImage", () => {
  it("sets width, height and alt on the img", () => {
    render(<DevelopImage src="/photos/a/grid.webp" alt="A quiet street at night" width={1200} height={800} />);
    const img = screen.getByRole("img", { name: "A quiet street at night" });
    expect(img).toHaveAttribute("width", "1200");
    expect(img).toHaveAttribute("height", "800");
  });

  it("sets an aspect-ratio style on the wrapper matching width/height", () => {
    const { container } = render(
      <DevelopImage src="/photos/a/grid.webp" alt="A quiet street at night" width={1200} height={800} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe("1200 / 800");
  });

  it("drives the develop transition off the --dk-develop token, which is 0ms under reduced motion", () => {
    render(<DevelopImage src="/photos/a/grid.webp" alt="A quiet street at night" width={1200} height={800} />);
    const img = screen.getByRole("img", { name: "A quiet street at night" });
    expect(img.style.transition).toContain("var(--dk-develop)");
  });
});
