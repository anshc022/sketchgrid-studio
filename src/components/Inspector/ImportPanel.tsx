'use client';
import { Button } from '@/components/ui/button';
import { ImagePlus, Sparkles } from 'lucide-react';

interface ImportPanelProps {
  onImport: () => void;
  onSample: () => void;
}

export function ImportPanel({ onImport, onSample }: ImportPanelProps) {
  return (
    <div className="space-y-4 pt-2">
      <Button variant="default" size="lg" className="w-full" onClick={onImport}>
        <ImagePlus size={18} className="mr-2" />
        Import photo
      </Button>

      <Button variant="ghost" size="lg" className="w-full" onClick={onSample}>
        <Sparkles size={18} className="mr-2" />
        Try sample still life
      </Button>

      <div className="mt-4 py-3 px-3 bg-white/6 rounded-xl">
        <p className="text-xs text-[#A39D93] leading-relaxed">
          You can also <strong className="text-[#EDEAE3]">drag & drop</strong> an image onto the canvas,
          or <strong className="text-[#EDEAE3]">paste</strong> from the clipboard (⌘V / Ctrl+V).
        </p>
        <p className="text-xs text-[#A39D93] leading-relaxed mt-2">
          Supported formats: JPEG, PNG, WebP, HEIC.
        </p>
      </div>
    </div>
  );
}
