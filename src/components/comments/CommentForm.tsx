'use client';

import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '@/contexts/AuthContext';

interface CommentFormProps {
  contentType: 'notice' | 'activity';
  contentId: string;
  onCommentSubmitted: () => void;
}

export function CommentForm({ contentType, contentId, onCommentSubmitted }: CommentFormProps) {
  const { user } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setErrorMessage('请输入评论内容');
      return;
    }

    const nickname = user ? user.name : guestName.trim();
    const email = user ? user.email : guestEmail.trim();

    if (!nickname) {
      setErrorMessage('请输入您的名字');
      return;
    }
    if (!email) {
      setErrorMessage('请输入您的邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('请输入有效的邮箱地址');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let recaptchaToken: string | undefined;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('comment');
        } catch (captchaError) {
          console.error('人机验证初始化失败:', captchaError);
        }
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          nickname,
          email,
          content: content.trim(),
          recaptchaToken,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('评论已提交，审核通过后会显示');
        setContent('');
        setGuestName('');
        setGuestEmail('');
        setTimeout(() => {
          onCommentSubmitted();
        }, 800);
      } else {
        setErrorMessage('提交失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      setErrorMessage('提交失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {user ? (
        <div className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface-hover)] px-3.5 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center bg-[var(--primary)] font-mono text-[12px] text-[var(--primary-contrast)]">
            {user.name?.charAt(0) || '?'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
              {user.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-[12px] tracking-[0.02em] text-[var(--text-tertiary)]">
              {user.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guestName"
              className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
            >
              昵称 <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="guestName"
              type="text"
              placeholder="输入显示昵称"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-10 w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[13px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guestEmail"
              className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
            >
              邮箱 <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="guestEmail"
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-10 w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[13px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
            />
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 border border-[var(--primary)]/30 bg-[var(--primary-light)] px-3.5 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-[15px] text-[var(--primary)]">
            check_circle
          </span>
          <p className="text-[12px] leading-relaxed text-[var(--primary)]">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 border border-[var(--error)]/30 bg-[var(--error-light)] px-3.5 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-[15px] text-[var(--error)]">
            error
          </span>
          <p className="text-[12px] leading-relaxed text-[var(--error)]">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="content"
          className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
        >
          评论内容 <span className="text-[var(--error)]">*</span>
        </label>
        <textarea
          id="content"
          placeholder="分享你的看法或提问…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[12px] uppercase leading-relaxed tracking-[0.06em] text-[var(--text-tertiary)]">
          {user ? '登录身份评论 · 先审后发' : '匿名评论 · 人机验证 · 先审后发'}
        </p>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[15px]">
                hourglass_empty
              </span>
              提交中…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[15px]">send</span>
              提交评论
            </>
          )}
        </button>
      </div>
    </form>
  );
}
