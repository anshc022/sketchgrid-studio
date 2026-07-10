import type { Project } from '@/types';
import { mkCanvas, pixelOps, cssFilterString } from './imageProcessing';
import { cropRect } from './imageProcessing';
import { clamp, effectiveCols, colLabel } from './utils';

interface ExportOptions {
  scale: number;
  grid: boolean;
  quality?: number;
}

export function buildExportCanvas(
  orientedC: HTMLCanvasElement,
  project: Project,
  opt: ExportOptions
): HTMLCanvasElement {
  const eff = cropRect(orientedC, project.crop);
  const dw = Math.round(eff.w * opt.scale);
  const dh = Math.round(eff.h * opt.scale);
  const c = mkCanvas(dw, dh);
  const ctx = c.getContext('2d')!;

  // Draw with filters
  ctx.filter = cssFilterString(project.filters);
  ctx.drawImage(orientedC, eff.x, eff.y, eff.w, eff.h, 0, 0, dw, dh);
  ctx.filter = 'none';

  // Pixel ops
  if (project.filters.posterize > 1 || project.filters.edge !== 'off') {
    const id = ctx.getImageData(0, 0, dw, dh);
    pixelOps(id, project.filters);
    ctx.putImageData(id, 0, 0);
  }

  // Tint overlay
  if (project.filters.tint !== 'none') {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = project.filters.tint;
    ctx.globalAlpha = project.filters.tintAmt / 100;
    ctx.fillRect(0, 0, dw, dh);
    ctx.restore();
  }

  // Grid overlay
  if (opt.grid && project.grid.on) {
    const G = project.grid;
    const nCols = effectiveCols(G);
    const cw = dw / nCols;
    const rows = Math.max(1, Math.round(dh / cw));

    ctx.save();
    ctx.strokeStyle = G.color;
    ctx.lineWidth = G.width;
    ctx.globalAlpha = G.opacity;

    // Main grid
    ctx.beginPath();
    for (let i = 0; i <= nCols; i++) {
      ctx.moveTo(i * cw, 0);
      ctx.lineTo(i * cw, dh);
    }
    for (let j = 0; j <= rows; j++) {
      const y = Math.min(j * cw, dh);
      ctx.moveTo(0, y);
      ctx.lineTo(dw, y);
    }
    ctx.stroke();

    // Diagonals
    if (G.diag) {
      ctx.beginPath();
      for (let col = 0; col < nCols; col++) {
        for (let row = 0; row < rows; row++) {
          const x0 = col * cw;
          const y0 = row * cw;
          const x1 = (col + 1) * cw;
          const y1 = Math.min((row + 1) * cw, dh);
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.moveTo(x1, y0);
          ctx.lineTo(x0, y1);
        }
      }
      ctx.stroke();
    }

    // Rule of thirds
    if (G.thirds) {
      ctx.save();
      ctx.strokeStyle = '#FFFFF0';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(dw / 3, 0); ctx.lineTo(dw / 3, dh);
      ctx.moveTo((2 * dw) / 3, 0); ctx.lineTo((2 * dw) / 3, dh);
      ctx.moveTo(0, dh / 3); ctx.lineTo(dw, dh / 3);
      ctx.moveTo(0, (2 * dh) / 3); ctx.lineTo(dw, (2 * dh) / 3);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Radial guides
    if (G.radial) {
      ctx.save();
      ctx.strokeStyle = G.color;
      ctx.globalAlpha = G.opacity * 0.7;
      ctx.beginPath();
      ctx.moveTo(dw / 2, 0); ctx.lineTo(dw / 2, dh);
      ctx.moveTo(0, dh / 2); ctx.lineTo(dw, dh / 2);
      ctx.moveTo(0, 0); ctx.lineTo(dw, dh);
      ctx.moveTo(dw, 0); ctx.lineTo(0, dh);
      ctx.stroke();
      ctx.restore();
    }

    // Labels
    if (G.labels) {
      const fs = clamp(cw * 0.14, 9, 22);
      ctx.font = `600 ${fs}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = G.opacity * 0.9;
      ctx.fillStyle = G.color;

      // Column labels
      for (let col = 0; col < nCols; col++) {
        const letter = colLabel(col, nCols);
        const tx = (col + 0.5) * cw;
        const ty = fs * 0.8;
        const pw = fs * 1.2;
        const ph = fs * 1.2;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(tx - pw / 2, ty - ph / 2, pw, ph, ph / 3);
        ctx.fill();
        ctx.fillStyle = G.color;
        ctx.fillText(letter, tx, ty);
      }

      // Row labels
      for (let row = 0; row < rows; row++) {
        const num = String(row + 1);
        const tx = fs * 0.8;
        const ty = (row + 0.5) * cw;
        const pw = fs * 1.4;
        const ph = fs * 1.2;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(tx - pw / 2, ty - ph / 2, pw, ph, ph / 3);
        ctx.fill();
        ctx.fillStyle = G.color;
        ctx.fillText(num, tx, ty);
      }
    }

    ctx.restore();
  }

  return c;
}

export async function exportToFile(
  canvas: HTMLCanvasElement,
  name: string,
  fmt: 'png' | 'jpeg' | 'pdf',
  quality = 0.92
): Promise<void> {
  if (fmt === 'pdf') {
    const { jsPDF } = await import('jspdf');
    const w = canvas.width;
    const h = canvas.height;
    const isLandscape = w > h;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [w, h],
    });
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    doc.addImage(dataUrl, 'JPEG', 0, 0, w, h);
    doc.save(`${name}.pdf`);
    return;
  }

  const mimeType = fmt === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = fmt === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${name}.${fmt}`;
  a.click();
}

export async function shareCanvas(canvas: HTMLCanvasElement, name: string, fmt: 'png' | 'jpeg'): Promise<void> {
  const mimeType = fmt === 'png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      mimeType,
      0.92
    );
  });
  const file = new File([blob], `${name}.${fmt}`, { type: mimeType });
  if (navigator.share) {
    await navigator.share({ files: [file], title: name });
  } else {
    throw new Error('Web Share API not supported');
  }
}
