'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
interface Admin {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}
export default function EditAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adminId = params?.id as string;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [username, setUsername] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  const loadAdmin = useCallback(async () => {
    try {
      setIsLoadingAdmin(true);
      const response = await fetch('/api/admin/manage');
      const data = await response.json();
      if (data.success) {
        const foundAdmin = data.admins.find((a: Admin) => a.id === adminId);
        if (foundAdmin) {
          setAdmin(foundAdmin);
          setUsername(foundAdmin.username);
          setIsActive(foundAdmin.isActive);
        } else {
          setError('管理员不存在');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingAdmin(false);
    }
  }, [adminId]);
  useEffect(() => {
    if (adminId && user && 'role' in user && user.role === 'admin') {
      loadAdmin();
    }
  }, [adminId, user, loadAdmin]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          username,
          isActive,
          ...(newPassword && { newPassword }),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('管理员更新成功！');
        setNewPassword('');
        setTimeout(() => router.push('/admin/manage'), 1500);
      } else {
        setError(data.error || '更新失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading || !user || isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-[#0a1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="material-symbols-outlined text-[#137fec] text-5xl">
              hourglass_bottom
            </span>
          </div>
          <p className="text-white">加载中...</p>
        </div>
      </div>
    );
  }
  if (!admin) {
    return (
      <div className="min-h-screen bg-[#0a1220] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || '管理员不存在'}</p>
          <Link href="/admin/manage" className="text-[#137fec] hover:underline">
            返回管理员列表
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#0a1220] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/manage"
            className="inline-flex items-center gap-2 text-[#7a8fa5] hover:text-white transition-colors mb-6"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            返回管理员列表
          </Link>
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-8">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-[#137fec]/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#137fec] text-3xl">
                  edit
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">编辑管理员</h1>
              <p className="text-[#7a8fa5]">修改管理员账户信息</p>
            </div>
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                ✓ {success}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  管理员用户名
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] material-symbols-outlined">
                    person
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入用户名"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-[#5a6b7f] focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  账户状态
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isActive}
                      onChange={() => setIsActive(true)}
                      disabled={isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className="text-white">激活</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isActive}
                      onChange={() => setIsActive(false)}
                      disabled={isSubmitting}
                      className="w-4 h-4"
                    />
                    <span className="text-white">禁用</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  新密码（可选）
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] material-symbols-outlined">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="留空则不修改密码"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-12 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-[#5a6b7f] focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-[#7a8fa5] mt-1">若要修改密码，请输入新密码（至少 6 个字符）</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-3 bg-[#283a4f] text-white rounded-lg hover:bg-[#354860] transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#137fec] text-white rounded-lg hover:bg-[#0f6ecf] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin material-symbols-outlined">
                        hourglass_bottom
                      </span>
                      保存中...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      保存更改
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}