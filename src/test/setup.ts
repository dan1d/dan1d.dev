import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for R3F
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver — triggers callback immediately with isIntersecting: true
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
  if (type === "webgl" || type === "webgl2") {
    return {
      canvas: document.createElement("canvas"),
      getExtension: vi.fn(),
      getParameter: vi.fn().mockReturnValue(0),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      createProgram: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      getShaderParameter: vi.fn().mockReturnValue(true),
      useProgram: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      clear: vi.fn(),
      viewport: vi.fn(),
      createTexture: vi.fn(),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      drawArrays: vi.fn(),
      drawElements: vi.fn(),
      getUniformLocation: vi.fn(),
      getAttribLocation: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      activeTexture: vi.fn(),
      scissor: vi.fn(),
      blendFunc: vi.fn(),
      depthFunc: vi.fn(),
      depthMask: vi.fn(),
      colorMask: vi.fn(),
      clearColor: vi.fn(),
      clearDepth: vi.fn(),
      pixelStorei: vi.fn(),
      createFramebuffer: vi.fn(),
      bindFramebuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      checkFramebufferStatus: vi.fn().mockReturnValue(36053),
      createRenderbuffer: vi.fn(),
      bindRenderbuffer: vi.fn(),
      renderbufferStorage: vi.fn(),
      framebufferRenderbuffer: vi.fn(),
      deleteTexture: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteFramebuffer: vi.fn(),
      deleteRenderbuffer: vi.fn(),
      deleteProgram: vi.fn(),
      deleteShader: vi.fn(),
      getShaderInfoLog: vi.fn().mockReturnValue(""),
      getProgramInfoLog: vi.fn().mockReturnValue(""),
      isContextLost: vi.fn().mockReturnValue(false),
    };
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
