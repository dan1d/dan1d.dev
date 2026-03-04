import * as THREE from "three";

/**
 * Builds a 16×16 glyph atlas texture containing Katakana, Latin, and digit characters.
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
  ctx.font = `bold ${S - 8}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars: string[] = [];
  for (let cp = 0x30a0; cp <= 0x30ff; cp++) chars.push(String.fromCodePoint(cp));
  for (let i = 0; i < 26; i++) chars.push(String.fromCharCode(65 + i));
  for (let i = 0; i <= 9; i++) chars.push(String(i));

  for (let i = 0; i < C * C; i++) {
    const col = i % C, row = Math.floor(i / C);
    ctx.fillText(chars[i % chars.length], col * S + S / 2, row * S + S / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}
