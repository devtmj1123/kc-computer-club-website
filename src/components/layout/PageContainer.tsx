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
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    minHeight: '100vh',
  };

  return (
    <div
      style={containerStyle}
      className={cn(
        'transition-colors duration-300',
        light && 'bg-[#f8faf9] text-[#111814]',
        dark && 'bg-[#0d1812] text-white',
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
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
  };

  return (
    <div
      style={cardStyle}
      className={cn(
        'border rounded-lg transition-all duration-200',
        hover && 'hover:border-primary hover:shadow-lg',
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
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { color: 'var(--foreground)' },
    secondary: { color: 'var(--text-secondary)' },
    tertiary: { color: 'var(--text-tertiary)' },
    accent: { color: 'var(--primary)' },
  };

  return (
    <span style={variantStyles[variant]} className={className}>
      {children}
    </span>
  );
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
  const headingStyle: React.CSSProperties = {
    color: 'var(--foreground)',
  };

  const headings = {
    1: (
      <h1 style={headingStyle} className={cn('text-3xl font-bold', className)}>
        {children}
      </h1>
    ),
    2: (
      <h2 style={headingStyle} className={cn('text-2xl font-bold', className)}>
        {children}
      </h2>
    ),
    3: (
      <h3 style={headingStyle} className={cn('text-xl font-bold', className)}>
        {children}
      </h3>
    ),
    4: (
      <h4 style={headingStyle} className={cn('text-lg font-semibold', className)}>
        {children}
      </h4>
    ),
    5: (
      <h5 style={headingStyle} className={cn('text-base font-semibold', className)}>
        {children}
      </h5>
    ),
    6: (
      <h6 style={headingStyle} className={cn('text-sm font-semibold', className)}>
        {children}
      </h6>
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
    <section className={cn('py-6 px-4 md:px-6', className)}>
      {title && (
        <TextHeading level={2} className="mb-2">
          {title}
        </TextHeading>
      )}
      {subtitle && (
        <Text variant="secondary" className="text-sm mb-4 block">
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
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  const dividerStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
  };

  return <div style={dividerStyle} className={cn('border-t', className)} />;
}

export function StatusBadge({
  status,
  className,
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
}) {
  const statusColors: Record<string, React.CSSProperties> = {
    success: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: 'var(--success)',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: 'var(--warning)',
    },
    error: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--error)',
    },
    info: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: 'var(--info)',
    },
    default: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      color: 'var(--foreground)',
    },
  };

  return (
    <span
      style={statusColors[status]}
      className={cn('px-2 py-1 rounded-full text-xs font-medium', className)}
    >
      {status}
    </span>
  );
}
