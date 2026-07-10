import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const uid = () => crypto.randomUUID();

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const PAPER_SIZES: Record<string, [number, number]> = {
  a5: [148, 210],
  a4: [210, 297],
  a3: [297, 420],
  a2: [420, 594],
  a1: [594, 841],
  a0: [841, 1189],
};

export function cellMm(cols: number, paper: string, orient: 'v' | 'h'): number {
  const pp = PAPER_SIZES[paper] ?? PAPER_SIZES.a4;
  const pw = orient === 'h' ? pp[1] : pp[0];
  return Math.round(pw / cols);
}

export function paperDims(paper: string, orient: 'v' | 'h'): [number, number] {
  const pp = PAPER_SIZES[paper] ?? PAPER_SIZES.a4;
  return orient === 'h' ? [pp[1], pp[0]] : [pp[0], pp[1]];
}

/**
 * Number of grid columns for the current settings. In 'mm' mode the
 * count comes from paper width / cell size, so changing paper size or
 * cell size changes how many squares span the image.
 */
export function effectiveCols(g: {
  mode?: 'cols' | 'mm';
  cols: number;
  sizeMm?: number;
  paper: string;
  paperOrient: 'v' | 'h';
}): number {
  if (g.mode === 'mm') {
    const [pw] = paperDims(g.paper, g.paperOrient);
    const mm = Math.max(2, g.sizeMm ?? 15);
    return clamp(Math.round(pw / mm), 1, 200);
  }
  return g.cols;
}

/** Column label: letters for small grids, numbers once past Z */
export function colLabel(i: number, cols: number): string {
  return cols <= 26 ? LETTERS[i] : String(i + 1);
}
