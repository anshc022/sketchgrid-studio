'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        default: 'bg-[#5FB6E8] text-[#0E2836] hover:bg-[#7AC4EE]',
        ghost: 'bg-white/8 text-[#EDEAE3] hover:bg-white/14',
        danger: 'bg-[#E06A50]/20 text-[#E06A50] hover:bg-[#E06A50]/30',
        outline: 'border border-white/20 text-[#EDEAE3] hover:bg-white/8',
      },
      size: {
        sm: 'h-9 px-3 text-sm min-w-9',
        md: 'h-12 px-4 text-sm min-w-12',
        lg: 'h-14 px-6 text-base min-w-14',
        icon: 'h-12 w-12 p-0',
        'icon-sm': 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return (
      <button
        type={type}
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
