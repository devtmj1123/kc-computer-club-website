'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/Input';
import { ProfilePageSkeleton } from '@/components/ui/PageSkeletons';

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

const tabs = [
  { value: 'info' as const, label: '详细资料', icon: 'info' },
  { value: 'password' as const, label: '修改密码', icon: 'lock' },
  { value: 'theme' as const, label: '主题设置', icon: 'palette' },
];

function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
        {label}
      </span>
      <span className="min-h-10 border border-[var(--border)] bg-[var(--surface-hover)] px-3.5 py-2.5 text-[13px] text-[var(--text-secondary)]">
        {value || '—'}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading, logout, changePassword } = useAuth();
  const { mode, setMode, resetTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'theme'>('info');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
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
    if (user && !('role' in user)) {
      setStudentInfo({
        studentId: user.studentId || '',
        chineseName: user.chineseName || user.name || '',
        englishName: user.englishName || '',
        classNameCn: user.classNameCn || '',
        classNameEn: user.classNameEn || '',
        classCode: user.classCode || '',
        groupLevel: user.groupLevel || '',
        position: user.position || '',
        phone: user.phone || '',
        instagram: user.instagram || '',
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <StudentLayout>
        <ProfilePageSkeleton />
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

  const displayName = studentInfo?.chineseName || user.name || '成员';
  const initial = displayName.slice(0, 1);

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <a href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </a>
          <span>/</span>
          <span className="text-[var(--foreground)]">个人中心</span>
        </nav>

        <header className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
          <div className="flex items-center gap-5">
            <span className="flex size-16 shrink-0 items-center justify-center bg-[var(--primary)] font-display text-[26px] font-bold text-[var(--primary-contrast)]">
              {initial}
            </span>
            <div>
              <div className="eyebrow">MEMBER PROFILE · 个人中心</div>
              <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
                {displayName}
              </h1>
              <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                {[studentInfo?.classNameCn, studentInfo?.position, studentInfo?.studentId]
                  .filter(Boolean)
                  .join(' · ') || user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-fit items-center gap-2 border border-[var(--border)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            登出账号
          </button>
        </header>

        <div className="mt-8 flex overflow-x-auto border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex min-w-fit items-center gap-2 border-b-2 px-4 py-3 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors ${
                activeTab === tab.value
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'info' && (
            <div className="space-y-10">
              <section>
                <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    01
                  </span>
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    基本资料
                  </h2>
                  <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <ReadonlyField label="中文姓名" value={studentInfo?.chineseName} />
                  <ReadonlyField label="英文姓名" value={studentInfo?.englishName} />
                  <ReadonlyField label="学号" value={studentInfo?.studentId} />
                  <ReadonlyField label="邮箱" value={user.email} />
                </div>
              </section>

              <section>
                <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    02
                  </span>
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    班级与社团
                  </h2>
                  <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <ReadonlyField label="中文班级" value={studentInfo?.classNameCn} />
                  <ReadonlyField label="英文班级" value={studentInfo?.classNameEn} />
                  <ReadonlyField label="班级代码" value={studentInfo?.classCode} />
                  <ReadonlyField label="分组级别" value={studentInfo?.groupLevel} />
                  <ReadonlyField label="职位" value={studentInfo?.position || '成员'} />
                  <ReadonlyField label="联系电话" value={studentInfo?.phone} />
                  <div className="sm:col-span-2">
                    <ReadonlyField label="Instagram" value={studentInfo?.instagram} />
                  </div>
                </div>
              </section>

              {'createdAt' in user && user.createdAt && (
                <section>
                  <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                    <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                      03
                    </span>
                    <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                      加入时间
                    </h2>
                    <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                  </div>
                  <p className="mt-5 text-[13px] text-[var(--text-secondary)]">
                    {new Date(user.createdAt).toLocaleString('zh-CN')}
                  </p>
                </section>
              )}

              <p className="flex items-start gap-2 border border-[var(--border)] px-4 py-3 font-mono text-[12px] leading-relaxed tracking-[0.02em] text-[var(--text-tertiary)]">
                <span className="material-symbols-outlined text-[14px]">info</span>
                资料信息由管理员维护。如需更新，请联系社团管理员。
              </p>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="max-w-xl">
              {error && (
                <div className="mb-5 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
                    error
                  </span>
                  <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-5 flex items-start gap-3 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-4 py-3">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--primary)]">
                    check_circle
                  </span>
                  <p className="text-[12px] leading-relaxed text-[var(--primary)]">{success}</p>
                </div>
              )}

              <div className="space-y-5 border border-[var(--rule-strong)] p-5 sm:p-6">
                <Input
                  label="当前密码"
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="输入当前密码"
                  required
                  disabled={isSubmitting}
                  leftIcon="lock"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {showOldPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />

                <Input
                  label="新密码"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                  required
                  disabled={isSubmitting}
                  hint="至少 6 个字符，建议使用字母和数字组合"
                  leftIcon="lock_open"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />

                <Input
                  label="确认新密码"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="重新输入新密码"
                  required
                  disabled={isSubmitting}
                  leftIcon="check_circle"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />

                <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">save</span>
                    {isSubmitting ? '保存中…' : '保存密码'}
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
                    className="inline-flex items-center gap-2 border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    取消
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'theme' && (
            <div className="max-w-2xl">
              <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                  THEME
                </span>
                <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                  外观模式
                </h2>
                <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                选择浅色或深色主题。网站只使用社团松绿色作为强调色。
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'light' as const,
                    label: '浅色模式',
                    icon: 'light_mode',
                    hint: '明亮、干净的界面',
                  },
                  {
                    value: 'dark' as const,
                    label: '深色模式',
                    icon: 'dark_mode',
                    hint: '低光环境下更舒适',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    className={`flex items-center gap-4 border p-4 text-left transition-colors ${
                      mode === option.value
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--rule-strong)]'
                    }`}
                  >
                    <span className="flex size-9 items-center justify-center border border-[var(--border)] text-[var(--foreground)]">
                      <span className="material-symbols-outlined text-[17px]">{option.icon}</span>
                    </span>
                    <span className="flex-1">
                      <span className="block text-[12px] font-semibold text-[var(--foreground)]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                        {option.hint}
                      </span>
                    </span>
                    {mode === option.value && (
                      <span className="material-symbols-outlined text-[17px] text-[var(--primary)]">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={resetTheme}
                  className="inline-flex items-center gap-2 border border-[var(--border)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  跟随系统外观
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </StudentLayout>
  );
}
