'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ClubMark } from '@/components/ui/ClubMark';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AdminForgotPasswordPage() {
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('请输入管理员用户名或 recovery email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/admin-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '发送重置邮件失败');
      }
      setStep('sent');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '发送失败，请稍后重试'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-[var(--rule-strong)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <ClubMark size={30} />
            <span className="flex flex-col gap-1">
              <span className="font-display text-[14px] font-bold leading-none text-[var(--foreground)]">
                电脑学会
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

      <main className="mx-auto flex w-full max-w-[480px] flex-col justify-center px-4 py-12 sm:py-20">
        <div className="border border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-6 py-5">
            <div className="mono-label">Admin recovery · 管理员找回密码</div>
            <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
              {step === 'form' ? '找回管理员密码' : '请求已提交'}
            </h1>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {step === 'form'
                ? '输入管理员用户名，或管理员资料中登记的 recovery email。重置链接将发送到该 recovery email。'
                : '如果该管理员账户存在并已设置 recovery email，重置邮件会发送到登记的邮箱。'}
            </p>
          </div>

          <div className="px-6 py-6">
            {step === 'form' ? (
              <>
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
                    label="管理员用户名或 recovery email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="例如 admin 或 name@example.com"
                    leftIcon="alternate_email"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    hint="管理员登录邮箱是内部地址，无法收信，因此必须使用 recovery email。"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    发送重置邮件
                  </Button>
                </form>

                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-[var(--text-tertiary)]">
                    尚未设置 recovery email？
                    <br />
                    请联系另一位管理员，在「管理员管理」中补充，或直接重置密码。
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
                <p className="mt-4 text-[12px] leading-[1.9] text-[var(--text-secondary)]">
                  请检查{' '}
                  <span className="font-semibold text-[var(--foreground)]">
                    {identifier}
                  </span>{' '}
                  对应的 recovery email，包括垃圾邮件文件夹。重置链接有效期为 24 小时。
                </p>

                <Link
                  href="/admin/login"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    arrow_back
                  </span>
                  返回管理员登录
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
          >
            <span className="material-symbols-outlined text-[15px]">
              arrow_back
            </span>
            返回管理员登录
          </Link>
          <Link
            href="/auth/forgot-password"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
          >
            团员找回密码
          </Link>
        </div>
      </main>
    </div>
  );
}
