import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

export const badgeVariants = ({ variant = 'default', className = '' }: { variant?: BadgeVariant; className?: string } = {}) => cn(
  'inline-flex h-5 w-fit items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
  variant === 'secondary' && 'bg-slate-100 text-slate-800 border-slate-200',
  variant === 'destructive' && 'bg-rose-50 text-rose-700 border-rose-200',
  variant === 'outline' && 'bg-white text-slate-700 border-slate-300',
  variant === 'ghost' && 'border-transparent text-slate-700 hover:bg-slate-100',
  variant === 'link' && 'border-transparent text-teal-700 underline-offset-4 hover:underline',
  variant === 'default' && 'bg-teal-600 text-white border-teal-600',
  className,
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={badgeVariants({ variant, className })} {...props} />
));
Badge.displayName = 'Badge';
