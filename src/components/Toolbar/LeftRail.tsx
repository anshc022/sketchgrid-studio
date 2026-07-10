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
  const focus = useStore((s) => s.focus);

  const toggle = (id: NonNullable<ToolId>) => {
    setTool(activeTool === id ? null : id);
  };

  return (
    <div
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col items-center justify-center"
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
        {TOOLS.map(({ id, label, Icon }) => {
          const active = activeTool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-[14px] transition-all active:scale-90',
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
        })}
      </div>
    </div>
  );
}
