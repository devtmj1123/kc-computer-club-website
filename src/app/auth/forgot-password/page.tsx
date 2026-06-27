'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'verification' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^\d{5,6}@kuencheng\.edu\.my$/;
    return emailRegex.test(emailValue);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('邮箱格式错误。请使用格式：5-6位数字@kuencheng.edu.my');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '发送重置邮件失败');
      }
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试');
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
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    lock_reset
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">忘记密码</h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  输入您的学号邮箱，我们将发送重置密码指引
                </p>
              </div>
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-lg shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    学号邮箱
                  </label>
                  <div className="relative flex items-center bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors overflow-hidden">
                    <span className="absolute left-3 text-[var(--text-secondary)] material-symbols-outlined">
                      mail
                    </span>
                    <input
                      type="text"
                      value={email.replace(/@kuencheng\.edu\.my$/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setEmail(val ? `${val}@kuencheng.edu.my` : '');
                      }}
                      placeholder="123456"
                      required
                      maxLength={6}
                      className="flex-1 pl-10 pr-1 py-3 bg-transparent text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none"
                    />
                    <span className="pl-1 pr-2 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap shrink-0 border-l border-[var(--border)]">
                      @kuencheng.edu.my
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-[#102219] font-bold rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors mt-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined">hourglass_bottom</span>
                      发送中...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      发送重置链接
                    </>
                  )}
                </button>
              </form>
              <div className="mb-6 p-4 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary shrink-0">info</span>
                  <div className="text-sm text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--foreground)] mb-1">重置密码流程</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>输入您的学号邮箱</li>
                      <li>联系管理员重置您的密码</li>
                      <li>使用新密码登录</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
          {step === 'success' && (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                  <span className="material-symbols-outlined text-primary text-5xl">
                    mark_email_read
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">请求已提交</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  您的重置密码请求已提交。请联系管理员获取新密码。
                </p>
                <div className="bg-[var(--surface-hover)] rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-[var(--foreground)] font-medium mb-2">
                    <span className="material-symbols-outlined text-primary align-middle mr-2">support_agent</span>
                    联系管理员
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    请到电脑室找管理员，提供您的学号以重置密码。
                  </p>
                </div>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary text-[#102219] font-bold rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  返回登录
                </Link>
              </div>
            </>
          )}
          {step === 'email' && (
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                返回登录
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}