'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/services/notice.service';
export default function AdminNoticesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadNotices();
    }
  }, [user]);
  const loadNotices = async () => {
    try {
      setIsLoadingNotices(true);
      setError('');
      const response = await fetch('/api/notices');
      const data = await response.json();
      if (data.success) {
        setNotices(data.notices);
      } else {
        setError(data.error || '加载公告列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingNotices(false);
    }
  };
  const handleDelete = async (noticeId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setNotices(notices.filter(n => n.$id !== noticeId));
        setDeleteId(null);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };
  const filteredNotices = notices
    .filter((notice) => {
      const matchSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'all' || notice.status === selectedStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  if (isLoading || !user) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <span className="material-symbols-outlined text-[#137fec] text-5xl">
                hourglass_bottom
              </span>
            </div>
            <p className="text-white">加载中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="w-full">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">公告管理</h1>
            <p className="text-gray-400 text-sm">管理社团的所有公告信息</p>
          </div>
          <Link
            href="/admin/notices/create"
            className="w-full sm:w-auto px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0f6ecf] transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            新建公告
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6">
            <p className="text-gray-400 text-sm mb-1">总公告数</p>
            <p className="text-3xl font-bold text-white">{notices.length}</p>
          </div>
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6">
            <p className="text-gray-400 text-sm mb-1">已发布</p>
            <p className="text-3xl font-bold text-green-400">
              {notices.filter(n => n.status === 'published').length}
            </p>
          </div>
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6">
            <p className="text-gray-400 text-sm mb-1">草稿</p>
            <p className="text-3xl font-bold text-yellow-400">
              {notices.filter(n => n.status === 'draft').length}
            </p>
          </div>
        </div>
        <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="搜索公告..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec]"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'draft' | 'published')}
              className="px-4 py-2 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white focus:outline-none focus:border-[#137fec]"
            >
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}
        <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] overflow-hidden shadow-sm">
          {isLoadingNotices ? (
            <div className="p-8 text-center">
              <div className="animate-spin mb-4 inline-block">
                <span className="material-symbols-outlined text-[#137fec] text-3xl">
                  hourglass_bottom
                </span>
              </div>
              <p className="text-gray-400">加载中...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-gray-400 text-4xl block mb-2">
                campaign
              </span>
              <p className="text-gray-400">暂无公告</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#283a4f] bg-[#141f2e]">
                    <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-400">
                      标题
                    </th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left font-semibold text-gray-400">
                      分类
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      作者
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      状态
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      创建时间
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotices.map((notice) => (
                    <tr
                      key={notice.$id}
                      className="border-b border-[#283a4f] hover:bg-[#1f2d39] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {notice.pinned && (
                            <span className="material-symbols-outlined text-yellow-400 text-base" title="已置顶">push_pin</span>
                          )}
                          <span className="font-medium text-white">{notice.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{notice.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{notice.author}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            notice.status === 'published'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                        >
                          {notice.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(notice.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/notices/${notice.$id}/edit`}
                            className="p-2 bg-[#283a4f] text-gray-400 rounded-lg hover:text-white hover:bg-[#354860] transition-colors"
                            title="编辑"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Link>
                          <button
                            onClick={() => setDeleteId(notice.$id)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="删除"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6 max-w-sm">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                  <span className="material-symbols-outlined text-red-400 text-2xl">
                    warning
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white text-center">确认删除</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6 text-center">
                确定要删除这个公告吗？此操作无法撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2 bg-[#283a4f] text-white rounded-lg hover:bg-[#354860] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteId && handleDelete(deleteId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}