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

export function CommentList({
  comments,
  onCommentDeleted,
  onReplySubmitted,
}: CommentListProps) {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-3">
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
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const isAuthor = user?.email === comment.email;

  const commentTime = new Date(comment.createdAt).getTime();
  const now = new Date().getTime();
  const minutesElapsed = (now - commentTime) / (1000 * 60);
  const canEditDelete = minutesElapsed < 5;

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

  const handleEdit = async () => {
    if (!editContent.trim()) {
      setEditError('评论内容不能为空');
      return;
    }

    setIsSavingEdit(true);
    setEditError('');

    try {
      const response = await fetch(`/api/comments/${comment.$id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowEditForm(false);
        onReplySubmitted?.();
      } else {
        setEditError('编辑失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      setEditError('编辑失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{comment.nickname}</p>
          {comment.email && (
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>({comment.email})</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <p className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
            {new Date(comment.createdAt).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>

          {isAuthor && canEditDelete && (
            <>
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                className="p-1 text-[#13ec80] hover:text-[#0fcc6a] transition-colors"
                title="编辑评论"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                title="删除评论"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </>
          )}

          {isAdmin && !isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              title="删除评论"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg p-2">
        {showEditForm ? (
          <div className="space-y-2">
            {editError && (
              <div className="bg-red-500/10 rounded p-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                <p className="text-red-400 text-xs">{editError}</p>
              </div>
            )}
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSavingEdit}
              rows={2}
              className="w-full rounded px-2 py-1 focus:outline-none focus:ring-1 resize-none text-xs"
              style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)', borderWidth: '1px' }}
              placeholder="编辑评论..."
            />
            <div className="flex gap-1">
              <button
                onClick={handleEdit}
                disabled={isSavingEdit}
                className="px-2 py-1 font-semibold rounded text-xs transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)', color: '#102219' }}
              >
                {isSavingEdit ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditContent(comment.content);
                  setEditError('');
                }}
                disabled={isSavingEdit}
                className="px-2 py-1 rounded text-xs transition-colors"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)', borderWidth: '1px' }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{comment.content}</p>
        )}
      </div>

      {comment.reply && (
        <div className="rounded-lg p-2 space-y-1 ml-3" style={{ backgroundColor: 'var(--primary) / 0.1', borderLeftColor: 'var(--primary)', borderLeftWidth: '2px' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>check</span>
              <p className="font-semibold text-xs" style={{ color: 'var(--primary)' }}>
                {comment.replyAuthor}
              </p>
            </div>
            {comment.replyAt && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {new Date(comment.replyAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <p className="pl-1 text-xs leading-relaxed" style={{ color: 'var(--foreground)' }}>{comment.reply}</p>
        </div>
      )}

      {isAdmin && !comment.reply && (
        <div className="pt-0">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-[#13ec80] hover:text-[#0fcc6a] transition-colors font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">reply</span>
            {showReplyForm ? '取消回复' : '回复'}
          </button>
        </div>
      )}

      {showReplyForm && isAdmin && (
        <AdminReplyForm
          commentId={comment.$id}
          onReplySubmitted={() => {
            setShowReplyForm(false);
            onReplySubmitted?.();
          }}
        />
      )}
    </div>
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
    <form onSubmit={handleSubmit} className="rounded-lg p-2 space-y-2 ml-3 bg-[#1a2c23]/50">
      {errorMessage && (
        <div className="bg-red-500/10 rounded p-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-sm">error</span>
          <p className="text-red-400 text-xs">{errorMessage}</p>
        </div>
      )}

      <textarea
        placeholder="输入回复..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        disabled={isSubmitting}
        rows={2}
        className="w-full rounded px-2 py-1 placeholder-[#5a7068] focus:outline-none focus:ring-1 focus:ring-[#13ec80]/30 transition-colors resize-none text-xs" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
      />

      <div className="flex gap-1">
        <button
          type="submit"
          disabled={isSubmitting || !reply.trim()}
          className="px-2 py-1 bg-[#13ec80] text-[#102219] font-semibold rounded text-xs hover:bg-[#0fcc6a] transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">send</span>
          {isSubmitting ? '提交中...' : '提交'}
        </button>
      </div>
    </form>
  );
}
