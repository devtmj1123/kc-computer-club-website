'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Loading';

interface Notice {
  id: string;
  title: string;
  summary: string;
  category: string;
  icon: string;
  iconColor: string;
  publishedAt: string | Date;
}

interface NoticesSectionProps {
  notices: Notice[];
  isLoading?: boolean;
  className?: string;
}

function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function NoticesSection({ notices, isLoading = false, className }: NoticesSectionProps) {
  const visibleNotices = notices.slice(0, 3);

  return (
    <section className={cn('min-w-0', className)}>
      <SectionHeading
        index="01"
        title="最新公告"
        actionLabel="查看全部"
        actionHref="/notices"
      />

      {isLoading ? (
        <div aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2 border-b border-[var(--border)] py-5 sm:grid-cols-[88px_minmax(0,1fr)_92px_16px] sm:items-center sm:gap-5 sm:px-3"
            >
              <Skeleton className="h-2.5 w-14" />
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <Skeleton className="h-4 w-[82%]" />
                <Skeleton className="mt-2 h-2.5 w-[60%]" />
              </div>
              <Skeleton className="hidden h-2.5 w-14 sm:block" />
              <Skeleton className="hidden h-3 w-3 sm:block" />
            </div>
          ))}
        </div>
      ) : visibleNotices.length === 0 ? (
        <div className="flex items-center justify-between border-b border-[var(--border)] py-8">
          <p className="text-[13px] text-[var(--text-secondary)]">暂无公告</p>
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            No notices
          </span>
        </div>
      ) : (
        <div>
          {visibleNotices.map((notice, index) => (
            <Link
              key={notice.id}
              href={`/notices/${notice.id}`}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2 border-b border-[var(--border)] py-5 transition-colors hover:bg-[var(--primary-light)] sm:grid-cols-[88px_minmax(0,1fr)_92px_16px] sm:items-center sm:gap-5 sm:px-3"
            >
              <span className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.12em] text-[var(--primary)]">
                {notice.category || '公告'}
              </span>

              <span className="text-right font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)] sm:hidden">
                {formatDate(notice.publishedAt)}
              </span>

              <div className="col-span-2 min-w-0 sm:col-span-1">
                <h3 className="font-display text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)] sm:text-[18px]">
                  {notice.title}
                </h3>
                {notice.summary && (
                  <p className="mt-1.5 line-clamp-1 text-[12px] leading-[1.7] text-[var(--text-tertiary)]">
                    {notice.summary}
                  </p>
                )}
              </div>

              <span className="hidden text-right font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)] sm:block">
                {formatDate(notice.publishedAt)}
              </span>

              <span className="hidden text-[13px] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--primary)] sm:block">
                ↗
              </span>

              <span className="sr-only">第 {index + 1} 条公告</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        <span>PUBLIC NOTICES</span>
        <span>{String(visibleNotices.length).padStart(2, '0')} 条</span>
      </div>
    </section>
  );
}

interface Activity {
  id: string;
  title: string;
  category: string;
  categoryColor?: string;
  date: string | Date;
  time: string;
  location: string;
}

interface EventsSectionProps {
  activities: Activity[];
  isLoading?: boolean;
  className?: string;
}

export function EventsSection({ activities, isLoading = false, className }: EventsSectionProps) {
  const visibleActivities = activities.slice(0, 3);

  return (
    <section className={cn('min-w-0', className)}>
      <SectionHeading
        index="02"
        title="近期活动"
        actionLabel="全部活动"
        actionHref="/activities"
      />

      {isLoading ? (
        <div aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-5 border-b border-[var(--border)] py-5 sm:px-3"
            >
              <Skeleton className="h-14 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="mt-3 h-4 w-[78%]" />
                <Skeleton className="mt-2 h-2.5 w-24" />
              </div>
              <Skeleton className="mt-1 h-3 w-3" />
            </div>
          ))}
        </div>
      ) : visibleActivities.length === 0 ? (
        <div className="flex items-center justify-between border-b border-[var(--border)] py-8">
          <p className="text-[13px] text-[var(--text-secondary)]">暂无活动</p>
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            No events
          </span>
        </div>
      ) : (
        <div>
          {visibleActivities.map((activity) => {
            const date =
              typeof activity.date === 'string' ? new Date(activity.date) : activity.date;
            const validDate = !Number.isNaN(date.getTime());

            return (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
                className="group flex items-start gap-5 border-b border-[var(--border)] py-5 transition-colors hover:bg-[var(--primary-light)] sm:px-3"
              >
                <span className="flex w-12 shrink-0 flex-col items-center border border-[var(--rule-strong)] py-2">
                  <span className="font-display text-[24px] font-bold leading-none text-[var(--foreground)]">
                    {validDate ? String(date.getDate()).padStart(2, '0') : '--'}
                  </span>
                  <span className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    {validDate
                      ? date.toLocaleDateString('en-US', { month: 'short' })
                      : 'TBA'}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--primary)]">
                      {activity.category || '活动'}
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      {activity.time}
                    </span>
                  </span>
                  <h3 className="mt-2 font-display text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                    {activity.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {activity.location}
                  </p>
                </span>

                <span className="mt-1 text-[13px] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--primary)]">
                  ↗
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        <span>UPCOMING EVENTS</span>
        <span>{String(visibleActivities.length).padStart(2, '0')} 场</span>
      </div>
    </section>
  );
}
