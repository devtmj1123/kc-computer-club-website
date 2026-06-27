'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { Badge, CategoryBadge } from '@/components/ui/Badge';

interface NoticeCardProps {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string | Date;
  isPinned?: boolean;
  isImportant?: boolean;
  className?: string;
}

export function NoticeCard({
  id,
  title,
  summary,
  category,
  publishedAt,
  isPinned = false,
  isImportant = false,
  className,
}: NoticeCardProps) {
  const date = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;

  return (
    <Link href={`/notices/${id}`} className="block group">
      <article
        className={cn(
          'rounded-3xl bg-[var(--nm-bg)] shadow-[var(--nm-raised)]',
          'overflow-hidden',
          'hover:shadow-[var(--nm-raised-lg)] hover:-translate-y-1',
          'transition-all duration-300',
          'cursor-pointer',
          'h-full flex flex-col',
          className
        )}
      >
        <div className="relative h-32 bg-gradient-to-br from-primary/24 via-primary/12 to-transparent flex items-center justify-center overflow-hidden shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
          <span className="material-symbols-outlined text-5xl text-primary/50 drop-shadow-sm">
            article
          </span>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <CategoryBadge category={category} />
            {isPinned && (
              <Badge variant="warning" size="sm" className="shadow-[var(--nm-raised-sm)]">
                <span className="material-symbols-outlined text-xs mr-1">push_pin</span>
                置顶
              </Badge>
            )}
            {isImportant && (
              <Badge variant="danger" size="sm" className="shadow-[var(--nm-raised-sm)]">
                <span className="material-symbols-outlined text-xs mr-1">priority_high</span>
                重要
              </Badge>
            )}
          </div>

          <h3
            className={cn(
              'font-bold text-[var(--foreground)]',
              'group-hover:text-primary',
              'transition-colors duration-200',
              'line-clamp-2 mb-2'
            )}
          >
            {title}
          </h3>

          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3 flex-1">
            {truncate(summary, 100)}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              {formatRelativeTime(date)}
            </span>
            <span
              className={cn(
                'text-xs text-primary',
                'flex items-center gap-1',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-200'
              )}
            >
              阅读更多
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

interface NoticeCardCompactProps {
  id: string;
  title: string;
  category: string;
  publishedAt: string | Date;
  isImportant?: boolean;
  className?: string;
}

export function NoticeCardCompact({
  id,
  title,
  category,
  publishedAt,
  isImportant = false,
  className,
}: NoticeCardCompactProps) {
  const date = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;

  return (
    <Link href={`/notices/${id}`}>
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-2xl',
          'bg-[var(--nm-bg)] shadow-[var(--nm-raised-sm)]',
          'hover:shadow-[var(--nm-raised)] hover:-translate-y-0.5',
          'transition-all duration-300',
          'cursor-pointer group',
          className
        )}
      >
        <div className="size-10 rounded-2xl bg-primary/12 flex items-center justify-center shrink-0 shadow-[var(--nm-inset-sm)]">
          <span className="material-symbols-outlined text-primary">
            {isImportant ? 'priority_high' : 'article'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--foreground)] group-hover:text-primary transition-colors truncate">
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
            <span>{category}</span>
            <span>·</span>
            <span>{formatRelativeTime(date)}</span>
          </div>
        </div>

        <span className="material-symbols-outlined text-[var(--text-secondary)] group-hover:text-primary transition-colors">
          chevron_right
        </span>
      </div>
    </Link>
  );
}
