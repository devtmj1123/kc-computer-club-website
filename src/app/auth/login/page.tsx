'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Loading } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login, user, isLoading, requirePasswordChange, changePassword, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user && requirePasswordChange) {
      setShowChangePasswordModal(true);
      setCurrentPasswordForChange(password);
    }
  }, [user, requirePasswordChange, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^\d{5,6}@kuencheng\.edu\.my$/;
    if (!emailRegex.test(email)) {
      setError(
        '邮箱格式错误。请使用格式：5-6位数字@kuencheng.edu.my（例如：12345@kuencheng.edu.my）'
      );
      return;
    }
    setIsFormLoading(true);
    try {
      const result = await login(email, password);
      if (result.requirePasswordChange) {
        setShowChangePasswordModal(true);
        setCurrentPasswordForChange(password);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    if (newPassword.length < 6) {
      setChangePasswordError('新密码至少需要 6 个字符');
      return;
    }
    if (newPassword === '11111111') {
      setChangePasswordError('新密码不能为默认密码');
      return;
    }
    const studentId = email.replace(/@kuencheng\.edu\.my$/, '');
    if (newPassword === studentId) {
      setChangePasswordError('新密码不能与学号相同');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('两次输入的密码不一致');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPasswordForChange, newPassword);
      setShowChangePasswordModal(false);
      router.push('/');
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : '修改密码失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <main className="flex items-center justify-center px-4 py-32">
          <Loading size="lg" text="正在检查登录状态…" />
        </main>
      </StudentLayout>
    );
  }

  if (user && !requirePasswordChange) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[720px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">SIGNED IN · 已登录</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            你已经登录。
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            当前身份为 <span className="font-semibold text-[var(--foreground)]">{user.name}</span>
            ，可以直接进入社团首页或退出账号。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="btn btn-primary">
              <span className="material-symbols-outlined text-[16px]">home</span>
              进入首页
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              className="inline-flex min-h-[42px] items-center gap-2 border border-[var(--rule-strong)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              退出登录
            </button>
          </div>
        </main>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <section className="min-w-0">
            <div className="eyebrow">MEMBER ACCESS · 团员登录</div>
            <h1 className="mt-5 font-display text-[clamp(2.3rem,5.5vw,3.8rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              回到社团。
            </h1>
            <p className="mt-5 max-w-md text-[13px] leading-[1.95] text-[var(--text-secondary)]">
              团员登录后可浏览社团公告、活动与项目，并完成活动报名、项目提交与签到。
            </p>

            <dl className="mt-10 border-t border-[var(--rule-strong)]">
              {[
                { no: '01', label: '账号', value: '学号 @kuencheng.edu.my' },
                { no: '02', label: '默认密码', value: '首次登录后需立即修改' },
                { no: '03', label: '账号问题', value: '联系社团管理员重置' },
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
                <span>LOGIN / 登录</span>
                <span className="text-[var(--primary)]">STUDENT</span>
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="student-email"
                      className="text-[13px] font-medium tracking-[0.01em] text-[var(--text-secondary)]"
                    >
                      学号邮箱 <span className="text-[var(--error)]">*</span>
                    </label>
                    <div className="flex overflow-hidden border border-[var(--input-border)] bg-[var(--input-bg)] transition-colors focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-light)]">
                      <input
                        id="student-email"
                        type="text"
                        inputMode="numeric"
                        value={email.replace(/@kuencheng\.edu\.my$/, '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                          setEmail(val ? `${val}@kuencheng.edu.my` : '');
                        }}
                        placeholder="123456"
                        required
                        maxLength={6}
                        className="h-12 min-w-0 flex-1 bg-transparent px-3.5 text-[15px] font-medium tracking-[0.04em] text-[var(--foreground)] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--input-placeholder)]"
                      />
                      <span className="flex shrink-0 items-center border-l border-[var(--border)] bg-[var(--surface-hover)] px-3 text-[14px] font-medium text-[var(--text-secondary)]">
                        @kuencheng.edu.my
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      输入 5-6 位学号数字
                    </p>
                  </div>

                  <Input
                    label="密码"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    required
                    disabled={isFormLoading}
                    leftIcon="lock"
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

                  <button
                    type="submit"
                    disabled={isFormLoading}
                    className="btn btn-primary h-11 w-full"
                  >
                    {isFormLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[15px]">
                          hourglass_empty
                        </span>
                        登录中…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        登录
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <Link
                    href="/auth/forgot-password"
                    className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
                  >
                    忘记密码？
                  </Link>
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
                  >
                    <span className="material-symbols-outlined text-[13px]">security</span>
                    管理员登录
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              返回主站
            </Link>
          </section>
        </div>
      </main>

      {showChangePasswordModal && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md border border-[var(--rule-strong)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              <span>SECURITY / 账户安全</span>
              <span className="text-[var(--warning)]">ACTION REQUIRED</span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="eyebrow">FIRST LOGIN · 首次登录</div>
              <h2 className="mt-4 font-display text-[26px] font-bold tracking-[-0.03em] text-[var(--foreground)]">
                设置新密码。
              </h2>
              <p className="mt-2 text-[12px] leading-[1.9] text-[var(--text-secondary)]">
                为了账户安全，请先修改默认密码，再继续使用社团网站。
              </p>

              {changePasswordError && (
                <div className="mt-5 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
                    error
                  </span>
                  <p className="text-[12px] leading-relaxed text-[var(--error)]">
                    {changePasswordError}
                  </p>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                <Input
                  label="新密码"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 6 个字符"
                  required
                  minLength={6}
                  disabled={isChangingPassword}
                  leftIcon="lock"
                />
                <Input
                  label="确认新密码"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  required
                  disabled={isChangingPassword}
                  leftIcon="lock_check"
                />

                <p className="font-mono text-[12px] leading-relaxed tracking-[0.02em] text-[var(--text-tertiary)]">
                  新密码不能与学号或默认密码相同。
                </p>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn btn-primary h-11 w-full"
                >
                  {isChangingPassword ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[15px]">
                        hourglass_empty
                      </span>
                      修改中…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      确认修改
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
