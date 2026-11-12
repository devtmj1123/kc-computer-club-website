'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { useClub } from '@/contexts/ClubContext';
import { ClubMark } from '@/components/ui/ClubMark';
import { Loading } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const PASSWORD_RULES = [
  '至少 6 个字符',
  '包含大写字母 (A-Z)',
  '包含小写字母 (a-z)',
  '包含数字 (0-9)',
  '包含特殊字符 (!@#$%^&*)',
];

function RecoveryLayout({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const { clubInfo } = useClub();
  const clubName = clubInfo.aboutTitle || clubInfo.clubName;

  if (!isAdmin) {
    return <StudentLayout>{children}</StudentLayout>;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-[var(--rule-strong)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <ClubMark size={30} src={clubInfo.logoUrl} alt={clubName} />
            <span className="flex flex-col gap-1">
              <span className="font-display text-[14px] font-bold leading-none text-[var(--foreground)]">
                {clubName}
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--text-tertiary)]">
                ADMIN RECOVERY
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            >
              管理员登录
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function AuthShell({
  stepLabel,
  stepValue,
  isAdmin,
  children,
}: {
  stepLabel: string;
  stepValue: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <RecoveryLayout isAdmin={isAdmin}>
      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <section className="min-w-0">
            <div className="eyebrow">
              {isAdmin
                ? 'ADMIN RECOVERY · 管理员重置密码'
                : 'ACCOUNT RECOVERY · 重置密码'}
            </div>
            <h1 className="mt-5 font-display text-[clamp(2.3rem,5.5vw,3.8rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              设置新密码。
            </h1>
            <p className="mt-5 max-w-md text-[13px] leading-[1.95] text-[var(--text-secondary)]">
              重置链接有效期 24 小时。新密码必须满足安全要求，完成后即可使用新密码
              {isAdmin ? '登录管理后台' : '登录'}。
            </p>

            <div className="mt-10 border-t border-[var(--rule-strong)]">
              <div className="border-b border-[var(--border)] py-4">
                <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  PASSWORD REQUIREMENTS / 密码要求
                </p>
                <ul className="mt-3 space-y-2">
                  {PASSWORD_RULES.map((rule) => (
                    <li key={rule} className="flex items-start gap-2.5">
                      <span className="mt-[9px] block size-1 shrink-0 bg-[var(--primary)]" />
                      <span className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                        {rule}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="lg:pt-2">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>{stepLabel}</span>
                <span className="text-[var(--primary)]">{stepValue}</span>
              </div>
              <div className="p-5 sm:p-6">{children}</div>
            </div>
          </section>
        </div>
      </main>
    </RecoveryLayout>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isAdmin, setIsAdmin] = useState(
    searchParams.get('type') === 'admin'
  );
  const [step, setStep] = useState<'validating' | 'form' | 'success' | 'error'>('validating');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('无效的重置链接');
        setStep('error');
        return;
      }
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || '重置链接已过期或无效');
          setStep('error');
          return;
        }
        setUserEmail(data.email || '');
        setIsAdmin(data.type === 'admin');
        setStep('form');
      } catch {
        setError('验证失败，请检查链接');
        setStep('error');
      }
    };
    validateToken();
  }, [token]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) {
      errors.push('密码至少需要 6 个字符');
    }
    if (password === '11111111') {
      errors.push('密码不能为默认密码');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('密码需要包含小写字母');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('密码需要包含大写字母');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('密码需要包含数字');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('密码需要包含特殊字符 (!@#$%^&*)');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('；'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '密码重置失败');
      }
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置密码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'validating') {
    return (
      <RecoveryLayout isAdmin={isAdmin}>
        <main className="flex items-center justify-center px-4 py-32">
          <Loading size="lg" text="正在验证重置链接…" />
        </main>
      </RecoveryLayout>
    );
  }

  if (step === 'success') {
    return (
      <AuthShell
        stepLabel="RESET / 重置"
        stepValue="DONE"
        isAdmin={isAdmin}
      >
        <span className="inline-flex size-10 items-center justify-center border border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
        </span>
        <h2 className="mt-4 font-display text-[26px] font-bold tracking-[-0.03em] text-[var(--foreground)]">
          密码已重置。
        </h2>
        <p className="mt-3 text-[12px] leading-[1.9] text-[var(--text-secondary)]">
          {isAdmin
            ? '管理员密码已成功更新。现在可以使用新密码登录管理后台。'
            : '你的密码已成功更新。现在可以使用新密码登录社团网站。'}
        </p>
        <Link
          href={isAdmin ? '/admin/login' : '/auth/login'}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          <span className="material-symbols-outlined text-[15px]">login</span>
          {isAdmin ? '返回管理员登录' : '返回登录'}
        </Link>
      </AuthShell>
    );
  }

  if (step === 'error') {
    return (
      <AuthShell
        stepLabel="RESET / 重置"
        stepValue="INVALID"
        isAdmin={isAdmin}
      >
        <span className="inline-flex size-10 items-center justify-center border border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]">
          <span className="material-symbols-outlined text-[20px]">error</span>
        </span>
        <h2 className="mt-4 font-display text-[26px] font-bold tracking-[-0.03em] text-[var(--foreground)]">
          链接无效或已过期。
        </h2>
        <p className="mt-3 text-[12px] leading-[1.9] text-[var(--text-secondary)]">
          {error || '重置密码链接已过期（有效期：24 小时）。请重新申请。'}
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href={isAdmin ? '/admin/forgot-password' : '/auth/forgot-password'}
            className="inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[15px]">mail</span>
            重新申请重置
          </Link>
          <Link
            href={isAdmin ? '/admin/login' : '/auth/login'}
            className="inline-flex w-full items-center justify-center gap-2 border border-[var(--rule-strong)] px-4 py-3 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <span className="material-symbols-outlined text-[15px]">login</span>
            {isAdmin ? '返回管理员登录' : '返回登录'}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      stepLabel="RESET / 重置"
      stepValue="STEP 02"
      isAdmin={isAdmin}
    >
      {userEmail && (
        <div className="mb-5 border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            重置账户
          </p>
          <p className="mt-1 text-[12px] font-medium text-[var(--foreground)]">{userEmail}</p>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
          <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
            error
          </span>
          <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="新密码"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="输入新密码"
          required
          disabled={isLoading}
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

        <Input
          label="确认密码"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="再次输入密码"
          required
          disabled={isLoading}
          leftIcon="lock_check"
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
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[15px]">
                hourglass_empty
              </span>
              重置中…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[15px]">lock_reset</span>
              重置密码
            </>
          )}
        </button>
      </form>

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <Link
          href={isAdmin ? '/admin/login' : '/auth/login'}
          className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          {isAdmin ? '返回管理员登录' : '返回登录'}
        </Link>
      </div>
    </AuthShell>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-32">
      <Loading size="lg" text="加载中…" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
