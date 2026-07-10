'use client';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ToolId } from '@/types';
import {
  ImagePlus,
  Crop,
  Grid3X3,
  SlidersHorizontal,
  Sparkles,
  Columns2,
  FolderOpen,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';

const TOOLS: { id: NonNullable<ToolId>; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'import', label: 'Import', Icon: ImagePlus },
  { id: 'crop', label: 'Crop', Icon: Crop },
  { id: 'grid', label: 'Grid', Icon: Grid3X3 },
  { id: 'effects', label: 'Effects', Icon: Sparkles },
  { id: 'filters', label: 'Filters', Icon: SlidersHorizontal },
  { id: 'split', label: 'Split', Icon: Columns2 },
  { id: 'projects', label: 'Projects', Icon: FolderOpen },
];

export function LeftRail() {
  const activeTool = useStore((s) => s.activeTool);
  const setTool = useStore((s) => s.setTool);
  const grid = useStore((s) => s.project.grid);
  const setGrid = useStore((s) => s.setGrid);
  const locked = useStore((s) => s.locked);
  const setLocked = useStore((s) => s.setLocked);

  const toggle = (id: NonNullable<ToolId>) => {
    setTool(activeTool === id ? null : id);
  };

  const toolButton = (
    { id, label, Icon }: (typeof TOOLS)[number],
    compact: boolean
  ) => {
    const active = activeTool === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => toggle(id)}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-[14px] transition-all active:scale-90 flex-shrink-0',
          compact ? 'w-[52px] h-[52px]' : 'w-14 h-14',
          active
            ? 'bg-[#5FB6E8]/20 text-[#5FB6E8]'
            : 'text-[#A39D93] hover:bg-white/8 hover:text-[#EDEAE3]'
        )}
        aria-label={label}
        aria-pressed={active}
      >
        <Icon size={20} />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Desktop / tablet: vertical rail on the left */}
      <div
        className="hidden sm:flex fixed left-0 top-0 bottom-0 z-40 flex-col items-center justify-center"
        style={{ width: 72, paddingTop: 56, paddingBottom: 56 }}
      >
        <div
          className="flex flex-col gap-1 p-1.5 rounded-[18px]"
          style={{
            background: 'rgba(32,30,28,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {TOOLS.map((t) => toolButton(t, false))}
        </div>
      </div>

      {/* Phone: horizontal tool bar along the bottom */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(32,30,28,0.92)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="flex items-center gap-0.5 px-1.5 overflow-x-auto"
          style={{ height: 64, scrollbarWidth: 'none' }}
        >
          {TOOLS.map((t) => toolButton(t, true))}

          <div className="w-px h-7 bg-white/15 mx-1 flex-shrink-0" />

          {/* Grid visibility */}
          <button
            type="button"
            onClick={() => setGrid({ on: !grid.on })}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-[52px] h-[52px] rounded-[14px] transition-all active:scale-90 flex-shrink-0',
              grid.on ? 'text-[#5FB6E8] bg-[#5FB6E8]/15' : 'text-[#A39D93]'
            )}
            aria-label={grid.on ? 'Hide grid' : 'Show grid'}
          >
            {grid.on ? <Eye size={20} /> : <EyeOff size={20} />}
            <span className="text-[10px] font-medium leading-none">Grid</span>
          </button>

          {/* Lock view */}
          <button
            type="button"
            onClick={() => setLocked(!locked)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-[52px] h-[52px] rounded-[14px] transition-all active:scale-90 flex-shrink-0',
              locked ? 'text-[#E06A50] bg-[#E06A50]/15' : 'text-[#A39D93]'
            )}
            aria-label={locked ? 'Unlock canvas' : 'Lock canvas'}
          >
            {locked ? <Lock size={20} /> : <Unlock size={20} />}
            <span className="text-[10px] font-medium leading-none">Lock</span>
          </button>
        </div>
      </div>
    </>
  );
}
