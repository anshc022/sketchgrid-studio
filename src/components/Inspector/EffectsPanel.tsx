'use client';
import { useEffect, useState } from 'react';
import { useStore, defaultFilters } from '@/store/useStore';
import { buildProcessed, mkCanvas } from '@/lib/imageProcessing';
import { cn } from '@/lib/utils';
import type { FilterSettings } from '@/types';

interface EffectPreset {
  label: string;
  hint: string;
  filters: Partial<FilterSettings>;
}

const PRESETS: EffectPreset[] = [
  { label: 'Normal', hint: 'Original photo', filters: {} },
  { label: 'Black & white', hint: 'Value study', filters: { grayscale: 100 } },
  {
    label: 'Outline',
    hint: 'Contour map for proportions',
    filters: { edge: 'outline', edgeGain: 130 },
  },
  {
    label: 'Edges',
    hint: 'White lines on black',
    filters: { edge: 'edges', edgeGain: 130 },
  },
  {
    label: 'Pencil sketch',
    hint: 'Soft graphite look',
    filters: { grayscale: 100, contrast: 128, brightness: 106 },
  },
  {
    label: 'High contrast',
    hint: 'Push lights & darks apart',
    filters: { contrast: 150, grayscale: 100 },
  },
  {
    label: '3 values',
    hint: 'Notan — dark, mid, light',
    filters: { grayscale: 100, posterize: 3 },
  },
  {
    label: '5 values',
    hint: 'Classic value scale',
    filters: { grayscale: 100, posterize: 5 },
  },
  {
    label: 'Poster',
    hint: 'Block in colour shapes',
    filters: { posterize: 4, saturation: 125 },
  },
  {
    label: 'Sepia',
    hint: 'Warm old-master tone',
    filters: { grayscale: 70, tint: '#E8A25F', tintAmt: 45 },
  },
  {
    label: 'Blue underdrawing',
    hint: 'Non-photo blue for inking',
    filters: { grayscale: 100, tint: '#5FB6E8', tintAmt: 55 },
  },
  {
    label: 'Faded',
    hint: 'Light ghost for tracing',
    filters: { brightness: 118, contrast: 74 },
  },
];

function presetFilters(p: EffectPreset): FilterSettings {
  return { ...defaultFilters(), ...p.filters };
}

function makePreview(oriented: HTMLCanvasElement, f: FilterSettings): string {
  // Downscale first so pixel ops stay fast, then run the same pipeline
  const processed = buildProcessed(oriented, null, f, 150);
  // Tint is normally a live overlay — bake it into the preview
  if (f.tint !== 'none') {
    const c = mkCanvas(processed.width, processed.height);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(processed, 0, 0);
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = f.tintAmt / 100;
    ctx.fillStyle = f.tint;
    ctx.fillRect(0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.75);
  }
  return processed.toDataURL('image/jpeg', 0.75);
}

interface EffectsPanelProps {
  orientedCanvas: HTMLCanvasElement | null;
}

export function EffectsPanel({ orientedCanvas }: EffectsPanelProps) {
  const filters = useStore((s) => s.project.filters);
  const setFilters = useStore((s) => s.setFilters);
  const commit = useStore((s) => s.commit);
  const showToast = useStore((s) => s.showToast);

  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!orientedCanvas) {
      setPreviews([]);
      return;
    }
    // Build a small base once, then render every preset from it
    const maxDim = 150;
    const k = Math.min(1, maxDim / Math.max(orientedCanvas.width, orientedCanvas.height));
    const small = mkCanvas(orientedCanvas.width * k, orientedCanvas.height * k);
    small
      .getContext('2d')!
      .drawImage(orientedCanvas, 0, 0, small.width, small.height);
    setPreviews(PRESETS.map((p) => makePreview(small, presetFilters(p))));
  }, [orientedCanvas]);

  if (!orientedCanvas) {
    return (
      <p className="text-sm text-[#A39D93] py-6 text-center">
        Import an image first to preview effects.
      </p>
    );
  }

  const currentJson = JSON.stringify(filters);

  const apply = (p: EffectPreset) => {
    setFilters(presetFilters(p));
    commit();
    showToast(`Effect: ${p.label}`);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#A39D93] leading-relaxed">
        One-tap looks for sketching and painting. Fine-tune any of them afterwards in
        Filters.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {PRESETS.map((p, i) => {
          const active = JSON.stringify(presetFilters(p)) === currentJson;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => apply(p)}
              className={cn(
                'rounded-xl overflow-hidden text-left transition-all active:scale-95',
                active
                  ? 'ring-2 ring-[#5FB6E8] bg-[#5FB6E8]/10'
                  : 'bg-white/6 hover:bg-white/10'
              )}
            >
              <div className="aspect-[4/3] bg-black/30">
                {previews[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[i]}
                    alt={p.label}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                )}
              </div>
              <div className="px-2.5 py-2">
                <p
                  className={cn(
                    'text-xs font-semibold leading-tight',
                    active ? 'text-[#5FB6E8]' : 'text-[#EDEAE3]'
                  )}
                >
                  {p.label}
                </p>
                <p className="text-[10px] text-[#A39D93] mt-0.5 leading-tight">{p.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
