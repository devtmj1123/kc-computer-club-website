'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface Admin {
  id: string;
  username: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function AdminManagePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadAdmins();
    }
  }, [user]);

  const loadAdmins = async () => {
    try {
      setIsLoadingAdmins(true);
      setError('');
      const response = await fetch('/api/admin/manage');
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
      } else {
        setError(data.error || '加载管理员列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/manage?id=${adminId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(admins.filter((a) => a.id !== adminId));
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

  if (isLoading || !user) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="flex items-center gap-3 border border-[var(--rule-strong)] px-5 py-10">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Loading administrators
          </span>
        </div>
      </AdminLayout>
    );
  }

  const activeCount = admins.filter((admin) => admin.isActive).length;
  const disabledCount = admins.length - activeCount;

  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow">Administration · 账户权限</div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            管理员管理
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            管理后台管理员账户、启用状态与登录凭据。
          </p>
        </div>
        <Link
          href="/admin/manage/create"
          className="inline-flex h-9 w-fit items-center gap-2 rounded-[3px] bg-[var(--primary)] px-3.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          <span className="text-[14px] leading-none">+</span>
          添加管理员
        </Link>
      </div>

      <section className="mb-5 border border-[var(--rule-strong)]">
        <div className="grid grid-cols-3">
          {[
            { label: '管理员总数', note: 'TOTAL', value: admins.length },
            { label: '已激活', note: 'ACTIVE', value: activeCount },
            { label: '已禁用', note: 'DISABLED', value: disabledCount },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`px-4 py-4 sm:px-5 sm:py-5 ${
                index < 2 ? 'border-r border-[var(--border)]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="mono-label">{stat.label}</span>
                <span className="hidden font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] sm:block">
                  {stat.note}
                </span>
              </div>
              <div className="mt-3 font-display text-[26px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)]">
                {isLoadingAdmins ? '—' : stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="mb-5 flex items-start gap-3 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
          <span className="material-symbols-outlined text-[17px] text-[var(--error)]">
            error
          </span>
          <p className="flex-1 text-[12px] text-[var(--error)]">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            aria-label="关闭错误提示"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <section className="border border-[var(--rule-strong)]">
        {isLoadingAdmins ? (
          <div className="flex items-center gap-3 px-5 py-12">
            <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Loading records
            </span>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="admin_panel_settings"
              title="暂无管理员"
              description="创建第一位管理员账户以开始管理后台。"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  {['用户名', '状态', '创建时间', '最后登录'].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)]"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <tr
                    key={admin.id}
                    className="border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--primary-light)]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center border border-[var(--border)] font-mono text-[12px] uppercase text-[var(--text-secondary)]">
                          {admin.username.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-semibold text-[var(--foreground)]">
                            {admin.username}
                          </div>
                          <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                            Admin · {String(index + 1).padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex border px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.06em] ${
                          admin.isActive
                            ? 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]'
                            : 'border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]'
                        }`}
                      >
                        {admin.isActive ? '激活' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12px] text-[var(--text-secondary)]">
                      {new Date(admin.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12px] text-[var(--text-secondary)]">
                      {admin.lastLogin
                        ? new Date(admin.lastLogin).toLocaleDateString('zh-CN')
                        : '未登录'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/manage/${admin.id}/edit`}
                          className="border border-[var(--border)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          title="编辑"
                          aria-label={`编辑管理员 ${admin.username}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteId(admin.id)}
                          className="border border-[var(--border)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
                          title="删除"
                          aria-label={`删除管理员 ${admin.username}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[420px] border border-[var(--rule-strong)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--error)]">
                Danger zone
              </div>
              <h2 className="mt-1 font-display text-[20px] font-bold text-[var(--foreground)]">
                确认删除管理员
              </h2>
            </div>
            <p className="px-5 py-5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              确定要删除这个管理员吗？此操作无法撤销。
            </p>
            <div className="flex gap-2 border-t border-[var(--border)] px-5 py-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => deleteId && handleDelete(deleteId)}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
