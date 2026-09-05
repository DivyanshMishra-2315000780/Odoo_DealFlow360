import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function TableLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 p-4">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/6" />
          <Skeleton className="h-10 w-1/6" />
          <Skeleton className="h-10 w-1/6" />
          <Skeleton className="h-10 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3 shadow-enterprise">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}
