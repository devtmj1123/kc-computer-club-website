'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
interface AdminRecord {
  $id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}
export default function AdminManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    if (user) {
      loadAdmins();
    }
  }, [user]);
  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const response = await fetch('/api/admin/seed');
      const data = await response.json();
      if (data.admins) {
        setAdmins(data.admins);
      }
      setError('');
    } catch (err) {
      setError('加载管理员列表失败');
      console.error(err);
    } finally {
      setLoadingAdmins(false);
    }
  };
  const handleDelete = async (adminId: string, username: string) => {
    if (username === 'admin' && admins.length === 1) {
      setError('不能删除最后一个管理员');
      return;
    }
    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '删除失败');
      }
      setError('');
      setDeleteConfirm(null);
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1220] flex items-center justify-center">
        <div className="text-white text-center">
          <span className="inline-block animate-spin">
            <span className="material-symbols-outlined text-[#137fec] text-5xl">
              hourglass_bottom
            </span>
          </span>
          <p className="mt-4">加载中...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <AdminLayout adminName={user.name || '管理员'}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">管理员管理</h1>
            <p className="text-[#7a8fa5] mt-2">添加、编辑和删除管理员账户</p>
          </div>
          <Link href="/admin/admins/create">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-[#0f6ecf] transition-colors">
              <span className="material-symbols-outlined">add_circle</span>
              添加管理员
            </button>
          </Link>
        </div>
      </div>
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
      <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] overflow-hidden">
        {loadingAdmins ? (
          <div className="p-8 text-center text-[#7a8fa5]">
            <span className="inline-block animate-spin mb-4">
              <span className="material-symbols-outlined text-[#137fec] text-3xl">
                hourglass_bottom
              </span>
            </span>
            <p>加载中...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-[#7a8fa5]">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">
              person_off
            </span>
            <p>暂无管理员账户</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#141f2e] border-b border-[#283a4f]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    用户名
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    注册时间
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    最后登录
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#283a4f]">
                {admins.map((admin) => (
                  <tr key={admin.$id} className="hover:bg-[#1f2d39] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#137fec]/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#137fec]">
                            admin_panel_settings
                          </span>
                        </div>
                        <span className="text-white font-medium">{admin.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          admin.isActive
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {admin.isActive ? '✓ 激活' : '✗ 禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#7a8fa5]">
                      {new Date(admin.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#7a8fa5]">
                      {admin.lastLogin
                        ? new Date(admin.lastLogin).toLocaleString('zh-CN')
                        : '未登录过'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/admins/${admin.$id}/edit`)}
                          className="p-2 hover:bg-[#283a4f] rounded transition-colors"
                          title="编辑"
                        >
                          <span className="material-symbols-outlined text-[#137fec]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(admin.$id)}
                          className="p-2 hover:bg-[#283a4f] rounded transition-colors"
                          title="删除"
                        >
                          <span className="material-symbols-outlined text-red-400">
                            delete
                          </span>
                        </button>
                      </div>
                      {deleteConfirm === admin.$id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                          <div className="bg-[#1a2838] border border-[#283a4f] rounded-2xl p-6 max-w-sm">
                            <h3 className="text-white font-bold mb-2">确认删除？</h3>
                            <p className="text-[#7a8fa5] mb-6">
                              确定要删除管理员 <strong>{admin.username}</strong> 吗？此操作无法撤销。
                            </p>
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-[#283a4f] text-white rounded hover:bg-[#354860] transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleDelete(admin.$id, admin.username)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}