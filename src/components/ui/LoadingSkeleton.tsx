import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded bg-gray-200', className)} />;
}

export interface TableSkeletonProps {
  rows?: number;
  /** Renders a leading circle for tables whose first column has an avatar. */
  withAvatar?: boolean;
}

/** Row-shaped placeholder used by every table while its request is in flight. */
export function TableSkeleton({ rows = 5, withAvatar = true }: TableSkeletonProps) {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="Loading emails">
      {Array.from({ length: rows }).map((_, index) =>
      <div key={index} className="flex items-center gap-3">
          {withAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-28 max-w-full" />
          </div>
          <Skeleton className="hidden h-3.5 w-36 sm:block" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      )}
      <span className="sr-only">Loading…</span>
    </div>);

}