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
