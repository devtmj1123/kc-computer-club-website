'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CreateAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    if (username.length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (!password) {
      setError('密码不能为空');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('密码不匹配');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('管理员创建成功');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => router.push('/admin/manage'), 1500);
      } else {
        setError(data.error || '创建失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="flex items-center gap-3 border border-[var(--rule-strong)] px-5 py-10">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Loading editor
          </span>
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
            <span className="text-[var(--foreground)]">添加管理员</span>
          </div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            添加新管理员
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            创建新的后台管理员账户，并设置初始登录凭据。
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
              账户凭据
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
              hint="3–20 个字符"
            />

            <Input
              label="密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              leftIcon="lock"
              required
              disabled={isSubmitting}
              hint="至少 6 个字符"
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

            <Input
              label="确认密码"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="重新输入密码"
              leftIcon="check_circle"
              required
              disabled={isSubmitting}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                  aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
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
                创建管理员
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
