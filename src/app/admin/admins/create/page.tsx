'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
export default function CreateAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1220] flex items-center justify-center">
        <div className="text-white text-center">
          <span className="inline-block animate-spin">
            <span className="material-symbols-outlined text-[#137fec] text-5xl">
              hourglass_bottom
            </span>
          </span>
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (username.length < 3) {
      setError('用户名至少需要 3 个字符');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不匹配');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '创建失败');
      }
      setSuccess('管理员创建成功！正在跳转...');
      setTimeout(() => {
        router.push('/admin/admins');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AdminLayout adminName={user.name || '管理员'}>
      <div className="max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/admins"
            className="inline-flex items-center gap-2 text-[#7a8fa5] hover:text-white transition-colors mb-6"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            返回管理员列表
          </Link>
          <h1 className="text-3xl font-bold text-white">添加新管理员</h1>
          <p className="text-[#7a8fa5] mt-2">创建新的管理员账户</p>
        </div>
        <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
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
                  placeholder="请输入用户名（至少 3 个字符）"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-[#5a6b7f] focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-colors disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-[#7a8fa5] mt-1">
                用户名将用于登录管理后台
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] material-symbols-outlined">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入强密码（至少 8 个字符）"
                  required
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
              <p className="text-xs text-[#7a8fa5] mt-1">
                建议使用大小写字母、数字和特殊字符的组合
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                确认密码
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] material-symbols-outlined">
                  check_circle
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="重新输入密码"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-12 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-[#5a6b7f] focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-[#0f6ecf] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">
                      hourglass_bottom
                    </span>
                    创建中...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add_circle</span>
                    创建管理员
                  </>
                )}
              </button>
              <Link href="/admin/admins" className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 bg-[#283a4f] text-white font-bold rounded-lg hover:bg-[#354860] transition-colors"
                >
                  取消
                </button>
              </Link>
            </div>
          </form>
          <div className="mt-8 pt-6 border-t border-[#283a4f]">
            <p className="text-[#7a8fa5] text-sm">
              💡 <strong>提示：</strong> 创建的管理员可以使用用户名和密码登录管理后台。请妥善保管初始密码，管理员可以登录后自行修改密码。
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}