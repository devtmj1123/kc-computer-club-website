'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/Input';
import { AdminPageSkeleton, AdminTableSkeleton } from '@/components/ui/PageSkeletons';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
interface Comment {
  $id: string;
  nickname: string;
  email: string;
  content: string;
  contentType: 'activity' | 'notice';
  contentId: string;
  createdAt: string;
  targetTitle: string;
  status: 'pending' | 'approved' | 'rejected';
}
const statusLabels: Record<Comment['status'], string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};
const statusClasses: Record<Comment['status'], string> = {
  pending: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  approved: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  rejected: 'bg-[var(--error)]/10 text-[var(--error)]',
};
export default function AdminComments() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useEffect(() => {
    if (!authLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);
  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadComments();
    }
  }, [user]);
  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/comments?onlyApproved=false');
      const data = await response.json();
      if (data.success && data.comments) {
        const [activitiesRes, noticesRes] = await Promise.all([
          fetch('/api/activities'),
          fetch('/api/notices'),
        ]);
        const activitiesData = await activitiesRes.json();
        const noticesData = await noticesRes.json();
        const activitiesMap = new Map(
          (activitiesData.activities || []).map((a: Record<string, unknown>) => [
            (a.$id as string), 
            (a.title as string)
          ])
        );
        const noticesMap = new Map(
          (noticesData.notices || []).map((n: Record<string, unknown>) => [
            (n.$id as string), 
            (n.title as string)
          ])
        );
        const formatted = (data.comments as unknown[]).map((c: unknown) => {
          const comment = c as Record<string, unknown>;
          const contentType = (comment.contentType as string) || 'activity';
          const contentId = (comment.contentId as string) || '';
          const titleMap = contentType === 'notice' ? noticesMap : activitiesMap;
          const targetTitle = (titleMap.get(contentId) || '内容') as string;
          return {
            $id: (comment.$id as string) || '',
            nickname: (comment.nickname as string) || '',
            email: (comment.email as string) || '',
            content: (comment.content as string) || '',
            contentType: (contentType as 'activity' | 'notice') || 'activity',
            contentId,
            createdAt: (comment.createdAt as string) || new Date().toISOString(),
            targetTitle,
            status: ((comment.status as string) || 'pending') as Comment['status'],
          };
        });
        setComments(formatted);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('加载评论失败:', err);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    const snapshot = comments;
    setDeleteId(null);
    setIsDeleting(true);
    setComments((prev) => prev.filter((c) => c.$id !== id));
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!data.success) {
        setComments(snapshot);
        alert(data.error || '删除失败');
      }
    } catch (err) {
      setComments(snapshot);
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleStatusChange = async (id: string, status: Comment['status']) => {
    const previousStatus = comments.find((comment) => comment.$id === id)?.status;
    setComments((prev) =>
      prev.map((comment) =>
        comment.$id === id ? { ...comment, status } : comment
      )
    );
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新评论状态失败');
      }
    } catch (err) {
      if (previousStatus) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.$id === id ? { ...comment, status: previousStatus } : comment
          )
        );
      }
      alert(err instanceof Error ? err.message : '更新评论状态失败');
    }
  };
  if (authLoading || !user) {
    return (
      <AdminLayout adminName="管理员">
        <AdminPageSkeleton title="Loading comments" rows={5} columns={3} />
      </AdminLayout>
    );
  }
  const filteredComments = comments.filter((comment) => {
    const matchSearch =
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.targetTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });
  return (
    <AdminLayout adminName="管理员">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">评论管理</h1>
        <p className="text-[var(--text-secondary)]">管理用户评论，维护社区环境。</p>
      </div>
      <div className="mb-6">
        <Input
          placeholder="搜索评论内容、评论者或评论对象..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon="search"
        />
      </div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-1">评论总数</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{comments.length}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-1">活动评论</p>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {comments.filter((c) => c.contentType === 'activity').length}
          </p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-1">待审核</p>
          <p className="text-2xl font-bold text-[var(--warning)]">
            {comments.filter((c) => c.status === 'pending').length}
          </p>
        </div>
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={4} columns={3} className="border-0" />
        ) : filteredComments.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {filteredComments.map((comment) => (
              <div
                key={comment.$id}
                className="px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-[var(--foreground)] font-semibold">{comment.nickname}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                      评论于{' '}
                      <span className="text-[var(--text-secondary)]">{comment.targetTitle}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${statusClasses[comment.status]}`}
                    >
                      {statusLabels[comment.status]}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="bg-[var(--surface-hover)] rounded-lg p-4 mb-3 text-[var(--foreground)] text-sm wrap-break-word">
                  {comment.content}
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-3">
                  <div className="flex items-center gap-4">
                    <span>{comment.email}</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        {comment.contentType === 'notice' ? 'article' : 'event'}
                      </span>
                      {comment.contentType === 'notice' ? '通知' : '活动'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {comment.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(comment.$id, 'approved')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-xs font-medium transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      通过
                    </button>
                  )}
                  {comment.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(comment.$id, 'rejected')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[var(--warning)]/10 hover:bg-[var(--warning)]/20 text-[var(--warning)] rounded-lg text-xs font-medium transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">block</span>
                      拒绝
                    </button>
                  )}
                  <button 
                    onClick={() => setDeleteId(comment.$id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--error)]/10 hover:bg-[var(--error)]/20 text-[var(--error)] rounded-lg text-xs font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--text-secondary)] block mb-3">
              chat
            </span>
            <p className="text-[var(--text-secondary)] mb-4">{comments.length === 0 ? '没有评论' : '没有找到匹配的评论'}</p>
          </div>
        )}
      </div>
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-[var(--foreground)] font-bold text-lg mb-2">确定删除此评论？</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              删除后将无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-active)] transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-[var(--error)] text-[var(--error-contrast)] rounded-lg hover:bg-[var(--error)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && (
                  <span className="material-symbols-outlined animate-spin text-sm">
                    hourglass_bottom
                  </span>
                )}
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}