'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ClubMark } from '@/components/ui/ClubMark';
import { Input } from '@/components/ui/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [adminUsername, setAdminUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await adminLogin(adminUsername, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-[38%] max-w-[520px] flex-col justify-between border-r border-[var(--rule-strong)] bg-[var(--surface-hover)] p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <ClubMark size={34} />
          <span className="flex flex-col gap-1">
            <span className="font-display text-[15px] font-bold leading-none text-[var(--foreground)]">
              电脑学会
            </span>
            <span className="font-mono text-[10px] leading-none tracking-[0.16em] text-[var(--text-tertiary)]">
              ADMIN CONSOLE
            </span>
          </span>
        </div>

        <div>
          <div className="eyebrow">Kuen Cheng Computer Club</div>
          <p className="mt-6 font-display text-[38px] font-bold leading-[1.25] tracking-[-0.03em] text-[var(--foreground)]">
            管理内容，
            <br />
            也管理秩序。
          </p>
          <div className="mt-6 h-px w-12 bg-[var(--primary)]" />
          <p className="mt-5 max-w-xs text-[12px] leading-relaxed text-[var(--text-secondary)]">
            公告、活动、学生名册与考勤记录，都从这个入口进入。
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          Authorized personnel only
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <ClubMark size={30} />
            <span className="flex flex-col gap-1">
              <span className="font-display text-[14px] font-bold leading-none text-[var(--foreground)]">
                电脑学会
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--text-tertiary)]">
                ADMIN CONSOLE
              </span>
            </span>
          </div>

          <div className="border border-[var(--rule-strong)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-6 py-5">
              <div className="mono-label">Admin access · 管理员入口</div>
              <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                管理员登录
              </h1>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                电脑学会官网管理后台，请使用管理员账户继续。
              </p>
            </div>

            <div className="px-6 py-6">
              {error && (
                <div className="mb-5 flex items-start gap-2 border border-[var(--error)]/40 bg-[var(--error-light)] px-3.5 py-2.5">
                  <span className="material-symbols-outlined text-[15px] text-[var(--error)]">
                    error
                  </span>
                  <p className="text-[12px] text-[var(--error)]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="管理员用户名"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="请输入用户名"
                  leftIcon="person"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />

                <Input
                  label="密码"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon="lock"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="mt-2 w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  登录
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  或
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <Link
                href="/auth/login"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[3px] border border-[var(--border)] bg-[var(--surface)] text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--rule-strong)] hover:bg-[var(--surface-hover)]"
              >
                <span className="material-symbols-outlined text-[16px] text-[var(--text-tertiary)]">
                  school
                </span>
                团员登录
              </Link>

              <p className="mt-3 text-center font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                非管理员用户请使用团员账号登录
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              返回主站
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              KC · Admin
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
