// ─── Shared Matrix Rain utilities ───────────────────────────────────────────
// Used by: PageLoader, MatrixRainCanvas, GlobalMatrixRain, corridor shaders

// ─── Character set ──────────────────────────────────────────────────────────

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SYMBOLS = "@#$%&*<>{}[]|/\\";

export const MATRIX_CHARS = LATIN + SYMBOLS;

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
  /** Per-cell character from the original text (empty string if not a text cell) */
  charMap: string[];
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

  // Measure text and scale font to fit 80% of canvas width
  let fSize = Math.min(canvasW * 0.1, 180);
  c.font = `900 ${fSize}px monospace`;
  const measured = c.measureText(text);
  const maxW = canvasW * 0.8;
  if (measured.width > maxW) {
    fSize = fSize * (maxW / measured.width);
    c.font = `900 ${fSize}px monospace`;
  }
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#fff";
  c.fillText(text, canvasW / 2, canvasH / 2);

  // Measure each character's x-position to build a charMap
  const charPositions: { char: string; left: number; right: number }[] = [];
  const textStartX = canvasW / 2 - c.measureText(text).width / 2;
  let xCursor = textStartX;
  for (const ch of text) {
    const charW = c.measureText(ch).width;
    charPositions.push({ char: ch, left: xCursor, right: xCursor + charW });
    xCursor += charW;
  }

  const img = c.getImageData(0, 0, canvasW, canvasH);
  const cols = Math.floor(canvasW / cellW);
  const rows = Math.floor(canvasH / cellH);
  const mask = new Uint8Array(cols * rows);
  const charMap: string[] = new Array(cols * rows).fill("");

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const px = Math.floor(col * cellW + cellW / 2);
      const py = Math.floor(r * cellH + cellH / 2);
      const idx = (py * canvasW + px) * 4;
      if (img.data[idx + 3] > 80) {
        mask[r * cols + col] = 1;
        // Find which character this pixel belongs to
        const hit = charPositions.find(cp => px >= cp.left && px < cp.right);
        charMap[r * cols + col] = hit ? hit.char.toUpperCase() : randomMatrixChar();
      }
    }
  }

  return { mask, charMap, cols, rows };
}

// ─── Easing ─────────────────────────────────────────────────────────────────

/** Hermite smoothstep (0→1) */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
