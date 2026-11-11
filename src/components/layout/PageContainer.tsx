import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  light?: boolean;
  dark?: boolean;
}

export function PageContainer({
  children,
  className,
  light = false,
  dark = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-transparent text-[var(--foreground)] transition-colors duration-200',
        light && 'bg-transparent text-[var(--foreground)]',
        dark && 'bg-transparent text-[var(--foreground)]',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardContainerProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  compact?: boolean;
}

export function CardContainer({
  children,
  className,
  hover = true,
  compact = false,
}: CardContainerProps) {
  return (
    <div
      className={cn(
        'border border-[var(--border)] bg-[var(--surface)] transition-colors duration-150',
        hover && 'hover:border-[var(--rule-strong)]',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Text({
  children,
  variant = 'primary',
  className,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  className?: string;
}) {
  const variantStyles: Record<string, string> = {
    primary: 'text-[var(--foreground)]',
    secondary: 'text-[var(--text-secondary)]',
    tertiary: 'text-[var(--text-tertiary)]',
    accent: 'text-[var(--primary)]',
  };

  return <span className={cn(variantStyles[variant], className)}>{children}</span>;
}

export function TextHeading({
  children,
  level = 2,
  className,
}: {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const headings = {
    1: (
      <h1 className={cn('font-display text-3xl font-bold tracking-[-0.03em]', className)}>
        {children}
      </h1>
    ),
    2: (
      <h2 className={cn('font-display text-2xl font-bold tracking-[-0.02em]', className)}>
        {children}
      </h2>
    ),
    3: (
      <h3 className={cn('font-display text-xl font-bold tracking-[-0.015em]', className)}>
        {children}
      </h3>
    ),
    4: (
      <h4 className={cn('font-display text-lg font-semibold', className)}>{children}</h4>
    ),
    5: (
      <h5 className={cn('text-base font-semibold', className)}>{children}</h5>
    ),
    6: (
      <h6 className={cn('text-sm font-semibold', className)}>{children}</h6>
    ),
  };

  return headings[level];
}

export function Section({
  children,
  className,
  title,
  subtitle,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className={cn('px-4 py-6 md:px-6', className)}>
      {title && (
        <TextHeading level={2} className="mb-2">
          {title}
        </TextHeading>
      )}
      {subtitle && (
        <Text variant="secondary" className="mb-4 block text-sm">
          {subtitle}
        </Text>
      )}
      {children}
    </section>
  );
}

export function CardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-[var(--border)]', className)} />;
}

export function StatusBadge({
  status,
  className,
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
}) {
  const statusStyles: Record<string, string> = {
    success: 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--success)]',
    warning: 'border-[var(--warning)]/40 bg-[var(--warning-light)] text-[var(--warning)]',
    error: 'border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]',
    info: 'border-[var(--info)]/40 bg-[var(--info-light)] text-[var(--info)]',
    default: 'border-[var(--border)] text-[var(--text-secondary)]',
  };

  const labels: Record<string, string> = {
    success: '成功',
    warning: '注意',
    error: '错误',
    info: '信息',
    default: '默认',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.08em]',
        statusStyles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
