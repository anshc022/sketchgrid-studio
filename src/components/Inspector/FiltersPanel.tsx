'use client';
import { useStore } from '@/store/useStore';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';

const TINT_COLORS = [
  { label: 'None', value: 'none' },
  { label: 'Blue', value: '#4A9FD4' },
  { label: 'Sepia', value: '#C8A46E' },
  { label: 'Green', value: '#4CAF7D' },
  { label: 'Red', value: '#D64530' },
  { label: 'Purple', value: '#9B7FD4' },
];

const EDGE_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: 'Edges', value: 'edges' },
  { label: 'Outline', value: 'outline' },
] as const;

interface FiltersPanelProps {
  processedCanvas: HTMLCanvasElement | null;
}

export function FiltersPanel({ processedCanvas }: FiltersPanelProps) {
  const filters = useStore((s) => s.project.filters);
  const setFilters = useStore((s) => s.setFilters);
  const commit = useStore((s) => s.commit);
  const showToast = useStore((s) => s.showToast);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const update = (partial: Parameters<typeof setFilters>[0]) => {
    setFilters(partial);
    commit();
  };

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      exposure: 100,
      saturation: 100,
      grayscale: 0,
      posterize: 0,
      edge: 'off',
      edgeGain: 130,
      tint: 'none',
      tintAmt: 40,
    });
    commit();
  };

  const pickColor = () => {
    if (!processedCanvas) {
      showToast('No image loaded');
      return;
    }
    setPicking(true);
    showToast('Tap anywhere on the canvas to pick a colour');
    // We listen for a single click on the document to pick
    const handler = (e: MouseEvent) => {
      const rect = processedCanvas.getBoundingClientRect?.();
      let color: string | null = null;
      try {
        // Try to get color from canvas directly
        const ctx = processedCanvas.getContext('2d');
        if (ctx) {
          // Approximate pixel position
          const scaleX = processedCanvas.width / (processedCanvas.getBoundingClientRect?.()?.width || processedCanvas.width);
          const scaleY = processedCanvas.height / (processedCanvas.getBoundingClientRect?.()?.height || processedCanvas.height);
          const x = Math.round(e.clientX * scaleX);
          const y = Math.round(e.clientY * scaleY);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex = '#' + [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
          color = hex;
        }
      } catch {
        color = null;
      }
      if (color) setPickedColor(color);
      setPicking(false);
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler, { once: true });
  };

  return (
    <div className="space-y-1">
      <Slider
        label="Brightness"
        min={40}
        max={160}
        value={filters.brightness}
        onValueChange={(v) => update({ brightness: v })}
        format={(v) => `${v}%`}
      />
      <Slider
        label="Exposure"
        min={40}
        max={160}
        value={filters.exposure}
        onValueChange={(v) => update({ exposure: v })}
        format={(v) => `${v}%`}
      />
      <Slider
        label="Contrast"
        min={40}
        max={160}
        value={filters.contrast}
        onValueChange={(v) => update({ contrast: v })}
        format={(v) => `${v}%`}
      />
      <Slider
        label="Saturation"
        min={0}
        max={200}
        value={filters.saturation}
        onValueChange={(v) => update({ saturation: v })}
        format={(v) => `${v}%`}
      />
      <Slider
        label="Grayscale"
        min={0}
        max={100}
        value={filters.grayscale}
        onValueChange={(v) => update({ grayscale: v })}
        format={(v) => `${v}%`}
      />

      <div className="h-px bg-white/8 my-2" />

      <Slider
        label="Posterize"
        min={1}
        max={8}
        value={filters.posterize}
        onValueChange={(v) => update({ posterize: v })}
        format={(v) => (v < 2 ? 'Off' : `${v} levels`)}
      />

      <div className="h-px bg-white/8 my-2" />

      {/* Edge detection */}
      <div className="py-1">
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Line extraction</p>
        <div className="flex gap-2">
          {EDGE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ edge: value })}
              className={cn(
                'flex-1 h-10 rounded-lg text-sm font-medium transition-all',
                filters.edge === value
                  ? 'bg-[#5FB6E8] text-[#0E2836]'
                  : 'bg-white/8 text-[#EDEAE3] hover:bg-white/14'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filters.edge !== 'off' && (
        <Slider
          label="Line strength"
          min={50}
          max={300}
          value={filters.edgeGain}
          onValueChange={(v) => update({ edgeGain: v })}
          format={(v) => `${v}%`}
        />
      )}

      <div className="h-px bg-white/8 my-2" />

      {/* Tint */}
      <div className="py-1">
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Colour tint</p>
        <div className="flex gap-2">
          {TINT_COLORS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => update({ tint: value })}
              className={cn(
                'w-9 h-9 rounded-full border-2 transition-all active:scale-90',
                filters.tint === value
                  ? 'border-white scale-110 shadow-[0_0_0_2px_rgba(255,255,255,0.4)]'
                  : 'border-transparent border-white/20'
              )}
              style={{ background: value === 'none' ? 'transparent' : value }}
              aria-label={label}
            >
              {value === 'none' && (
                <span className="text-[10px] text-[#A39D93] font-medium">✕</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filters.tint !== 'none' && (
        <Slider
          label="Tint strength"
          min={5}
          max={80}
          value={filters.tintAmt}
          onValueChange={(v) => update({ tintAmt: v })}
          format={(v) => `${v}%`}
        />
      )}

      <div className="h-px bg-white/8 my-2" />

      {/* Pixel colour picker */}
      <div className="py-1">
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Sample colour</p>
        <div className="flex items-center gap-3">
          <Button
            variant={picking ? 'default' : 'ghost'}
            size="sm"
            onClick={pickColor}
            className="flex-1"
          >
            {picking ? 'Picking…' : 'Pick colour from image'}
          </Button>
          {pickedColor && (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-white/20"
                style={{ background: pickedColor }}
              />
              <span className="text-xs text-[#A39D93] font-mono">{pickedColor}</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/8 my-2" />

      <Button variant="danger" size="md" className="w-full mt-1" onClick={resetFilters}>
        Reset all filters
      </Button>
    </div>
  );
}
