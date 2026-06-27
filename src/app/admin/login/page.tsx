'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [adminUsername, setAdminUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await adminLogin(adminUsername, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 size-72 rounded-full bg-[var(--admin-primary)] blur-3xl"></div>
        <div className="absolute bottom-20 left-20 size-72 rounded-full bg-[var(--admin-primary)] blur-3xl"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="nm-panel p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl nm-raised-sm mb-4 text-[var(--admin-primary)]">
              <span className="material-symbols-outlined text-3xl">
                admin_panel_settings
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">管理员登录</h1>
            <p className="text-[#7a8fa5] text-sm">
              电脑学会官网管理后台
            </p>
          </div>
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 nm-inset text-white placeholder-[#5a6b7f] focus:outline-none focus:shadow-[var(--nm-inset),0_0_0_1px_rgba(79,163,247,0.18)] transition-shadow disabled:opacity-50"
                />
              </div>
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
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 nm-inset text-white placeholder-[#5a6b7f] focus:outline-none focus:shadow-[var(--nm-inset),0_0_0_1px_rgba(79,163,247,0.18)] transition-shadow disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8fa5] hover:text-white transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 rounded-2xl bg-[var(--admin-primary)] text-[#111814] font-bold shadow-[var(--nm-raised-sm)] hover:shadow-[var(--nm-raised)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">
                    hourglass_bottom
                  </span>
                  登录中...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">arrow_forward</span>
                  登录
                </>
              )}
            </button>
          </form>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[var(--surface)] text-[var(--text-secondary)]">或</span>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="btn w-full mb-6 justify-center"
          >
            <span className="material-symbols-outlined inline mr-2 align-middle">
              school
            </span>
            学生登录
          </Link>
          <p className="text-center text-[var(--text-secondary)] text-xs">
            非管理员用户请使用学生账号登录
          </p>
        </div>
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            返回主站
          </Link>
        </div>
      </div>
    </div>
  );
}