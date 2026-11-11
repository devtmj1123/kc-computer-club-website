'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Admin {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}

export default function EditAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adminId = params?.id as string;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [username, setUsername] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  const loadAdmin = useCallback(async () => {
    try {
      setIsLoadingAdmin(true);
      const response = await fetch('/api/admin/manage');
      const data = await response.json();
      if (data.success) {
        const foundAdmin = data.admins.find((a: Admin) => a.id === adminId);
        if (foundAdmin) {
          setAdmin(foundAdmin);
          setUsername(foundAdmin.username);
          setIsActive(foundAdmin.isActive);
        } else {
          setError('管理员不存在');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingAdmin(false);
    }
  }, [adminId]);

  useEffect(() => {
    if (adminId && user && 'role' in user && user.role === 'admin') {
      loadAdmin();
    }
  }, [adminId, user, loadAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          username,
          isActive,
          ...(newPassword && { newPassword }),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('管理员更新成功');
        setNewPassword('');
        setTimeout(() => router.push('/admin/manage'), 1500);
      } else {
        setError(data.error || '更新失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user || isLoadingAdmin) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="flex items-center gap-3 border border-[var(--rule-strong)] px-5 py-10">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Loading administrator
          </span>
        </div>
      </AdminLayout>
    );
  }

  if (!admin) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="max-w-2xl border border-[var(--error)]/40 px-6 py-12 text-center">
          <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--error)]">
            Record not found
          </div>
          <h1 className="mt-3 font-display text-[26px] font-bold text-[var(--foreground)]">
            管理员不存在
          </h1>
          <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
            {error || '无法找到该管理员账户。'}
          </p>
          <Link
            href="/admin/manage"
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-[3px] bg-[var(--primary)] px-4 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            返回管理员列表
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="max-w-2xl">
        <div className="mb-7">
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            <Link
              href="/admin/manage"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              管理员管理
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-[var(--foreground)]">编辑管理员</span>
          </div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            编辑管理员
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            修改管理员账户状态、用户名或重置登录密码。
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[17px] text-[var(--error)]">
              error
            </span>
            <p className="text-[12px] text-[var(--error)]">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[17px] text-[var(--primary)]">
              check_circle
            </span>
            <p className="text-[12px] text-[var(--primary)]">{success}，正在跳转…</p>
          </div>
        )}

        <section className="border border-[var(--rule-strong)]">
          <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">
              账户设置
            </h2>
            <span className="mono-label">Admin account</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <Input
              label="管理员用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              leftIcon="person"
              required
              disabled={isSubmitting}
            />

            <div>
              <div className="mb-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                账户状态
              </div>
              <div className="flex gap-2">
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-[3px] border px-3 py-2 text-[12px] font-semibold transition-colors ${
                    isActive
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--rule-strong)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="admin-status"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <span
                    className={`size-1.5 ${
                      isActive ? 'bg-[var(--primary)]' : 'bg-[var(--text-tertiary)]'
                    }`}
                  />
                  激活
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-[3px] border px-3 py-2 text-[12px] font-semibold transition-colors ${
                    !isActive
                      ? 'border-[var(--error)] bg-[var(--error-light)] text-[var(--error)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--rule-strong)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="admin-status"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <span
                    className={`size-1.5 ${
                      !isActive ? 'bg-[var(--error)]' : 'bg-[var(--text-tertiary)]'
                    }`}
                  />
                  禁用
                </label>
              </div>
            </div>

            <Input
              label="新密码（可选）"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="留空则不修改密码"
              leftIcon="lock"
              disabled={isSubmitting}
              hint="若要修改密码，请输入至少 6 个字符"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              }
            />

            <div className="flex gap-2 border-t border-[var(--border)] pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                保存更改
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
