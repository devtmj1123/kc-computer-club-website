'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Loading } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading, changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (newPassword.length < 8) {
      setError('新密码至少需要 8 个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }
    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      return;
    }
    if (user && 'studentId' in user && user.studentId && newPassword === user.studentId) {
      setError('新密码不能与学号相同');
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <main className="flex items-center justify-center px-4 py-32">
          <Loading size="lg" text="加载中…" />
        </main>
      </StudentLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <section className="min-w-0">
            <div className="eyebrow">ACCOUNT SECURITY · 修改密码</div>
            <h1 className="mt-5 font-display text-[clamp(2.3rem,5.5vw,3.8rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              更新密码。
            </h1>
            <p className="mt-5 max-w-md text-[13px] leading-[1.95] text-[var(--text-secondary)]">
              定期更新密码可以保护账户安全。新密码至少 8 个字符，不能与旧密码或学号相同。
            </p>

            <dl className="mt-10 border-t border-[var(--rule-strong)]">
              {[
                { no: '01', label: '当前密码', value: '用于验证你的身份' },
                { no: '02', label: '新密码', value: '至少 8 个字符，建议混合字母与数字' },
                { no: '03', label: '确认密码', value: '再次输入新密码以确认' },
              ].map((item) => (
                <div
                  key={item.no}
                  className="grid grid-cols-[36px_86px_minmax(0,1fr)] items-baseline gap-3 border-b border-[var(--border)] py-4"
                >
                  <dt className="font-mono text-[12px] text-[var(--primary)]">{item.no}</dt>
                  <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    {item.label}
                  </dt>
                  <dd className="text-[12px] leading-relaxed text-[var(--foreground)]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="lg:pt-2">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>SECURITY / 安全</span>
                <span className="text-[var(--primary)]">PASSWORD</span>
              </div>

              <div className="p-5 sm:p-6">
                {error && (
                  <div className="mb-5 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
                    <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
                      error
                    </span>
                    <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
                  </div>
                )}

                {success ? (
                  <div>
                    <span className="inline-flex size-10 items-center justify-center border border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </span>
                    <h2 className="mt-4 font-display text-[26px] font-bold tracking-[-0.03em] text-[var(--foreground)]">
                      密码修改成功。
                    </h2>
                    <p className="mt-3 text-[12px] leading-[1.9] text-[var(--text-secondary)]">
                      正在返回首页，请稍候…
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                      label="当前密码"
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="输入当前密码"
                      required
                      disabled={isSubmitting}
                      leftIcon="lock"
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                          aria-label={showOldPassword ? '隐藏密码' : '显示密码'}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {showOldPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      }
                    />

                    <Input
                      label="新密码"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="输入新密码（至少 8 个字符）"
                      required
                      disabled={isSubmitting}
                      hint="至少需要 8 个字符，包括字母和数字"
                      leftIcon="lock_open"
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                          aria-label={showNewPassword ? '隐藏密码' : '显示密码'}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {showNewPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      }
                    />

                    <Input
                      label="确认新密码"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="重新输入新密码"
                      required
                      disabled={isSubmitting}
                      leftIcon="check_circle"
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

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[15px]">
                            hourglass_empty
                          </span>
                          修改中…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px]">done</span>
                          确认修改
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="border-t border-[var(--border)] px-5 py-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  返回首页
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </StudentLayout>
  );
}
