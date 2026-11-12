import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

/**
 * Shared static skeleton layouts.
 *
 * These are intentionally server-safe (no hooks), so both `loading.tsx`
 * boundaries and client pages can render the same preview.
 */

function SkeletonBar({
  className,
  width,
}: {
  className?: string;
  width?: string;
}) {
  return <Skeleton className={cn('h-3', className)} width={width} />;
}

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border-b border-[var(--rule-strong)] pb-8', className)}>
      <SkeletonBar className="h-2.5 w-32" />
      <SkeletonBar className="mt-5 h-9 w-[min(420px,80%)]" />
      <SkeletonBar className="mt-3 h-9 w-[min(300px,62%)]" />
      <SkeletonBar className="mt-5 h-3 w-[min(460px,90%)]" />
    </div>
  );
}

export function ListPageSkeleton({
  rows = 5,
  variant = 'default',
  className,
}: {
  rows?: number;
  variant?: 'default' | 'activity';
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12', className)}>
      <SkeletonBar className="mb-8 h-2.5 w-28" />
      <PageHeaderSkeleton />

      <div className="flex flex-col gap-3 border-b border-[var(--border)] py-5 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-40" />
        {variant === 'activity' && <Skeleton className="h-10 w-full sm:w-40" />}
      </div>

      <div className="mt-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) =>
          variant === 'activity' ? (
            <div
              key={index}
              className="grid grid-cols-1 gap-5 border-b border-[var(--border)] py-6 sm:grid-cols-[64px_minmax(0,1fr)_150px_18px] sm:items-start sm:px-3"
            >
              <Skeleton className="h-16 w-14" />
              <div className="min-w-0">
                <SkeletonBar className="h-2.5 w-28" />
                <SkeletonBar className="mt-3 h-5 w-[min(360px,80%)]" />
                <SkeletonBar className="mt-3 h-3 w-[min(520px,95%)]" />
                <SkeletonBar className="mt-2 h-3 w-[min(420px,75%)]" />
                <div className="mt-3 flex gap-5">
                  <SkeletonBar className="h-2.5 w-24" />
                  <SkeletonBar className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 sm:justify-self-end" />
              <Skeleton className="hidden h-3 w-3 sm:block" />
            </div>
          ) : (
            <div
              key={index}
              className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-2 border-b border-[var(--border)] py-6 sm:grid-cols-[88px_minmax(0,1fr)_110px_18px] sm:items-start sm:px-3"
            >
              <SkeletonBar className="h-2.5 w-14" />
              <SkeletonBar className="h-2.5 w-16 sm:hidden" />
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <SkeletonBar className="h-5 w-[min(420px,86%)]" />
                <SkeletonBar className="mt-3 h-3 w-[min(560px,95%)]" />
                <SkeletonBar className="mt-2 h-3 w-[min(380px,70%)]" />
                <SkeletonBar className="mt-3 h-2.5 w-24" />
              </div>
              <SkeletonBar className="hidden h-2.5 w-16 sm:block" />
              <Skeleton className="hidden h-3 w-3 sm:block" />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function ProjectsGridSkeleton({
  cards = 6,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12', className)}>
      <SkeletonBar className="mb-8 h-2.5 w-28" />
      <PageHeaderSkeleton />

      <div className="flex flex-col gap-3 border-b border-[var(--border)] py-5 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <SkeletonBar className="h-2.5 w-20" />
      </div>

      <div className="mt-8 grid grid-cols-1 border-l border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[280px] flex-col border-b border-r border-[var(--border)] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <SkeletonBar className="h-2.5 w-8" />
              <SkeletonBar className="h-2.5 w-16" />
            </div>
            <SkeletonBar className="mt-5 h-2.5 w-24" />
            <SkeletonBar className="mt-2 h-5 w-[min(220px,80%)]" />
            <SkeletonBar className="mt-3 h-3 w-full" />
            <SkeletonBar className="mt-2 h-3 w-[90%]" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-6 w-20" />
              <SkeletonBar className="h-2.5 w-16 self-center" />
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((__, avatar) => (
                  <Skeleton key={avatar} circle className="size-6" />
                ))}
              </div>
              <SkeletonBar className="h-2.5 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12', className)}>
      <SkeletonBar className="mb-8 h-2.5 w-44" />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <div className="min-w-0">
          <div className="border-b border-[var(--rule-strong)] pb-8">
            <Skeleton className="h-5 w-16" />
            <SkeletonBar className="mt-5 h-10 w-[min(560px,92%)]" />
            <SkeletonBar className="mt-3 h-10 w-[min(420px,70%)]" />
            <SkeletonBar className="mt-5 h-3 w-64" />
          </div>
          <div className="mt-8 space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBar
                key={index}
                className="h-3.5"
                width={index % 3 === 2 ? '72%' : '100%'}
              />
            ))}
            <Skeleton className="mt-6 h-44 w-full" />
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBar key={index} className="mt-3 h-3.5" width={index % 2 ? '88%' : '100%'} />
            ))}
          </div>
        </div>
        <aside className="space-y-5">
          <div className="border border-[var(--border)] p-4">
            <SkeletonBar className="h-2.5 w-20" />
            <SkeletonBar className="mt-4 h-4 w-[80%]" />
            <SkeletonBar className="mt-3 h-3 w-full" />
            <SkeletonBar className="mt-2 h-3 w-[70%]" />
          </div>
          <div className="border border-[var(--border)] p-4">
            <SkeletonBar className="h-2.5 w-16" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBar key={index} className="h-3" width={index % 2 ? '62%' : '82%'} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12', className)}>
      <SkeletonBar className="mb-8 h-2.5 w-32" />
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
        <div className="flex items-center gap-5">
          <Skeleton className="size-16" />
          <div>
            <SkeletonBar className="h-2.5 w-40" />
            <SkeletonBar className="mt-4 h-8 w-44" />
            <SkeletonBar className="mt-3 h-2.5 w-56" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="mt-8 flex gap-2 border-b border-[var(--border)] pb-px">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="mb-2 h-6 w-24" />
        ))}
      </div>
      <div className="mt-8 space-y-10">
        {Array.from({ length: 2 }).map((_, section) => (
          <section key={section}>
            <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
              <SkeletonBar className="h-2.5 w-6" />
              <SkeletonBar className="h-5 w-28" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((__, field) => (
                <div key={field}>
                  <SkeletonBar className="h-2.5 w-16" />
                  <SkeletonBar className="mt-2 h-4 w-[70%]" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AdminTableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('border border-[var(--rule-strong)]', className)} aria-hidden="true">
      <div
        className="hidden gap-4 border-b border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 sm:grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr)) 96px` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBar key={index} className="h-2.5 w-20" />
        ))}
        <SkeletonBar className="h-2.5 w-12 justify-self-end" />
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 sm:grid sm:items-center sm:gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr)) 96px` }}
        >
          {Array.from({ length: columns }).map((__, column) => (
            <div key={column} className="flex items-center gap-3">
              {column === 0 && <Skeleton circle className="size-8 shrink-0" />}
              <SkeletonBar className="h-3" width={column === 0 ? '60%' : '72%'} />
            </div>
          ))}
          <div className="flex gap-1.5 sm:justify-end">
            <Skeleton className="size-7" />
            <Skeleton className="size-7" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPageSkeleton({
  title = 'Admin workspace',
  rows = 6,
  columns = 5,
  className,
}: {
  title?: string;
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('', className)}>
      <div className="mb-7">
        <SkeletonBar className="h-2.5 w-36" />
        <SkeletonBar className="mt-3 h-8 w-48" />
        <SkeletonBar className="mt-3 h-3 w-[min(420px,80%)]" />
        <span className="sr-only">{title}</span>
      </div>
      <div className="mb-5 grid grid-cols-3 border border-[var(--rule-strong)]">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={cn('px-4 py-4 sm:px-5 sm:py-5', index < 2 && 'border-r border-[var(--border)]')}
          >
            <SkeletonBar className="h-2.5 w-20" />
            <SkeletonBar className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>
      <AdminTableSkeleton rows={rows} columns={columns} />
    </div>
  );
}

export function AdminAuthSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBar className="h-2.5 w-36" />
        <SkeletonBar className="mt-3 h-8 w-52" />
        <SkeletonBar className="mt-3 h-3 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border border-[var(--border)] bg-[var(--surface)] px-5 py-5"
          >
            <SkeletonBar className="h-2.5 w-20" />
            <SkeletonBar className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="border border-[var(--rule-strong)]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-4 last:border-b-0"
          >
            <SkeletonBar className="h-2.5 w-8" />
            <Skeleton className="size-8 shrink-0" />
            <SkeletonBar className="h-3 flex-1" />
            <SkeletonBar className="hidden h-3 w-24 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden h-screen w-[238px] shrink-0 flex-col border-r border-[var(--rule-strong)] bg-[var(--surface-hover)] lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-[var(--border)] px-[22px]">
          <Skeleton className="size-[30px]" />
          <div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-1.5 h-2 w-24" />
          </div>
        </div>
        <div className="flex-1 space-y-2 p-4">
          <Skeleton className="h-2 w-12" />
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-full" />
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4 sm:px-7">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-16" />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8">
          <AdminDashboardSkeleton />
        </main>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <SkeletonBar className="h-2.5 w-40" />
          <SkeletonBar className="mt-3 h-8 w-56" />
          <SkeletonBar className="mt-3 h-3 w-64" />
        </div>
        <SkeletonBar className="h-2.5 w-44" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="border border-[var(--border)] bg-[var(--surface)] px-4 py-5"
          >
            <SkeletonBar className="h-2.5 w-20" />
            <SkeletonBar className="mt-3 h-8 w-14" />
            <SkeletonBar className="mt-3 h-2.5 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="border border-[var(--rule-strong)]">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <SkeletonBar className="h-3 w-28" />
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-b border-[var(--border)] px-5 py-4 last:border-b-0">
              <SkeletonBar className="h-3 w-[70%]" />
              <SkeletonBar className="mt-2 h-2.5 w-40" />
            </div>
          ))}
        </div>
        <div className="border border-[var(--rule-strong)]">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <SkeletonBar className="h-3 w-20" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-b border-[var(--border)] px-5 py-4 last:border-b-0">
              <SkeletonBar className="h-3 w-[80%]" />
              <SkeletonBar className="mt-2 h-2.5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1360px]">
      <div className="grid grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:px-8 lg:py-14">
        <div>
          <SkeletonBar className="h-2.5 w-40" />
          <SkeletonBar className="mt-6 h-12 w-[min(520px,92%)]" />
          <SkeletonBar className="mt-4 h-12 w-[min(380px,70%)]" />
          <SkeletonBar className="mt-6 h-3 w-[min(460px,88%)]" />
          <SkeletonBar className="mt-2 h-3 w-[min(410px,78%)]" />
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="border border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <SkeletonBar className="h-2.5 w-24" />
            <SkeletonBar className="h-2.5 w-12" />
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[22px_minmax(0,1fr)_40px] items-start gap-3 border-b border-[var(--border)] px-4 py-[18px]"
            >
              <SkeletonBar className="h-2.5 w-4" />
              <div>
                <SkeletonBar className="h-2.5 w-16" />
                <SkeletonBar className="mt-2 h-3 w-[85%]" />
              </div>
              <SkeletonBar className="h-2.5 w-8" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.74fr)] lg:gap-16 lg:px-8 lg:py-14">
        {Array.from({ length: 2 }).map((_, column) => (
          <div key={column}>
            <SkeletonBar className="h-3 w-36" />
            <div className="mt-6 space-y-5">
              {Array.from({ length: 3 }).map((__, row) => (
                <div key={row}>
                  <SkeletonBar className="h-4 w-[78%]" />
                  <SkeletonBar className="mt-2 h-3 w-full" />
                  <SkeletonBar className="mt-2 h-2.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttendanceSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-3">
          <Skeleton circle className="size-8" />
          <div>
            <SkeletonBar className="h-3 w-28" />
            <SkeletonBar className="mt-2 h-6 w-20" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border border-[var(--border)] bg-[var(--surface)] p-4">
            <SkeletonBar className="h-2.5 w-20" />
            <SkeletonBar className="mt-3 h-7 w-14" />
          </div>
        ))}
      </div>
      <div className="border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-5 gap-3 border-b border-[var(--border)] px-4 py-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBar key={index} className="h-2.5 w-16" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid grid-cols-5 items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
            {Array.from({ length: 5 }).map((__, column) => (
              <SkeletonBar key={column} className="h-3" width={column === 0 ? '50%' : '70%'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NoticeRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-2 border-b border-[var(--border)] py-6 sm:grid-cols-[88px_minmax(0,1fr)_110px_18px] sm:items-start sm:px-3"
        >
          <SkeletonBar className="h-2.5 w-14" />
          <SkeletonBar className="h-2.5 w-16 sm:hidden" />
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <SkeletonBar className="h-5 w-[min(420px,86%)]" />
            <SkeletonBar className="mt-3 h-3 w-[min(560px,95%)]" />
            <SkeletonBar className="mt-2 h-3 w-[min(380px,70%)]" />
            <SkeletonBar className="mt-3 h-2.5 w-24" />
          </div>
          <SkeletonBar className="hidden h-2.5 w-16 sm:block" />
          <Skeleton className="hidden h-3 w-3 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ActivityRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-5 border-b border-[var(--border)] py-6 sm:grid-cols-[64px_minmax(0,1fr)_150px_18px] sm:items-start sm:px-3"
        >
          <Skeleton className="h-16 w-14" />
          <div className="min-w-0">
            <SkeletonBar className="h-2.5 w-28" />
            <SkeletonBar className="mt-3 h-5 w-[min(360px,80%)]" />
            <SkeletonBar className="mt-3 h-3 w-[min(520px,95%)]" />
            <SkeletonBar className="mt-2 h-3 w-[min(420px,75%)]" />
            <div className="mt-3 flex gap-5">
              <SkeletonBar className="h-2.5 w-24" />
              <SkeletonBar className="h-2.5 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 sm:justify-self-end" />
          <Skeleton className="hidden h-3 w-3 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ProjectCardsSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      aria-hidden="true"
      className="mt-8 grid grid-cols-1 border-l border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[280px] flex-col border-b border-r border-[var(--border)] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <SkeletonBar className="h-2.5 w-8" />
            <SkeletonBar className="h-2.5 w-16" />
          </div>
          <SkeletonBar className="mt-5 h-2.5 w-24" />
          <SkeletonBar className="mt-2 h-5 w-[min(220px,80%)]" />
          <SkeletonBar className="mt-3 h-3 w-full" />
          <SkeletonBar className="mt-2 h-3 w-[90%]" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-20" />
            <SkeletonBar className="h-2.5 w-16 self-center" />
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((__, avatar) => (
                <Skeleton key={avatar} circle className="size-6" />
              ))}
            </div>
            <SkeletonBar className="h-2.5 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton({
  rows = 3,
  className,
  children,
}: {
  rows?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className} aria-hidden="true">
      {children ?? (
        <div className="space-y-5">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index}>
              <SkeletonBar className="h-4" width={index % 2 ? '70%' : '84%'} />
              <SkeletonBar className="mt-2 h-3 w-full" />
              <SkeletonBar className="mt-2 h-2.5 w-24" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
