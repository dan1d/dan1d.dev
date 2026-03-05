import * as THREE from "three";

/**
 * Builds a 16×16 glyph atlas texture containing Katakana, Latin, and digit characters.
 * Each cell has a randomly varied font size for organic, multi-size rain effect.
 * Characters are drawn in white so the shader can sample the red channel for alpha.
 */
export function buildGlyphAtlas(): THREE.CanvasTexture {
  const S = 64, C = 16;
  const W = C * S, H = C * S;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars: string[] = [];
  for (let i = 0; i < 26; i++) chars.push(String.fromCharCode(65 + i));
  for (let i = 0; i <= 9; i++) chars.push(String(i));
  for (const s of "@#$%&*<>{}[]|/\\") chars.push(s);

  // Vary font sizes per cell for multi-size rain characters
  const sizes = [36, 42, 48, 52, 56, 60, 64, 72];
  let seed = 42;
  const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < C * C; i++) {
    const col = i % C, row = Math.floor(i / C);
    const fontSize = sizes[Math.floor(rng() * sizes.length)];
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillText(chars[i % chars.length], col * S + S / 2, row * S + S / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}
