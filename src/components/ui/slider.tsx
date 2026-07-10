'use client';
import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  format?: (value: number) => string;
  className?: string;
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  format,
  className,
}: SliderProps) {
  const display = format ? format(value) : String(value);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#A39D93] font-medium">{label}</span>
        <span className="text-xs text-[#EDEAE3] font-semibold tabular-nums">{display}</span>
      </div>
      <RadixSlider.Root
        className="relative flex items-center select-none touch-none w-full h-12"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
      >
        <RadixSlider.Track className="bg-white/16 relative grow rounded-full h-[6px]">
          <RadixSlider.Range className="absolute bg-[#5FB6E8] rounded-full h-full" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block w-7 h-7 bg-[#EDEAE3] border-[3px] border-[#282624] shadow-[0_2px_8px_rgba(0,0,0,0.5)] rounded-full focus:outline-none active:bg-[#5FB6E8]"
          aria-label={label}
        />
      </RadixSlider.Root>
    </div>
  );
}
