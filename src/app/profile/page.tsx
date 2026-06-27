'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentLayout } from '@/components/layout/StudentLayout';
interface StudentInfo {
  studentId?: string;
  chineseName?: string;
  englishName?: string;
  classNameCn?: string;
  classNameEn?: string;
  classCode?: string;
  groupLevel?: string;
  position?: string;
  phone?: string;
  instagram?: string;
}
export default function ProfilePage() {
  const { user, isLoading, logout, changePassword } = useAuth();
  const { mode, setMode, colors, presetColors, applyPreset, resetTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'theme'>('info');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    if (user && !('role' in user) && user.id) {
      setLoadingInfo(true);
      fetch(`/api/admin/students/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.student) {
            setStudentInfo({
              studentId: data.student.studentId || '',
              chineseName: data.student.chineseName || user.name || '',
              englishName: data.student.englishName || '',
              classNameCn: data.student.classNameCn || '',
              classNameEn: data.student.classNameEn || '',
              classCode: data.student.classCode || '',
              groupLevel: data.student.groupLevel || '',
              position: data.student.position || '',
              phone: data.student.phone || '',
              instagram: data.student.instagram || '',
            });
          }
        })
        .catch(err => console.error('Failed to fetch student info:', err))
        .finally(() => setLoadingInfo(false));
    }
  }, [user]);
  if (isLoading || loadingInfo) {
    return (
      <StudentLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <span className="material-symbols-outlined text-[#137fec] text-5xl">
                hourglass_bottom
              </span>
            </div>
            <p className="text-[var(--foreground)]">加载中...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }
  if (!user) {
    return null;
  }
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少需要 6 个字符');
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
    setIsSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess('密码修改成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('登出失败:', err);
    }
  };
  return (
    <StudentLayout>
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-5xl">
                    person
                  </span>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                    {studentInfo?.chineseName || user.name}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                    {studentInfo?.classNameCn && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">school</span>
                        {studentInfo.classNameCn}
                      </span>
                    )}
                    {studentInfo?.position && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">badge</span>
                        {studentInfo.position}
                      </span>
                    )}
                    {studentInfo?.studentId && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">tag</span>
                        {studentInfo.studentId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-[var(--border)] flex gap-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                  登出
                </button>
              </div>
            </div>
          </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="flex border-b border-[var(--border)] overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 min-w-fit py-4 px-6 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'info'
                  ? 'text-primary border-b-2 border-primary -mb-0.5'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">info</span>
                详细资料
              </span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 min-w-fit py-4 px-6 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'password'
                  ? 'text-primary border-b-2 border-primary -mb-0.5'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">lock</span>
                修改密码
              </span>
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 min-w-fit py-4 px-6 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'theme'
                  ? 'text-primary border-b-2 border-primary -mb-0.5'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">palette</span>
                主题设置
              </span>
            </button>
          </div>
          <div className="p-8">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      中文姓名
                    </label>
                    <input
                      type="text"
                      value={studentInfo?.chineseName || ''}
                      disabled
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      英文姓名
                    </label>
                    <input
                      type="text"
                      value={studentInfo?.englishName || ''}
                      disabled
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      学号
                    </label>
                    <input
                      type="text"
                      value={studentInfo?.studentId || ''}
                      disabled
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">school</span>
                    班级信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        中文班级
                      </label>
                      <input
                        type="text"
                        value={studentInfo?.classNameCn || ''}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        英文班级
                      </label>
                      <input
                        type="text"
                        value={studentInfo?.classNameEn || ''}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        班级代码
                      </label>
                      <input
                        type="text"
                        value={studentInfo?.classCode || ''}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        年级
                      </label>
                      <input
                        type="text"
                        value={studentInfo?.groupLevel || ''}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">groups</span>
                    社团信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        职位
                      </label>
                      <input
                        type="text"
                        value={studentInfo?.position || '成员'}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        联系电话
                      </label>
                      <input
                        type="tel"
                        value={studentInfo?.phone || ''}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Instagram 账号
                      </label>
                      <input
                        type="text"
                        value={studentInfo?.instagram || ''}
                        disabled
                        className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                      />
                    </div>
                  </div>
                </div>
                {'createdAt' in user && user.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      加入社团时间
                    </label>
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleString('zh-CN')}
                      disabled
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] cursor-not-allowed opacity-60"
                    />
                  </div>
                )}
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] text-sm">
                    💡 提示：资料信息由管理员管理。如需更新信息，请联系社团管理员。
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                    ✓ {success}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    当前密码
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] material-symbols-outlined">
                      lock
                    </span>
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="输入当前密码"
                      required
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-12 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {showOldPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    新密码
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] material-symbols-outlined">
                      lock_open
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="输入新密码（至少 8 个字符）"
                      required
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-12 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    至少需要 8 个字符，包括字母和数字
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    确认新密码
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] material-symbols-outlined">
                      check_circle
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="重新输入新密码"
                      required
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-12 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">save</span>
                    {isSubmitting ? '保存中...' : '保存密码'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                      setSuccess('');
                    }}
                    className="flex-1 px-6 py-3 bg-[var(--surface-hover)] hover:opacity-80 text-[var(--foreground)] font-semibold rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                    取消
                  </button>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] text-sm">
                    🔐 提示：新密码至少需要 6 个字符，建议使用大小写字母和数字组合。
                  </p>
                </div>
              </form>
            )}
            {activeTab === 'theme' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">contrast</span>
                    外观模式
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setMode('light')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        mode === 'light'
                          ? 'border-primary bg-primary/10'
                          : 'border-[var(--border)] hover:border-primary/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-yellow-500">light_mode</span>
                      </div>
                      <span className="font-medium text-[var(--foreground)]">浅色</span>
                    </button>
                    <button
                      onClick={() => setMode('dark')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        mode === 'dark'
                          ? 'border-primary bg-primary/10'
                          : 'border-[var(--border)] hover:border-primary/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-blue-400">dark_mode</span>
                      </div>
                      <span className="font-medium text-[var(--foreground)]">深色</span>
                    </button>
                    <button
                      onClick={() => setMode('system')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        mode === 'system'
                          ? 'border-primary bg-primary/10'
                          : 'border-[var(--border)] hover:border-primary/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-purple-400">settings_brightness</span>
                      </div>
                      <span className="font-medium text-[var(--foreground)]">跟随系统</span>
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">palette</span>
                    主题颜色
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    选择你喜欢的主题颜色，它会应用到整个网站的按钮、链接和强调元素。
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {presetColors.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => applyPreset(preset.color)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          colors.primary === preset.color
                            ? 'ring-2 ring-offset-2 ring-offset-[var(--background)] bg-[var(--surface-hover)]'
                            : 'hover:bg-[var(--surface-hover)]'
                        }`}
                        style={{ 
                          '--tw-ring-color': preset.color 
                        } as React.CSSProperties}
                        title={preset.name}
                      >
                        <div 
                          className="w-10 h-10 rounded-full shadow-lg"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">preview</span>
                    效果预览
                  </h3>
                  <div className="p-6 bg-[var(--input-bg)] rounded-xl border border-[var(--border)]">
                    <div className="flex flex-wrap gap-4 items-center">
                      <button 
                        className="px-4 py-2 rounded-lg font-medium text-black transition-colors"
                        style={{ backgroundColor: colors.primary }}
                      >
                        主要按钮
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg font-medium transition-colors border"
                        style={{ 
                          borderColor: colors.primary, 
                          color: colors.primary 
                        }}
                      >
                        次要按钮
                      </button>
                      <span 
                        className="font-medium"
                        style={{ color: colors.primary }}
                      >
                        主题色文字
                      </span>
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <button
                    onClick={resetTheme}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">restart_alt</span>
                    恢复默认设置
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </StudentLayout>
  );
}