'use client';

import { useState } from 'react';
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

    // If not logged in, require name and email
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('请输入有效的邮箱地址');
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
          nickname,
          email,
          content: content.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('评论已提交！');
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Show logged-in user info, or guest name/email fields */}
      {user ? (
        <div className="flex items-center gap-3 pb-3">
          <div className="size-8 rounded-full bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
            <span className="material-symbols-outlined text-lg">person</span>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{user.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="guestName" className="block text-[#9db9ab] text-sm font-medium mb-2">
              您的名字 <span className="text-red-400">*</span>
            </label>
            <input
              id="guestName"
              type="text"
              placeholder="输入您的名字"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80]/50 transition-colors text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)', borderWidth: '1px' }}
            />
          </div>
          <div>
            <label htmlFor="guestEmail" className="block text-[#9db9ab] text-sm font-medium mb-2">
              您的邮箱 <span className="text-red-400">*</span>
            </label>
            <input
              id="guestEmail"
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#13ec80]/50 transition-colors text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)', borderWidth: '1px' }}
            />
          </div>
        </div>
      )}

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

      {!user && (
        <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
          评论会经过审核后显示
        </p>
      )}
    </form>
  );
}
