import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-md';

    const variantClasses = {
      default: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-enterprise',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-enterprise',
      destructive:
        'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 active:bg-rose-200',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      link: 'text-teal-700 underline-offset-4 hover:underline p-0 h-auto',
    }[variant];

    const sizeClasses = {
      sm: 'text-xs h-8 px-2.5 gap-1.5',
      md: 'text-xs h-9 px-3.5 gap-2',
      lg: 'text-sm h-10 px-4 gap-2',
      icon: 'h-8 w-8 p-0',
      'icon-sm': 'h-7 w-7 p-0',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
