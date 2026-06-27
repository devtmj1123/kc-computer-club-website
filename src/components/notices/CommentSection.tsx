'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';

interface Comment {
  $id: string;
  authorName: string;
  content: string;
  createdAt: string;
  status: string;
  authorEmail?: string;
}

interface CommentSectionProps {
  targetType: 'notice' | 'activity';
  targetId: string;
  targetTitle?: string;
}

export const CommentSection = ({ targetType, targetId, targetTitle }: CommentSectionProps) => {
  const { user, isStudent } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    if (isStudent && user && !('role' in user)) {
      setAuthorName(user.name);
      setAuthorEmail(user.email);
    }
  }, [isStudent, user]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/comments?targetType=${targetType}&targetId=${targetId}&onlyApproved=true`
        );
        const data = await response.json();
        if (data.success) {
          setComments(data.comments || []);
        }
      } catch (err: unknown) {
        console.error('加载评论失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [targetType, targetId]);

  const isWithin5Minutes = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return (now - created) < 5 * 60 * 1000;
  };

  const isCommentAuthor = (comment: Comment) => {
    return isStudent && user && user.email === comment.authorEmail;
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) {
      setError('评论内容不能为空');
      return;
    }

    setIsEditSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        setEditContent('');
        const listResponse = await fetch(
          `/api/comments?targetType=${targetType}&targetId=${targetId}&onlyApproved=true`
        );
        const listData = await listResponse.json();
        if (listData.success) {
          setComments(listData.comments || []);
        }
      } else {
        setError(data.error || '编辑评论失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        const listResponse = await fetch(
          `/api/comments?targetType=${targetType}&targetId=${targetId}&onlyApproved=true`
        );
        const listData = await listResponse.json();
        if (listData.success) {
          setComments(listData.comments || []);
        }
      } else {
        setError(data.error || '删除评论失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitSuccess(false);

    if (!authorName.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!content.trim()) {
      setError('请输入评论内容');
      return;
    }
    if (content.length > 500) {
      setError('评论内容不能超过500个字符');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          targetTitle,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setContent('');
        if (!isStudent || !user) {
          setAuthorName('');
          setAuthorEmail('');
        }

        const listResponse = await fetch(
          `/api/comments?targetType=${targetType}&targetId=${targetId}&onlyApproved=true`
        );
        const listData = await listResponse.json();
        if (listData.success) {
          setComments(listData.comments || []);
        }

        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        setError(data.error || '发布评论失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-[#283930]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-6 group rounded-2xl px-1 py-1"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-black dark:text-white group-hover:text-[#13ec80] transition-colors">
            评论区
          </h2>
          <span className="text-sm text-[var(--text-secondary)] bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] px-2 py-1 rounded-full">
            {comments.length}
          </span>
        </div>
        <span className={`material-symbols-outlined text-[#9db9ab] group-hover:text-[#13ec80] transition-all ${
          isExpanded ? 'rotate-180' : ''
        }`}>
          expand_more
        </span>
      </button>

      {isExpanded && (
        <>
          <div className="bg-[var(--nm-bg)] rounded-[28px] shadow-[var(--nm-raised)] p-6 mb-8 animate-in">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">发表评论</h3>

            {submitSuccess && (
              <div className="bg-[#13ec80]/10 text-[#13ec80] px-4 py-3 rounded-2xl mb-4 shadow-[var(--nm-inset-sm)]">
                <p className="text-sm font-medium">评论已发布</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-2xl mb-4 shadow-[var(--nm-inset-sm)]">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isStudent || !user ? (
                <div className="bg-blue-500/10 text-blue-400 px-4 py-3 rounded-2xl mb-4 shadow-[var(--nm-inset-sm)]">
                  <p className="text-sm font-medium">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                    请先登录以发表评论
                  </p>
                </div>
              ) : (
                <div className="bg-[#13ec80]/10 text-[#13ec80] px-4 py-3 rounded-2xl mb-4 shadow-[var(--nm-inset-sm)]">
                  <p className="text-sm font-medium">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">verified_user</span>
                    以 <span className="font-bold">{user.name}</span> ({user.email}) 的身份发表评论
                  </p>
                </div>
              )}

              <div>
                <textarea
                  placeholder="写下你的评论... (最多500个字符)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting || !isStudent || !user}
                  maxLength={500}
                  rows={4}
                  className="w-full bg-[var(--nm-bg)] text-[var(--foreground)] rounded-2xl shadow-[var(--nm-inset)] px-4 py-3 placeholder:text-[var(--text-secondary)] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-[#9db9ab] mt-2 text-right">
                  {content.length}/500
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !content.trim() || !isStudent || !user}
                >
                  {!isStudent || !user ? '请先登录' : isSubmitting ? '发布中...' : '发布评论'}
                </Button>
              </div>
            </form>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loading size="sm" text="加载评论中..." />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const canEditDelete = isCommentAuthor(comment) && isWithin5Minutes(comment.createdAt);
                return (
                  <div
                    key={comment.$id}
                    className="bg-[var(--nm-bg)] rounded-[24px] shadow-[var(--nm-raised-sm)] p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-black dark:text-white">{comment.authorName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#9db9ab]">
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        {canEditDelete && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(comment.$id);
                                setEditContent(comment.content);
                              }}
                              className="text-xs px-2 py-1 text-[#13ec80] hover:bg-[#13ec80]/10 rounded-xl transition-colors"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.$id)}
                              className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingId === comment.$id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          maxLength={500}
                          rows={3}
                          className="w-full bg-[var(--nm-bg)] text-[var(--foreground)] rounded-2xl shadow-[var(--nm-inset)] px-3 py-2 placeholder:text-[var(--text-secondary)] focus:outline-none resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="text-xs px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--foreground)] rounded-xl transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleEditComment(comment.$id, editContent)}
                            disabled={isEditSubmitting}
                            className="text-xs px-3 py-1 bg-[#13ec80]/20 text-[#13ec80] hover:bg-[#13ec80]/30 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {isEditSubmitting ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[var(--foreground)] leading-relaxed">
                        {comment.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-[#9db9ab] block mb-3">
                comment
              </span>
              <p className="text-[#9db9ab]">暂无评论，成为第一个评论者吧！</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};
