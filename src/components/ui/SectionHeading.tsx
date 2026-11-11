import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  index?: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function SectionHeading({
  index,
  title,
  actionLabel,
  actionHref,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-[var(--rule-strong)] pb-4',
        className
      )}
    >
      {index && (
        <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
          {index}
        </span>
      )}
      <h2 className="font-display text-[22px] font-bold leading-none tracking-[-0.02em] text-[var(--foreground)] sm:text-[26px]">
        {title}
      </h2>
      <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
        >
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
