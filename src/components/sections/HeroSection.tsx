'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DEFAULT_CLUB_SETTINGS } from '@/lib/club-settings';

interface HeroSectionProps {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  highlights?: string[];
  statusText?: string;
  className?: string;
  aside?: React.ReactNode;
}

export function HeroSection({
  eyebrow = DEFAULT_CLUB_SETTINGS.heroEyebrow,
  headline = DEFAULT_CLUB_SETTINGS.heroTitle,
  subheadline = DEFAULT_CLUB_SETTINGS.heroSubtitle,
  highlights = DEFAULT_CLUB_SETTINGS.heroHighlights,
  statusText,
  className,
  aside,
}: HeroSectionProps) {
  const commaIndex = headline.indexOf('，');
  const firstLine = commaIndex > 0 ? headline.slice(0, commaIndex + 1) : headline;
  const secondLine = commaIndex > 0 ? headline.slice(commaIndex + 1) : '';

  return (
    <section
      className={cn(
        'grid grid-cols-1 gap-12 border-b border-[var(--border)] px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:px-8 lg:pb-16 lg:pt-16',
        className
      )}
    >
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>

        <h1 className="mt-7 max-w-[780px] font-display text-[clamp(2.9rem,7vw,5.4rem)] leading-[1.02] tracking-[-0.02em] text-[var(--foreground)]">
          {firstLine}
          {secondLine && (
            <>
              <br />
              <span className="text-[var(--primary)]">{secondLine}</span>
            </>
          )}
        </h1>

        <p className="mt-7 max-w-[600px] text-[14px] leading-[1.95] text-[var(--text-secondary)] sm:text-[15px]">
          {subheadline}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link href="/activities" className="btn btn-primary">
            浏览近期活动
            <span className="arr text-[15px] leading-none" aria-hidden="true">→</span>
          </Link>
          <Link href="/about" className="btn">
            了解学会
            <span className="arr text-[14px] leading-none" aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="mt-11 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          {highlights.map((highlight) => (
            <span key={highlight} className="inline-flex items-center gap-2">
              <span className="size-1 rounded-full bg-[var(--primary)]" />
              {highlight}
            </span>
          ))}
          {statusText && (
            <span className="inline-flex items-center gap-2 text-[var(--primary)]">
              <span className="size-1 rounded-full bg-[var(--primary)]" />
              {statusText}
            </span>
          )}
        </div>
      </div>

      {aside && <div className="min-w-0">{aside}</div>}
    </section>
  );
}
