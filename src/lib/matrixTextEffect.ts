// ─── Matrix Text Effect Engine ──────────────────────────────────────────────
// Pure logic for text formation (reveal) and dissolution — no React dependency.
// Used by MatrixTextReveal and any future text-from-rain effects.

import { randomMatrixChar, smoothstep } from "./matrix";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LockedCell {
  char: string;
  /** 0→1 ramp during reveal (opacity fade-in) */
  fadeIn: number;
  /** 0→1 ramp during dissolve (opacity fade-out) */
  fadeOut: number;
}

export type RevealDirection = "ltr" | "rtl";

// ─── Thresholds ─────────────────────────────────────────────────────────────
// Each cell in the text mask gets a threshold (0.05–0.95). When sweep progress
// passes a cell's threshold, that cell locks. Deterministic jitter keeps it
// organic-looking without frame-to-frame flicker.

export function computeThresholds(
  mask: Uint8Array,
  cols: number,
  rows: number,
  direction: RevealDirection = "ltr"
): Float32Array {
  const thresholds = new Float32Array(cols * rows);

  // Find horizontal bounds of the text
  let minCol = cols;
  let maxCol = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mask[r * cols + c] === 1) {
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  const colRange = Math.max(1, maxCol - minCol);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      // Normalised column position within text bounds
      let t = (c - minCol) / colRange;
      if (direction === "rtl") t = 1 - t;

      // Deterministic jitter: hash-like spread without Math.random()
      const jitter = (((r * 7 + c * 13) % 17) / 17 - 0.5) * 0.06;

      // Map to 0.05–0.95 range
      thresholds[i] = Math.max(0.05, Math.min(0.95, t * 0.9 + 0.05 + jitter));
    }
  }

  return thresholds;
}

// ─── Cell grid helpers ──────────────────────────────────────────────────────

export function createCellGrid(cols: number, rows: number): (LockedCell | null)[] {
  return new Array(cols * rows).fill(null);
}

// ─── Reveal update ──────────────────────────────────────────────────────────
// Called every frame during the "revealing" phase.
// Locks cells whose threshold ≤ eased progress and advances fadeIn.

export function updateReveal(
  cells: (LockedCell | null)[],
  thresholds: Float32Array,
  mask: Uint8Array,
  sweepProgress: number,
  dt: number,
  fadeInMs: number = 120,
  charMap?: string[]
): void {
  const eased = smoothstep(sweepProgress);
  const fadeStep = dt / (fadeInMs / 1000);

  for (let i = 0; i < cells.length; i++) {
    if (mask[i] !== 1) continue;

    if (thresholds[i] <= eased) {
      if (cells[i] === null) {
        // Use the actual text character if available, otherwise random
        const char = charMap?.[i] || randomMatrixChar();
        cells[i] = { char, fadeIn: 0, fadeOut: 0 };
      }
      const cell = cells[i]!;
      cell.fadeIn = Math.min(1, cell.fadeIn + fadeStep);
    }
  }
}

// ─── Dissolve update ────────────────────────────────────────────────────────
// Called every frame during the "dissolving" phase.
// Unlocks cells in reverse order (high threshold first for rtl dissolve).

export function updateDissolve(
  cells: (LockedCell | null)[],
  thresholds: Float32Array,
  sweepProgress: number,
  dt: number,
  fadeOutMs: number = 80
): void {
  // sweepProgress goes 0→1 during dissolve phase.
  // Cells with high threshold dissolve first (right-to-left visual).
  const dissolveEdge = 1 - sweepProgress; // 1→0
  const fadeStep = dt / (fadeOutMs / 1000);

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell === null) continue;

    if (thresholds[i] >= dissolveEdge) {
      // This cell should be dissolving
      cell.fadeOut = Math.min(1, cell.fadeOut + fadeStep);
    }

    // Fully dissolved — remove
    if (cell.fadeOut >= 1) {
      cells[i] = null;
    }
  }
}

// ─── Effective opacity of a locked cell ─────────────────────────────────────

export function cellOpacity(cell: LockedCell): number {
  return cell.fadeIn * (1 - cell.fadeOut);
}
