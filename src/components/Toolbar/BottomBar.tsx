'use client';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

interface BottomBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
}

export function BottomBar({ onZoomIn, onZoomOut, onFitAll }: BottomBarProps) {
  const grid = useStore((s) => s.project.grid);
  const setGrid = useStore((s) => s.setGrid);
  const locked = useStore((s) => s.locked);
  const setLocked = useStore((s) => s.setLocked);

  return (
    <div
      className="hidden sm:flex fixed bottom-0 left-0 right-0 z-40 items-center justify-center gap-2 px-4"
      style={{
        height: 56,
        background: 'rgba(32,30,28,0.88)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingLeft: 80,
      }}
    >
      {/* Zoom controls */}
      <Button variant="ghost" size="icon-sm" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut size={18} />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onFitAll} aria-label="Fit to screen">
        <Maximize2 size={16} />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn size={18} />
      </Button>

      {/* Separator */}
      <div className="w-px h-6 bg-white/15 mx-1" />

      {/* Grid opacity */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#A39D93] font-medium">Grid</span>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={Math.round(grid.opacity * 100)}
          onChange={(e) => setGrid({ opacity: Number(e.target.value) / 100 })}
          style={{ width: 120, height: 48 }}
          aria-label="Grid opacity"
        />
      </div>

      {/* Grid eye toggle */}
      <button
        type="button"
        onClick={() => setGrid({ on: !grid.on })}
        className={cn(
          'h-9 w-9 rounded-lg flex items-center justify-center transition-all active:scale-90',
          grid.on ? 'text-[#5FB6E8] bg-[#5FB6E8]/15' : 'text-[#A39D93] bg-white/6'
        )}
        aria-label={grid.on ? 'Hide grid' : 'Show grid'}
      >
        {grid.on ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-white/15 mx-1" />

      {/* Lock */}
      <button
        type="button"
        onClick={() => setLocked(!locked)}
        className={cn(
          'h-9 w-9 rounded-lg flex items-center justify-center transition-all active:scale-90',
          locked ? 'text-[#E06A50] bg-[#E06A50]/15' : 'text-[#A39D93] bg-white/6'
        )}
        aria-label={locked ? 'Unlock canvas' : 'Lock canvas (prevent accidental pan/zoom)'}
      >
        {locked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
    </div>
  );
}
