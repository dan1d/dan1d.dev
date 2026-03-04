// ─── Shared Matrix Rain utilities ───────────────────────────────────────────
// Used by: PageLoader, MatrixRainCanvas, GlobalMatrixRain, corridor shaders

// ─── Character set ──────────────────────────────────────────────────────────

const KATAKANA =
  "\u30A0\u30A1\u30A2\u30A3\u30A4\u30A5\u30A6\u30A7\u30A8\u30A9\u30AA\u30AB\u30AC\u30AD\u30AE\u30AF" +
  "\u30B0\u30B1\u30B2\u30B3\u30B4\u30B5\u30B6\u30B7\u30B8\u30B9\u30BA\u30BB\u30BC\u30BD\u30BE\u30BF" +
  "\u30C0\u30C1\u30C2\u30C3\u30C4\u30C5\u30C6\u30C7\u30C8\u30C9\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF" +
  "\u30D0\u30D1\u30D2\u30D3\u30D4\u30D5\u30D6\u30D7\u30D8\u30D9\u30DA\u30DB\u30DC\u30DD\u30DE\u30DF" +
  "\u30E0\u30E1\u30E2\u30E3\u30E4\u30E5\u30E6\u30E7\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30EE\u30EF" +
  "\u30F0\u30F1\u30F2\u30F3";

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SYMBOLS = "@#$%&*<>{}[]|/\\";

export const MATRIX_CHARS = KATAKANA + LATIN + SYMBOLS;

export function randomMatrixChar(): string {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

// ─── Rain column ────────────────────────────────────────────────────────────

export interface RainColumn {
  y: number;
  speed: number;
}

/** Create an array of rain columns with randomized start positions */
export function createRainColumns(
  count: number,
  canvasH: number,
  cellSize: number,
  existing?: RainColumn[]
): RainColumn[] {
  const cols: RainColumn[] = new Array(count);
  for (let i = 0; i < count; i++) {
    cols[i] = existing?.[i] ?? {
      y: Math.random() * (canvasH / cellSize) * -1,
      speed: 0.4 + Math.random() * 0.8,
    };
  }
  return cols;
}

// ─── Font size variations ───────────────────────────────────────────────────

/** Return an array of varied font sizes based on a base size */
export function buildFontSizes(base: number): number[] {
  return [
    Math.round(base * 0.7),
    Math.round(base * 0.85),
    base,
    Math.round(base * 1.15),
    Math.round(base * 1.3),
    Math.round(base * 1.5),
  ];
}

export function pickFontSize(sizes: number[]): number {
  return sizes[Math.floor(Math.random() * sizes.length)];
}

// ─── Draw a rain character on a 2D canvas ───────────────────────────────────

export interface DrawCharOptions {
  ctx: CanvasRenderingContext2D;
  char: string;
  x: number;
  y: number;
  fontSize: number;
  intensity: number;
  /** Add glow via shadowBlur (default false — crisp mode) */
  glow?: boolean;
}

export function drawRainChar({
  ctx, char, x, y, fontSize, intensity, glow = false,
}: DrawCharOptions): void {
  ctx.font = `bold ${fontSize}px monospace`;

  if (Math.random() > 0.7) {
    // Head character — bright white
    const wb = Math.floor(180 + 75 * intensity);
    ctx.fillStyle = `rgb(${wb}, ${wb}, ${wb})`;
    if (glow) {
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = 18 * intensity;
    }
  } else {
    // Trail character — green
    const g = Math.floor((100 + Math.random() * 155) * intensity);
    ctx.fillStyle = `rgb(0, ${g}, ${Math.floor(g * 0.15)})`;
    if (glow) {
      ctx.shadowColor = `rgb(0, ${Math.min(255, g + 50)}, 15)`;
      ctx.shadowBlur = 10 * intensity;
    }
  }

  ctx.fillText(char, x, y);

  if (glow) ctx.shadowBlur = 0;
}

// ─── Text grid mask ─────────────────────────────────────────────────────────
// Renders text to an offscreen canvas, then samples it into a cell grid mask.

export interface TextGridMask {
  mask: Uint8Array;
  cols: number;
  rows: number;
}

export function buildTextGrid(
  text: string,
  canvasW: number,
  canvasH: number,
  cellW: number,
  cellH: number
): TextGridMask {
  const off = document.createElement("canvas");
  off.width = canvasW;
  off.height = canvasH;
  const c = off.getContext("2d")!;

  const fSize = Math.min(canvasW * 0.07, 100);
  c.font = `900 ${fSize}px monospace`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#fff";
  c.fillText(text, canvasW / 2, canvasH / 2);

  const img = c.getImageData(0, 0, canvasW, canvasH);
  const cols = Math.floor(canvasW / cellW);
  const rows = Math.floor(canvasH / cellH);
  const mask = new Uint8Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const px = Math.floor(col * cellW + cellW / 2);
      const py = Math.floor(r * cellH + cellH / 2);
      const idx = (py * canvasW + px) * 4;
      if (img.data[idx + 3] > 80) mask[r * cols + col] = 1;
    }
  }

  return { mask, cols, rows };
}

// ─── Easing ─────────────────────────────────────────────────────────────────

/** Hermite smoothstep (0→1) */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
