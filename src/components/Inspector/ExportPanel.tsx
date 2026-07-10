'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { buildExportCanvas, exportToFile, shareCanvas } from '@/lib/exportUtils';
import { Download, Share2, Printer } from 'lucide-react';

type Format = 'png' | 'jpeg' | 'pdf';
type Size = '1x' | '2x' | '3x';

const SIZE_MAP: Record<Size, number> = { '1x': 1, '2x': 2, '3x': 3 };

interface ExportPanelProps {
  processedCanvas: HTMLCanvasElement | null;
  orientedCanvas: HTMLCanvasElement | null;
}

export function ExportPanel({ processedCanvas, orientedCanvas }: ExportPanelProps) {
  const project = useStore((s) => s.project);
  const showToast = useStore((s) => s.showToast);
  const [fmt, setFmt] = useState<Format>('jpeg');
  const [size, setSize] = useState<Size>('1x');
  const [includeGrid, setIncludeGrid] = useState(true);
  const [exporting, setExporting] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const doExport = async (mode: 'save' | 'share' | 'print') => {
    if (!orientedCanvas) {
      showToast('No image loaded');
      return;
    }
    setExporting(true);
    try {
      const scale = SIZE_MAP[size];
      const canvas = buildExportCanvas(orientedCanvas, project, { scale, grid: includeGrid });
      const name = project.name || 'sketchgrid-export';

      if (mode === 'save' || mode === 'print') {
        const fileFmt = mode === 'print' ? 'pdf' : fmt;
        await exportToFile(canvas, name, fileFmt, 0.92);
        showToast(mode === 'print' ? 'PDF saved' : 'Exported!');
      } else if (mode === 'share') {
        await shareCanvas(canvas, name, fmt === 'pdf' ? 'jpeg' : fmt);
        showToast('Shared!');
      }
    } catch (e) {
      console.error(e);
      showToast('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Format */}
      <div>
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Format</p>
        <div className="flex gap-2">
          {(['jpeg', 'png', 'pdf'] as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFmt(f)}
              className={cn(
                'flex-1 h-10 rounded-lg text-sm font-medium uppercase transition-all',
                fmt === f
                  ? 'bg-[#5FB6E8] text-[#0E2836]'
                  : 'bg-white/8 text-[#EDEAE3] hover:bg-white/14'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Size</p>
        <div className="flex gap-2">
          {(['1x', '2x', '3x'] as Size[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={cn(
                'flex-1 h-10 rounded-lg text-sm font-medium transition-all',
                size === s
                  ? 'bg-[#5FB6E8] text-[#0E2836]'
                  : 'bg-white/8 text-[#EDEAE3] hover:bg-white/14'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Switch
        label="Include grid overlay"
        checked={includeGrid}
        onCheckedChange={setIncludeGrid}
      />

      <div className="h-px bg-white/8" />

      <Button
        variant="default"
        size="lg"
        className="w-full"
        onClick={() => doExport('save')}
        disabled={exporting || !orientedCanvas}
      >
        <Download size={18} className="mr-2" />
        {exporting ? 'Exporting…' : 'Save to device'}
      </Button>

      {canShare && (
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => doExport('share')}
          disabled={exporting || !orientedCanvas}
        >
          <Share2 size={18} className="mr-2" />
          Share
        </Button>
      )}

      <Button
        variant="ghost"
        size="lg"
        className="w-full"
        onClick={() => doExport('print')}
        disabled={exporting || !orientedCanvas}
      >
        <Printer size={18} className="mr-2" />
        Save as PDF
      </Button>
    </div>
  );
}
