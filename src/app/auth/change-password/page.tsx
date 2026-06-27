'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading, changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!isLoading && !user) {
    router.push('/auth/login');
    return null;
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#102219] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#13ec80]/10 mb-4">
            <span className="material-symbols-outlined text-[#13ec80] text-2xl animate-spin">
              hourglass_bottom
            </span>
          </div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (newPassword.length < 8) {
      setError('新密码至少需要 8 个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }
    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      return;
    }
    if (user && 'studentId' in user && user.studentId && newPassword === user.studentId) {
      setError('新密码不能与学号相同');
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#102219] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#13ec80] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#13ec80] rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#1a2c23] rounded-2xl border border-[#283930] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#13ec80]/10 mb-4">
              <span className="material-symbols-outlined text-[#13ec80] text-3xl">
                lock
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">修改密码</h1>
            <p className="text-[#9db9ab] text-sm">
              更新您的账号密码以保护您的账户安全
            </p>
          </div>
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success ? (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-400 text-5xl shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="text-green-400 font-semibold mb-1">密码修改成功！</p>
                  <p className="text-green-300 text-sm">
                    正在返回首页，请稍候...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  当前密码
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db9ab] material-symbols-outlined">
                    lock
                  </span>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="输入当前密码"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-12 py-3 bg-[#162a21] border border-[#283930] rounded-lg text-white placeholder-[#5a6b63] focus:outline-none focus:border-[#13ec80] focus:ring-1 focus:ring-[#13ec80] transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9db9ab] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showOldPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  新密码
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db9ab] material-symbols-outlined">
                    lock_open
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码（至少 8 个字符）"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-12 py-3 bg-[#162a21] border border-[#283930] rounded-lg text-white placeholder-[#5a6b63] focus:outline-none focus:border-[#13ec80] focus:ring-1 focus:ring-[#13ec80] transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9db9ab] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-[#7a8f85] mt-1">
                  至少需要 8 个字符，包括字母和数字
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  确认新密码
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db9ab] material-symbols-outlined">
                    check_circle
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="重新输入新密码"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-12 py-3 bg-[#162a21] border border-[#283930] rounded-lg text-white placeholder-[#5a6b63] focus:outline-none focus:border-[#13ec80] focus:ring-1 focus:ring-[#13ec80] transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9db9ab] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#13ec80] text-[#102219] font-bold rounded-lg hover:bg-[#0fd673] disabled:opacity-50 transition-colors mt-6 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">
                      hourglass_bottom
                    </span>
                    修改中...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">done</span>
                    确认修改
                  </>
                )}
              </button>
            </form>
          )}
          <div className="text-center">
            <Link
              href="/"
              className="text-[#9db9ab] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}