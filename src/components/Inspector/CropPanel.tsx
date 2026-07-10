'use client';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

const ASPECT_RATIOS = [
  { label: 'Free', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '5:7', value: 5 / 7 },
  { label: 'A4', value: 210 / 297 },
];

interface CropPanelProps {
  onApply: () => void;
  onCancel: () => void;
}

export function CropPanel({ onApply, onCancel }: CropPanelProps) {
  const orient = useStore((s) => s.project.orient);
  const setOrient = useStore((s) => s.setOrient);
  const commit = useStore((s) => s.commit);
  const cropAspect = useStore((s) => s.cropAspect);
  const setCropAspect = useStore((s) => s.setCropAspect);

  const rotate = () => {
    setOrient({ ...orient, rot: ((orient.rot + 90) % 360) as 0 | 90 | 180 | 270 });
    commit();
  };

  const flipH = () => {
    setOrient({ ...orient, fh: !orient.fh });
    commit();
  };

  const flipV = () => {
    setOrient({ ...orient, fv: !orient.fv });
    commit();
  };

  return (
    <div className="space-y-4">
      {/* Aspect ratio chips */}
      <div>
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Aspect ratio</p>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => setCropAspect(value)}
              className={cn(
                'h-11 px-4 rounded-lg text-sm font-medium transition-all active:scale-95',
                cropAspect === value
                  ? 'bg-[#5FB6E8] text-[#0E2836]'
                  : 'bg-white/8 text-[#EDEAE3] hover:bg-white/14'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/8" />

      {/* Transform controls */}
      <div>
        <p className="text-xs text-[#A39D93] mb-3 font-medium">Transform</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={rotate}
            className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl bg-white/8 hover:bg-white/14 active:scale-95 transition-all"
          >
            <RotateCw size={20} className="text-[#EDEAE3]" />
            <span className="text-xs text-[#A39D93]">Rotate 90°</span>
          </button>
          <button
            type="button"
            onClick={flipH}
            className={cn(
              'flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl transition-all active:scale-95',
              orient.fh ? 'bg-[#5FB6E8]/20 border border-[#5FB6E8]/40' : 'bg-white/8 hover:bg-white/14'
            )}
          >
            <FlipHorizontal size={20} className={orient.fh ? 'text-[#5FB6E8]' : 'text-[#EDEAE3]'} />
            <span className="text-xs text-[#A39D93]">Flip H</span>
          </button>
          <button
            type="button"
            onClick={flipV}
            className={cn(
              'flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl transition-all active:scale-95',
              orient.fv ? 'bg-[#5FB6E8]/20 border border-[#5FB6E8]/40' : 'bg-white/8 hover:bg-white/14'
            )}
          >
            <FlipVertical size={20} className={orient.fv ? 'text-[#5FB6E8]' : 'text-[#EDEAE3]'} />
            <span className="text-xs text-[#A39D93]">Flip V</span>
          </button>
        </div>
      </div>

      {/* Rotation display */}
      <div className="py-2 px-3 bg-white/6 rounded-xl">
        <p className="text-xs text-[#A39D93]">
          Rotation:{' '}
          <span className="text-[#EDEAE3] font-semibold">{orient.rot}°</span>
          {orient.fh && <span className="ml-2 text-[#5FB6E8]">H-flipped</span>}
          {orient.fv && <span className="ml-2 text-[#5FB6E8]">V-flipped</span>}
        </p>
      </div>

      <div className="h-px bg-white/8" />

      <p className="text-xs text-[#A39D93] leading-relaxed">
        Drag the handles on the canvas to set the crop region. Tap Apply to confirm.
      </p>

      <div className="flex gap-3 pt-1">
        <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="default" size="md" className="flex-1" onClick={onApply}>
          Apply crop
        </Button>
      </div>
    </div>
  );
}
