'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

interface CommentFormProps {
  contentType: 'notice' | 'activity';
  contentId: string;
  onCommentSubmitted: () => void;
}

export function CommentForm({ contentType, contentId, onCommentSubmitted }: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!user) {
    return (
      <div className="border rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#13ec80]/10 mb-4">
          <span className="material-symbols-outlined text-[#13ec80] text-2xl">lock</span>
        </div>
        <p className="text-white font-semibold mb-2">需要登录才能评论</p>
        <p className="text-[#9db9ab] text-sm mb-4">请先登录账号，然后就可以分享您的看法</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#13ec80] px-6 py-2 text-black font-medium hover:bg-[#0fd673] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            登录
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#13ec80]/10 px-6 py-2 text-[#13ec80] font-medium hover:bg-[#13ec80]/20 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            注册
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setErrorMessage('请输入评论内容');
      return;
    }

    if (!user) {
      setErrorMessage('请先登录');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          nickname: user.name,
          email: user.email,
          content: content.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('评论已提交！');
        setContent('');
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3 pb-3">
        <div className="size-8 rounded-full bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
          <span className="material-symbols-outlined text-lg">person</span>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{user.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-[#13ec80]/10 rounded p-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#13ec80] text-lg">check_circle</span>
          <p className="text-[#13ec80] font-medium text-sm">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 rounded p-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-lg">error</span>
          <p className="text-red-400 font-medium text-sm">{errorMessage}</p>
        </div>
      )}

      <div>
        <label htmlFor="content" className="block text-[#9db9ab] text-sm font-medium mb-2">
          评论内容 <span className="text-red-400">*</span>
        </label>
        <textarea
          id="content"
          placeholder="分享你的看法或提问..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          className="w-full rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80]/50 transition-colors resize-none text-sm"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)', borderWidth: '1px' }}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || !content.trim()}
        className="w-full"
      >
        {isSubmitting ? '提交中...' : '提交评论'}
      </Button>
    </form>
  );
}
