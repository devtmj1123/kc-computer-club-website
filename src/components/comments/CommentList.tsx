'use client';

import { useState } from 'react';
import { Comment } from '@/services/comment.service';
import { useAuth } from '@/contexts/AuthContext';

interface CommentListProps {
  comments: Comment[];
  contentType: 'notice' | 'activity';
  contentId: string;
  onCommentDeleted?: () => void;
  onReplySubmitted?: () => void;
}

function formatCommentTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CommentList({
  comments,
  onCommentDeleted,
  onReplySubmitted,
}: CommentListProps) {
  const { isAdmin } = useAuth();

  if (comments.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] px-4 py-8 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          暂无评论 · 来写下第一条
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)]">
      {comments.map((comment) => (
        <CommentItem
          key={comment.$id}
          comment={comment}
          isAdmin={isAdmin}
          onCommentDeleted={onCommentDeleted}
          onReplySubmitted={onReplySubmitted}
        />
      ))}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isAdmin: boolean;
  onCommentDeleted?: () => void;
  onReplySubmitted?: () => void;
}

function CommentItem({ comment, isAdmin, onCommentDeleted, onReplySubmitted }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.$id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onCommentDeleted?.();
      }
    } catch (error) {
      console.error('删除评论失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="border-b border-[var(--border)] py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--surface-hover)] font-mono text-[12px] text-[var(--text-secondary)]">
            {comment.nickname?.charAt(0) || '?'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
              {comment.nickname}
            </p>
            {comment.email && (
              <p className="mt-0.5 truncate font-mono text-[12px] tracking-[0.02em] text-[var(--text-tertiary)]">
                {comment.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <time className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
            {formatCommentTime(comment.createdAt)}
          </time>
          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--error)] disabled:opacity-50"
              title="删除评论"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap pl-[38px] text-[13px] leading-[1.9] text-[var(--text-secondary)]">
        {comment.content}
      </p>

      {comment.reply && (
        <div className="ml-[38px] mt-3 border-l-2 border-[var(--primary)] bg-[var(--primary-light)] px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--primary)]">
              <span className="material-symbols-outlined text-[13px]">reply</span>
              {comment.replyAuthor}
            </p>
            {comment.replyAt && (
              <time className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                {formatCommentTime(comment.replyAt)}
              </time>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-[1.85] text-[var(--text-secondary)]">
            {comment.reply}
          </p>
        </div>
      )}

      {isAdmin && !comment.reply && (
        <div className="mt-2 pl-[38px]">
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[13px]">reply</span>
            {showReplyForm ? '取消回复' : '回复'}
          </button>
        </div>
      )}

      {showReplyForm && isAdmin && (
        <div className="ml-[38px] mt-3">
          <AdminReplyForm
            commentId={comment.$id}
            onReplySubmitted={() => {
              setShowReplyForm(false);
              onReplySubmitted?.();
            }}
          />
        </div>
      )}
    </article>
  );
}

interface AdminReplyFormProps {
  commentId: string;
  onReplySubmitted: () => void;
}

function AdminReplyForm({ commentId, onReplySubmitted }: AdminReplyFormProps) {
  const { user } = useAuth();
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reply.trim()) {
      setErrorMessage('请输入回复内容');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: reply.trim(),
          replyAuthor: user?.name || '管理员',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setReply('');
        onReplySubmitted();
      } else {
        setErrorMessage('回复失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      setErrorMessage('回复失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 border border-[var(--border)] bg-[var(--surface-hover)] p-3"
    >
      {errorMessage && (
        <div className="flex items-center gap-2 border border-[var(--error)]/30 bg-[var(--error-light)] px-2.5 py-1.5">
          <span className="material-symbols-outlined text-[13px] text-[var(--error)]">error</span>
          <p className="text-[12px] text-[var(--error)]">{errorMessage}</p>
        </div>
      )}

      <textarea
        placeholder="输入管理员回复…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        disabled={isSubmitting}
        rows={2}
        className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)]"
      />

      <button
        type="submit"
        disabled={isSubmitting || !reply.trim()}
        className="inline-flex items-center gap-1.5 bg-[var(--primary)] px-3 py-1.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[13px]">send</span>
        {isSubmitting ? '提交中…' : '提交回复'}
      </button>
    </form>
  );
}
