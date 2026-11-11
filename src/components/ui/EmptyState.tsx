'use client';

import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-dashed border-[var(--border)] px-6 py-14',
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)]">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>

      <h3 className="mb-2 font-display text-[18px] font-bold text-[var(--foreground)]">
        {title}
      </h3>

      {description && (
        <p className="mb-6 max-w-sm text-center text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = '出错了',
  message = '加载数据时发生错误，请稍后重试。',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-dashed border-[var(--error)]/40 px-6 py-14',
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center border border-[var(--error)]/30 bg-[var(--error-light)] text-[var(--error)]">
        <span className="material-symbols-outlined text-[24px]">error</span>
      </div>

      <h3 className="mb-2 font-display text-[18px] font-bold text-[var(--foreground)]">
        {title}
      </h3>

      <p className="mb-6 max-w-sm text-center text-[12px] leading-relaxed text-[var(--text-secondary)]">
        {message}
      </p>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry} leftIcon="refresh">
          重试
        </Button>
      )}
    </div>
  );
}
