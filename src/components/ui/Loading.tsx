'use client';

import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export function Loading({
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div
        className={cn(
          'rounded-full border-[var(--border)] border-t-[var(--primary)] animate-spin',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,22,18,0.55)] backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export function Skeleton({
  width,
  height,
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        circle ? 'rounded-full' : 'rounded-[3px]',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[3px] border border-[var(--border)] p-4 bg-[var(--surface)]',
        className
      )}
    >
      <div className="flex gap-2 mb-3">
        <Skeleton width={60} height={20} />
        <Skeleton width={40} height={20} />
      </div>
      <Skeleton width="100%" height={24} className="mb-2" />
      <Skeleton width="80%" height={16} className="mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={14} />
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <Skeleton width={40} height={40} circle />
          <div className="flex-1">
            <Skeleton width="60%" height={16} className="mb-2" />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
