'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
interface Admin {
  id: string;
  username: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}
export default function AdminManagePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadAdmins();
    }
  }, [user]);
  const loadAdmins = async () => {
    try {
      setIsLoadingAdmins(true);
      setError('');
      const response = await fetch('/api/admin/manage');
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
      } else {
        setError(data.error || '加载管理员列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingAdmins(false);
    }
  };
  const handleDelete = async (adminId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/manage?id=${adminId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(admins.filter(a => a.id !== adminId));
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
      <div className="max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">管理员管理</h1>
            <p className="text-gray-400">管理后台管理员账户</p>
          </div>
          <Link
            href="/admin/manage/create"
            className="px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0f6ecf] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            添加管理员
          </Link>
        </div>
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}
        <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] overflow-hidden shadow-sm">
          {isLoadingAdmins ? (
            <div className="p-8 text-center">
              <div className="animate-spin mb-4 inline-block">
                <span className="material-symbols-outlined text-[#137fec] text-3xl">
                  hourglass_bottom
                </span>
              </div>
              <p className="text-gray-400">加载中...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-gray-400 text-4xl block mb-2">
                admin_panel_settings
              </span>
              <p className="text-gray-400">暂无管理员</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#283a4f] bg-[#141f2e]">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      用户名
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      状态
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      创建时间
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      最后登录
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-[#283a4f] hover:bg-[#1f2d39] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#137fec]">
                              admin_panel_settings
                            </span>
                          </div>
                          <span className="font-medium text-white">{admin.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            admin.isActive
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {admin.isActive ? '激活' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(admin.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleDateString('zh-CN')
                          : '未登录'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/manage/${admin.id}/edit`}
                            className="p-2 bg-[#283a4f] text-gray-400 rounded-lg hover:text-white hover:bg-[#354860] transition-colors"
                            title="编辑"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Link>
                          <button
                            onClick={() => setDeleteId(admin.id)}
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
                确定要删除这个管理员吗？此操作无法撤销。
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