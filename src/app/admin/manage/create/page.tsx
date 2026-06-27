'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    if (username.length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (!password) {
      setError('密码不能为空');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('密码不匹配');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('管理员创建成功！');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => router.push('/admin/manage'), 1500);
      } else {
        setError(data.error || '创建失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading || !user) {
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
                  person_add
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">添加新管理员</h1>
              <p className="text-[#7a8fa5]">创建新的管理员账户</p>
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
                <p className="text-xs text-[#7a8fa5] mt-1">3-20 个字符</p>
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
                    placeholder="输入密码"
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
                <p className="text-xs text-[#7a8fa5] mt-1">至少 6 个字符</p>
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
                      创建中...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      创建管理员
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