'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function TakeAttendancePage() {
  const params = useParams();
  const sessionId = typeof params?.id === 'string' ? params.id : '';

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-7">
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            <Link
              href="/admin/attendance"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              点名管理
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-[var(--foreground)]">单场点名</span>
          </div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            单场点名
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            查看单场点名的成员状态与备注。
          </p>
        </div>

        <div className="border border-[var(--rule-strong)] px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center border border-[var(--border)] text-[var(--text-tertiary)]">
            <span className="material-symbols-outlined text-[24px]">event_busy</span>
          </div>
          <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Session not connected
          </div>
          <h2 className="mt-3 font-display text-[22px] font-bold text-[var(--foreground)]">
            尚未接入单场点名数据
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-[var(--text-secondary)]">
            当前后台的真实点名记录、验证码、状态调整与 CSV 导出均集中在点名管理页。本页仅为单场点名的入口预留。
          </p>
          {sessionId && (
            <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Session ref · {sessionId}
            </p>
          )}
          <Link
            href="/admin/attendance"
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-[3px] bg-[var(--primary)] px-4 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            前往点名管理
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
