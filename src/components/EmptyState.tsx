'use client';
import { Button } from './ui/button';

interface EmptyStateProps {
  onImport: () => void;
  onSample: () => void;
}

export function EmptyState({ onImport, onSample }: EmptyStateProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div
        className="pointer-events-auto flex flex-col items-center gap-5 p-8 rounded-[22px] max-w-sm w-full mx-4"
        style={{
          background: 'rgba(32,30,28,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 34px rgba(0,0,0,0.45)',
        }}
      >
        {/* Grid illustration */}
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="72" height="72" rx="10" fill="#1D4A3A" />
          <line x1="4" y1="28" x2="76" y2="28" stroke="#5FB6E8" strokeWidth="2" opacity="0.7" />
          <line x1="4" y1="52" x2="76" y2="52" stroke="#5FB6E8" strokeWidth="2" opacity="0.7" />
          <line x1="28" y1="4" x2="28" y2="76" stroke="#5FB6E8" strokeWidth="2" opacity="0.7" />
          <line x1="52" y1="4" x2="52" y2="76" stroke="#5FB6E8" strokeWidth="2" opacity="0.7" />
          <circle cx="40" cy="36" r="14" fill="white" opacity="0.9" />
          <ellipse cx="40" cy="56" rx="10" ry="3" fill="white" opacity="0.25" />
        </svg>

        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-[#EDEAE3] mb-1">SketchGrid Studio</h1>
          <p className="text-[#A39D93] text-sm leading-relaxed">
            Grid up any reference photo for accurate freehand drawing
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button variant="default" size="lg" className="w-full" onClick={onImport}>
            Import a reference photo
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={onSample}>
            Try a sample still life
          </Button>
        </div>

        <p className="text-[#A39D93] text-xs text-center">
          You can also drag &amp; drop an image or paste from clipboard
        </p>
      </div>
    </div>
  );
}
