'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
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
}
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
      const response = await fetch('/api/comments');
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
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setComments(comments.filter((c) => c.$id !== id));
        setDeleteId(null);
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };
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
        <h1 className="text-3xl font-black text-white mb-2">评论管理</h1>
        <p className="text-gray-400">管理用户评论，维护社区环境。</p>
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
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">评论总数</p>
          <p className="text-2xl font-bold text-white">{comments.length}</p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">活动评论</p>
          <p className="text-2xl font-bold text-blue-400">
            {comments.filter((c) => c.contentType === 'activity').length}
          </p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">通知评论</p>
          <p className="text-2xl font-bold text-green-400">
            {comments.filter((c) => c.contentType === 'notice').length}
          </p>
        </div>
      </div>
      <div className="bg-[#1a2632] border border-[#283946] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 flex justify-center">
            <Loading size="sm" text="加载评论中..." />
          </div>
        ) : filteredComments.length > 0 ? (
          <div className="divide-y divide-[#283946]">
            {filteredComments.map((comment) => (
              <div
                key={comment.$id}
                className="px-6 py-4 hover:bg-[#1f2d39] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{comment.nickname}</h3>
                    <p className="text-gray-400 text-sm">
                      评论于{' '}
                      <span className="text-gray-500">{comment.targetTitle}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 ml-4">
                    {new Date(comment.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="bg-[#1f2d39] rounded-lg p-4 mb-3 text-white text-sm wrap-break-word">
                  {comment.content}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
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
                  <button 
                    onClick={() => setDeleteId(comment.$id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
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
            <span className="material-symbols-outlined text-6xl text-gray-600 block mb-3">
              chat
            </span>
            <p className="text-gray-400 mb-4">{comments.length === 0 ? '没有评论' : '没有找到匹配的评论'}</p>
          </div>
        )}
      </div>
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-2">确定删除此评论？</h3>
            <p className="text-gray-400 text-sm mb-6">
              删除后将无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-[#283946] text-white rounded-lg hover:bg-[#2f3d47] transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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