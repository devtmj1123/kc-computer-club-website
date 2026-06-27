'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
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
        setStep('form');
      } catch (err) {
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
      setError(passwordErrors.join('; '));
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
        body: JSON.stringify({
          token,
          newPassword,
        }),
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        {step === 'validating' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin mb-4">
                <span className="material-symbols-outlined text-primary text-5xl">
                  hourglass_bottom
                </span>
              </div>
              <p className="text-[var(--foreground)] text-center">验证重置链接中...</p>
            </div>
          </div>
        )}
        {step === 'form' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">
                  lock
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">重置密码</h1>
              <p className="text-[var(--text-secondary)] text-sm">
                为您的账户创建一个新的强密码
              </p>
            </div>
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}
            {userEmail && (
              <div className="mb-6 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                <p>重置账户: <span className="font-medium text-[var(--foreground)]">{userEmail}</span></p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  新密码
                </label>
                <div className="relative flex items-center bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors overflow-hidden">
                  <span className="absolute left-3 text-[var(--text-secondary)] material-symbols-outlined">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码"
                    required
                    className="flex-1 pl-10 pr-10 py-3 bg-transparent text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  确认密码
                </label>
                <div className="relative flex items-center bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors overflow-hidden">
                  <span className="absolute left-3 text-[var(--text-secondary)] material-symbols-outlined">
                    lock_check
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    required
                    className="flex-1 pl-10 pr-10 py-3 bg-transparent text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="mb-6 p-4 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary shrink-0 mt-1">
                    info
                  </span>
                  <div className="text-sm text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--foreground)] mb-2">密码需要满足:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>至少 6 个字符</li>
                      <li>包含大写字母 (A-Z)</li>
                      <li>包含小写字母 (a-z)</li>
                      <li>包含数字 (0-9)</li>
                      <li>包含特殊字符 (!@#$%^&*)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-[#102219] font-bold rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">hourglass_bottom</span>
                    重置中...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">lock_reset</span>
                    重置密码
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-[var(--text-secondary)] text-sm">
                想起密码了?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-[var(--primary-hover)] font-medium transition-colors"
                >
                  返回登录
                </Link>
              </p>
            </div>
          </div>
        )}
        {step === 'success' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <span className="material-symbols-outlined text-primary text-5xl">
                  check_circle
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                密码重置成功
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                您的密码已成功更新。现在可以使用新密码登录了。
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary text-[#102219] font-bold rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <span className="material-symbols-outlined">login</span>
                返回登录
              </Link>
            </div>
          </div>
        )}
        {step === 'error' && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
                <span className="material-symbols-outlined text-red-500 text-5xl">
                  error
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                链接无效或已过期
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                {error || '重置密码链接已过期（有效期：24小时）。请重新申请。'}
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary text-[#102219] font-bold rounded-lg hover:bg-[var(--primary-hover)] transition-colors mb-3"
              >
                <span className="material-symbols-outlined">mail</span>
                重新申请重置
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[var(--surface-hover)] text-[var(--foreground)] font-bold border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover-dark)] transition-colors"
              >
                <span className="material-symbols-outlined">login</span>
                返回登录
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin mb-4">
              <span className="material-symbols-outlined text-primary text-5xl">
                hourglass_bottom
              </span>
            </div>
            <p className="text-[var(--foreground)] text-center">加载中...</p>
          </div>
        </div>
      </div>
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