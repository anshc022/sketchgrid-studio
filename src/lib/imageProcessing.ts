import { clamp } from './utils';
import type { FilterSettings, OrientSettings, CropRect } from '@/types';

export function mkCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function buildOriented(baseImg: HTMLImageElement, orient: OrientSettings): HTMLCanvasElement {
  const { rot, fh, fv } = orient;
  const w = baseImg.naturalWidth;
  const h = baseImg.naturalHeight;
  const swapped = rot === 90 || rot === 270;
  const cw = swapped ? h : w;
  const ch = swapped ? w : h;
  const c = mkCanvas(cw, ch);
  const ctx = c.getContext('2d')!;
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((rot * Math.PI) / 180);
  if (fh) ctx.scale(-1, 1);
  if (fv) ctx.scale(1, -1);
  ctx.drawImage(baseImg, -w / 2, -h / 2, w, h);
  ctx.restore();
  return c;
}

export function cropRect(orientedC: HTMLCanvasElement, crop: CropRect | null): CropRect {
  if (!crop) {
    return { x: 0, y: 0, w: orientedC.width, h: orientedC.height };
  }
  return {
    x: clamp(crop.x, 0, orientedC.width),
    y: clamp(crop.y, 0, orientedC.height),
    w: clamp(crop.w, 1, orientedC.width - clamp(crop.x, 0, orientedC.width)),
    h: clamp(crop.h, 1, orientedC.height - clamp(crop.y, 0, orientedC.height)),
  };
}

export function buildProcessed(
  orientedC: HTMLCanvasElement,
  crop: CropRect | null,
  filters: FilterSettings,
  maxDim = 2200
): HTMLCanvasElement {
  const eff = cropRect(orientedC, crop);
  let sw = eff.w;
  let sh = eff.h;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);

  const c = mkCanvas(dw, dh);
  const ctx = c.getContext('2d')!;

  // Apply CSS filters for brightness/contrast/saturation/grayscale/exposure
  ctx.filter = cssFilterString(filters);
  ctx.drawImage(orientedC, eff.x, eff.y, sw, sh, 0, 0, dw, dh);
  ctx.filter = 'none';

  // Apply pixel ops (posterize, edge detection)
  if (filters.posterize > 1 || filters.edge !== 'off') {
    const id = ctx.getImageData(0, 0, dw, dh);
    pixelOps(id, filters);
    ctx.putImageData(id, 0, 0);
  }

  return c;
}

export function pixelOps(id: ImageData, f: FilterSettings): void {
  const d = id.data;
  const W = id.width;
  const H = id.height;

  // Posterize
  if (f.posterize > 1) {
    const levels = Math.round(f.posterize);
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(Math.round(d[i] / step) * step);
      d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
      d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
    }
  }

  // Sobel edge detection
  if (f.edge !== 'off') {
    const g = new Float32Array(W * H);
    for (let i = 0, p = 0; i < d.length; i += 4, p++)
      g[p] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const out = new Uint8ClampedArray(W * H);
    const gain = (f.edgeGain || 130) / 100;
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        const gx =
          -g[p - W - 1] - 2 * g[p - 1] - g[p + W - 1] + g[p - W + 1] + 2 * g[p + 1] + g[p + W + 1];
        const gy =
          -g[p - W - 1] - 2 * g[p - W] - g[p - W + 1] + g[p + W - 1] + 2 * g[p + W] + g[p + W + 1];
        out[p] = clamp(Math.hypot(gx, gy) * gain * 0.25, 0, 255);
      }
    const inv = f.edge === 'outline';
    for (let p = 0, i = 0; p < out.length; p++, i += 4) {
      const v = inv ? 255 - out[p] : out[p];
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
}

export function cssFilterString(filters: FilterSettings): string {
  const parts: string[] = [];
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness / 100})`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast / 100})`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation / 100})`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale / 100})`);
  if (filters.exposure !== 100) {
    // Simulate exposure via brightness with a stronger curve
    parts.push(`brightness(${(filters.exposure / 100) ** 1.4})`);
  }
  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function storableDataURL(img: HTMLImageElement): string {
  const maxDim = 2600;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = mkCanvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.9);
}

export function thumbURL(canvas: HTMLCanvasElement): string {
  const maxDim = 112;
  const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height, 1));
  const w = Math.max(1, Math.round(canvas.width * scale));
  const h = Math.max(1, Math.round(canvas.height * scale));
  const c = mkCanvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.8);
}
