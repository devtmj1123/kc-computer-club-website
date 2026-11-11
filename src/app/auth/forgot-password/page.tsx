'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'success'>('email');
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
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <section className="min-w-0">
            <div className="eyebrow">ACCOUNT RECOVERY · 找回密码</div>
            <h1 className="mt-5 font-display text-[clamp(2.3rem,5.5vw,3.8rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              忘记密码？
            </h1>
            <p className="mt-5 max-w-md text-[13px] leading-[1.95] text-[var(--text-secondary)]">
              输入你的学号邮箱。系统会尝试发送重置邮件；若邮件服务未配置，请联系社团管理员协助重置。
            </p>

            <dl className="mt-10 border-t border-[var(--rule-strong)]">
              {[
                { no: '01', label: '输入邮箱', value: '使用 5-6 位学号 @kuencheng.edu.my' },
                { no: '02', label: '查收邮件', value: '按照邮件中的链接重置密码' },
                { no: '03', label: '无法收信', value: '到电脑室联系管理员重置' },
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
                <span>RESET / 重置</span>
                <span className="text-[var(--primary)]">
                  {step === 'email' ? 'STEP 01' : 'DONE'}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                {step === 'email' ? (
                  <>
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
                          htmlFor="reset-email"
                          className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                        >
                          学号邮箱 <span className="text-[var(--error)]">*</span>
                        </label>
                        <div className="flex overflow-hidden rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] transition-colors focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-light)]">
                          <input
                            id="reset-email"
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
                            className="h-11 min-w-0 flex-1 bg-transparent px-3.5 text-[13px] text-[var(--foreground)] outline-none placeholder:text-[var(--input-placeholder)]"
                          />
                          <span className="flex shrink-0 items-center border-l border-[var(--border)] bg-[var(--surface-hover)] px-3 font-mono text-[12px] tracking-[0.02em] text-[var(--text-tertiary)]">
                            @kuencheng.edu.my
                          </span>
                        </div>
                      </div>

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
                            发送中…
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            发送重置邮件
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-5 border-t border-[var(--border)] pt-4">
                      <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-[var(--text-tertiary)]">
                        若未收到邮件，请到电脑室联系管理员，并提供你的学号。
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="inline-flex size-10 items-center justify-center border border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]">
                      <span className="material-symbols-outlined text-[20px]">
                        mark_email_read
                      </span>
                    </span>
                    <h2 className="mt-4 font-display text-[26px] font-bold tracking-[-0.03em] text-[var(--foreground)]">
                      请求已提交。
                    </h2>
                    <p className="mt-3 text-[12px] leading-[1.9] text-[var(--text-secondary)]">
                      重置说明已发送至{' '}
                      <span className="font-semibold text-[var(--foreground)]">{email}</span>
                      。若未收到邮件，请到电脑室联系管理员，提供学号以重置密码。
                    </p>

                    <Link
                      href="/auth/login"
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                    >
                      <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                      返回登录
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] px-5 py-3">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  返回登录
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </StudentLayout>
  );
}
