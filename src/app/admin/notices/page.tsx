'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { useAuth } from '@/contexts/AuthContext';
import { Notice } from '@/services/notice.service';
import { AdminPageSkeleton, AdminTableSkeleton } from '@/components/ui/PageSkeletons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
];

function noticeKey(notice: Notice): string {
  const fallback = notice as Notice & { id?: string };
  return notice.$id || fallback.id || '';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function statusBadgeClass(status: Notice['status']): string {
  return status === 'published'
    ? 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]'
    : 'border-[var(--warning)]/40 bg-[var(--warning-light)] text-[var(--warning)]';
}

export default function AdminNoticesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadNotices();
    }
  }, [user]);

  const loadNotices = async () => {
    try {
      setIsLoadingNotices(true);
      setError('');
      const response = await fetch('/api/notices');
      const data = await response.json();
      if (data.success) {
        setNotices(Array.isArray(data.notices) ? data.notices : []);
      } else {
        setError(data.error || '加载公告列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingNotices(false);
    }
  };

  const handleDelete = async (noticeId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setNotices((prev) => prev.filter((notice) => noticeKey(notice) !== noticeId));
        setDeleteId(null);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotices = notices
    .filter((notice) => {
      const keyword = searchTerm.toLowerCase();
      const matchSearch =
        notice.title.toLowerCase().includes(keyword) ||
        notice.category.toLowerCase().includes(keyword);
      const matchStatus = selectedStatus === 'all' || notice.status === selectedStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const publishedCount = notices.filter((notice) => notice.status === 'published').length;
  const draftCount = notices.filter((notice) => notice.status === 'draft').length;

  if (isLoading || !user) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <AdminPageSkeleton title="Loading notices" rows={6} columns={5} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
            Content · Notices
          </p>
          <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            公告管理
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            管理社团的所有公告信息，置顶内容优先显示。
          </p>
        </div>
        <Link
          href="/admin/notices/create"
          className="inline-flex w-fit items-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          <span className="text-[14px] leading-none">+</span>
          新建公告
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-px border border-[var(--rule-strong)] bg-[var(--border)] sm:grid-cols-3">
        {[
          { label: '公告总数', note: 'TOTAL', value: notices.length },
          { label: '已发布', note: 'PUBLISHED', value: publishedCount },
          { label: '草稿', note: 'DRAFTS', value: draftCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--surface)] px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {stat.label}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                {stat.note}
              </span>
            </div>
            <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {String(stat.value).padStart(2, '0')}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-5 flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center">
        <Input
          type="text"
          placeholder="搜索标题或分类…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon="search"
          containerClassName="flex-1"
        />
        <NeumorphicSelect
          options={statusOptions}
          value={selectedStatus}
          onChange={(value) =>
            setSelectedStatus(value as 'all' | 'draft' | 'published')
          }
          className="sm:w-44"
        />
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
          <span className="material-symbols-outlined text-[16px] text-[var(--error)]">error</span>
          <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
        </div>
      )}

      <section className="mt-5 border border-[var(--rule-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Notice index
          </h2>
          <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
            {String(filteredNotices.length).padStart(2, '0')} 条
          </span>
        </div>

        {isLoadingNotices ? (
          <AdminTableSkeleton rows={6} columns={5} className="border-0" />
        ) : filteredNotices.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span className="material-symbols-outlined text-[28px] text-[var(--text-tertiary)]">
              campaign
            </span>
            <p className="mt-3 font-display text-[16px] font-bold text-[var(--foreground)]">
              暂无公告
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {notices.length === 0 ? '发布第一条公告来填充这里。' : '没有符合当前筛选条件的公告。'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['标题', '分类', '作者', '状态', '创建时间', '操作'].map((label) => (
                    <th
                      key={label}
                      className={`px-5 py-3 font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)] ${
                        label === '操作' ? 'text-right' : ''
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((notice) => {
                  const id = noticeKey(notice);
                  return (
                    <tr
                      key={id}
                      className="border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--primary-light)]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {notice.pinned && (
                            <span
                              className="material-symbols-outlined text-[15px] text-[var(--warning)]"
                              title="已置顶"
                            >
                              push_pin
                            </span>
                          )}
                          <span className="max-w-[320px] truncate text-[12px] font-semibold text-[var(--foreground)]">
                            {notice.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-secondary)]">
                          {notice.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-[var(--text-secondary)]">
                        {notice.author}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${statusBadgeClass(notice.status)}`}
                        >
                          {notice.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                        {formatDate(notice.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/notices/${id}/edit`}
                            className="border border-[var(--border)] px-2.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          >
                            编辑
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteId(id)}
                            className="border border-[var(--border)] px-2.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteId && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          onClick={() => !isDeleting && setDeleteId(null)}
        >
          <div
            className="animate-scale-in w-full max-w-sm border border-[var(--rule-strong)] bg-[var(--surface)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] px-5 py-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--error)]">
                Delete / Notice
              </p>
            </div>
            <div className="px-5 py-5">
              <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                确认删除
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                确定要删除这个公告吗？此操作无法撤销。
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  isLoading={isDeleting}
                  onClick={() => deleteId && handleDelete(deleteId)}
                >
                  确认删除
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
