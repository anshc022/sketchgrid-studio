'use client';
import { useStore } from '@/store/useStore';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn, cellMm, PAPER_SIZES, paperDims, effectiveCols } from '@/lib/utils';

const GRID_COLORS = [
  { label: 'Non-photo blue', value: '#5FB6E8' },
  { label: 'Graphite', value: '#3B3B3B' },
  { label: 'Chalk', value: '#F4F1EA' },
  { label: 'Sanguine', value: '#D64530' },
  { label: 'Viridian', value: '#4CAF7D' },
];

const PAPER_KEYS = Object.keys(PAPER_SIZES);

export function GridPanel() {
  const grid = useStore((s) => s.project.grid);
  const setGrid = useStore((s) => s.setGrid);
  const commit = useStore((s) => s.commit);

  const update = (partial: Parameters<typeof setGrid>[0]) => {
    setGrid(partial);
    commit();
  };

  const nCols = effectiveCols(grid);
  const [pw, ph] = paperDims(grid.paper, grid.paperOrient);
  const nRows = Math.max(1, Math.round(ph / (pw / nCols)));
  const mm =
    grid.mode === 'mm'
      ? grid.sizeMm ?? 15
      : cellMm(grid.cols, grid.paper, grid.paperOrient);

  // Columns and cell size are two handles on the same grid: setting one
  // recomputes the other from the current paper, and paper changes
  // always re-grid immediately.
  const setCols = (v: number) =>
    update({ mode: 'mm', cols: v, sizeMm: Math.max(2, Math.round(pw / v)) });
  const setSizeMm = (v: number) => update({ mode: 'mm', sizeMm: v });
  const setPaper = (key: string) => update({ mode: 'mm', paper: key });
  const setOrient = (o: 'v' | 'h') => update({ mode: 'mm', paperOrient: o });

  return (
    <div className="space-y-1">
      <Switch
        label="Show grid"
        checked={grid.on}
        onCheckedChange={(v) => update({ on: v })}
      />

      <div className="h-px bg-white/8 my-2" />

      <Slider
        label="Columns"
        min={2}
        max={40}
        value={Math.min(40, nCols)}
        onValueChange={setCols}
        format={() => String(nCols)}
      />

      <Slider
        label="Size of 1 cell"
        min={2}
        max={60}
        value={mm}
        onValueChange={setSizeMm}
        format={(v) => `${v} mm`}
      />

      <Slider
        label="Line weight"
        min={1}
        max={6}
        step={0.5}
        value={grid.width}
        onValueChange={(v) => update({ width: v })}
        format={(v) => `${v}px`}
      />

      <Slider
        label="Opacity"
        min={10}
        max={100}
        value={Math.round(grid.opacity * 100)}
        onValueChange={(v) => update({ opacity: v / 100 })}
        format={(v) => `${v}%`}
      />

      <div className="h-px bg-white/8 my-2" />

      {/* Color swatches */}
      <div className="py-1">
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Line colour</p>
        <div className="flex gap-3">
          {GRID_COLORS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => update({ color: value })}
              className={cn(
                'w-10 h-10 rounded-full border-2 transition-all active:scale-90',
                grid.color === value
                  ? 'border-white scale-110 shadow-[0_0_0_2px_rgba(255,255,255,0.4)]'
                  : 'border-transparent'
              )}
              style={{ background: value }}
              aria-label={label}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-white/8 my-2" />

      <Switch
        label="Cell labels"
        checked={grid.labels}
        onCheckedChange={(v) => update({ labels: v })}
      />
      <Switch
        label="Cell diagonals"
        checked={grid.diag}
        onCheckedChange={(v) => update({ diag: v })}
      />
      <Switch
        label="Rule of thirds"
        checked={grid.thirds}
        onCheckedChange={(v) => update({ thirds: v })}
      />
      <Switch
        label="Radial guides"
        checked={grid.radial}
        onCheckedChange={(v) => update({ radial: v })}
      />

      <div className="h-px bg-white/8 my-2" />

      {/* Paper size — in mm mode this changes how many squares fit */}
      <div className="py-1">
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Paper size</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {PAPER_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPaper(key)}
              className={cn(
                'flex-shrink-0 h-9 px-3 rounded-lg text-sm font-medium transition-all',
                grid.paper === key
                  ? 'bg-[#5FB6E8] text-[#0E2836]'
                  : 'bg-white/8 text-[#EDEAE3] hover:bg-white/14'
              )}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orientation */}
      <div className="py-1">
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Orientation</p>
        <div className="flex gap-2">
          {(['v', 'h'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOrient(o)}
              className={cn(
                'flex-1 h-10 rounded-lg text-sm font-medium transition-all',
                grid.paperOrient === o
                  ? 'bg-[#5FB6E8] text-[#0E2836]'
                  : 'bg-white/8 text-[#EDEAE3] hover:bg-white/14'
              )}
            >
              {o === 'v' ? 'Portrait' : 'Landscape'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-2 py-2 px-3 bg-white/6 rounded-xl">
        <p className="text-xs text-[#A39D93] leading-relaxed">
          <span className="text-[#EDEAE3] font-semibold">
            {nCols} × {nRows} squares
          </span>{' '}
          · 1 cell ≈ <span className="text-[#EDEAE3] font-semibold">{mm} mm</span> on{' '}
          {grid.paper.toUpperCase()} {grid.paperOrient === 'v' ? 'portrait' : 'landscape'}
        </p>
      </div>
    </div>
  );
}
