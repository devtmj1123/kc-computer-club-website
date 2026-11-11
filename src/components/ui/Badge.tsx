'use client';

import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)]',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20',
  warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
  danger: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20',
  info: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20',
  purple: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20',
};

const dotColors = {
  default: 'bg-[var(--border)]',
  primary: 'bg-primary',
  success: 'bg-[var(--primary)]',
  warning: 'bg-[var(--warning)]',
  danger: 'bg-[var(--error)]',
  info: 'bg-[var(--primary)]',
  purple: 'bg-[var(--primary)]',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-mono uppercase tracking-[0.06em]',
        size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-0.5 text-xs',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

export interface StatusBadgeProps {
  status: 'draft' | 'published' | 'pending' | 'confirmed' | 'cancelled' | 'planned' | 'active' | 'ended' | 'inactive';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'warning' as const, dot: true },
    published: { label: 'Published', variant: 'success' as const, dot: true },
    pending: { label: 'Pending', variant: 'warning' as const, dot: true },
    confirmed: { label: 'Confirmed', variant: 'success' as const, dot: true },
    cancelled: { label: 'Cancelled', variant: 'danger' as const, dot: true },
    planned: { label: 'Planned', variant: 'info' as const, dot: true },
    active: { label: '进行中', variant: 'success' as const, dot: true },
    ended: { label: '已结束', variant: 'default' as const, dot: true },
    inactive: { label: '未激活', variant: 'default' as const, dot: true },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot={config.dot} size={size}>
      {config.label}
    </Badge>
  );
}

export interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const categoryConfig: Record<string, { variant: BadgeProps['variant'] }> = {
    Event: { variant: 'purple' },
    Urgent: { variant: 'warning' },
    General: { variant: 'info' },
    Workshop: { variant: 'primary' },
    Competition: { variant: 'danger' },
    Social: { variant: 'success' },
    活动: { variant: 'purple' },
    紧急: { variant: 'warning' },
    通知: { variant: 'info' },
    工作坊: { variant: 'primary' },
    比赛: { variant: 'danger' },
    社交: { variant: 'success' },
  };

  const config = categoryConfig[category] || { variant: 'default' as const };

  return (
    <Badge variant={config.variant} size={size}>
      {category.toUpperCase()}
    </Badge>
  );
}
