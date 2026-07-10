'use client';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Switch({ label, checked, onCheckedChange, className }: SwitchProps) {
  return (
    <label
      className={cn(
        'flex items-center justify-between min-h-[52px] gap-3 cursor-pointer',
        className
      )}
    >
      <span className="text-sm text-[#EDEAE3]">{label}</span>
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'relative inline-flex w-[48px] h-[28px] rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-[#5FB6E8]' : 'bg-white/20'
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            'block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 translate-x-1 mt-[4px]',
            checked && 'translate-x-[24px]'
          )}
        />
      </RadixSwitch.Root>
    </label>
  );
}
