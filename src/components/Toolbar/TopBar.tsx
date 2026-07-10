'use client';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Download, Focus, ZoomIn } from 'lucide-react';
import { KeyboardEvent } from 'react';

interface TopBarProps {
  onExport: () => void;
  zoomPct: number;
  onZoomCycle: () => void;
}

export function TopBar({ onExport, zoomPct, onZoomCycle }: TopBarProps) {
  const project = useStore((s) => s.project);
  const setProjectName = useStore((s) => s.setProjectName);
  const commit = useStore((s) => s.commit);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const undoStack = useStore((s) => s.undoStack);
  const redoStack = useStore((s) => s.redoStack);
  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim() || 'Untitled sketch';
    setProjectName(val);
    commit();
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3"
      style={{
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: 'rgba(32,30,28,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Wordmark — "SG" on phones, "SketchG" on larger screens */}
      <div className="flex items-center gap-0.5 mr-1 sm:mr-2 flex-shrink-0">
        <span className="font-bold text-[#EDEAE3] text-base tracking-tight">
          S<span className="hidden sm:inline">ketch</span>
        </span>
        <span className="font-bold text-[#5FB6E8] text-base tracking-tight">G</span>
      </div>

      {/* Project name */}
      <input
        type="text"
        defaultValue={project.name}
        key={project.id}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
        className="flex-1 min-w-0 bg-transparent text-sm text-[#EDEAE3] placeholder-[#A39D93] outline-none border-b border-transparent focus:border-white/20 transition-colors py-1 font-medium"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        aria-label="Project name"
      />

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Undo */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={undo}
          disabled={undoStack.length === 0}
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </Button>

        {/* Redo */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={redo}
          disabled={redoStack.length === 0}
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </Button>

        {/* Zoom % */}
        <button
          type="button"
          onClick={onZoomCycle}
          className="h-9 px-1.5 sm:px-2.5 rounded-lg bg-white/8 hover:bg-white/14 transition-all text-xs font-semibold text-[#EDEAE3] tabular-nums min-w-[44px] sm:min-w-[52px] text-center active:scale-95"
          aria-label="Cycle zoom level"
        >
          {zoomPct}%
        </button>

        {/* Export */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onExport}
          aria-label="Export"
        >
          <Download size={16} />
        </Button>

        {/* Focus mode */}
        <Button
          variant={focus ? 'default' : 'ghost'}
          size="icon-sm"
          onClick={() => setFocus(!focus)}
          aria-label={focus ? 'Exit focus mode' : 'Focus mode'}
        >
          <Focus size={16} />
        </Button>
      </div>
    </div>
  );
}
