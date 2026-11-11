'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { changeAdminPassword } from '@/services/auth.service';

interface ClubSettings {
  aboutTitle?: string;
  aboutDescription?: string;
  aboutEmail?: string;
  aboutLocation?: string;
  aboutMeetingTime?: string;
  website?: string;
  logoUrl?: string;
  heroImage?: string;
  heroImageAlt?: string;
  recruitmentStatus?: string;
  activeMembers?: number;
  yearlyActivities?: number;
  awardProjects?: number;
  partners?: number;
  githubUrl?: string;
  discordUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}

interface AttendanceConfig {
  dayOfWeek: number;
  session1Start: { hour: number; minute: number };
  session1Duration: number;
  session2Start: { hour: number; minute: number };
  session2Duration: number;
  weekStartDate: string;
}

const DEFAULT_SETTINGS: ClubSettings = {};
const DEFAULT_ATTENDANCE_CONFIG: AttendanceConfig = {
  dayOfWeek: 2,
  session1Start: { hour: 15, minute: 20 },
  session1Duration: 5,
  session2Start: { hour: 16, minute: 35 },
  session2Duration: 5,
  weekStartDate: '2026-01-06',
};
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[var(--rule-strong)]">
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
        <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">{title}</h2>
        <span className="mono-label">{note}</span>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AdminSettings() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<ClubSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'security' | 'attendance'>('about');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [attendanceConfig, setAttendanceConfig] =
    useState<AttendanceConfig>(DEFAULT_ATTENDANCE_CONFIG);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (activeTab === 'about' && isAdmin) {
      loadClubSettings();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === 'attendance' && isAdmin) {
      loadAttendanceConfig();
    }
  }, [activeTab, isAdmin]);

  const loadAttendanceConfig = async () => {
    try {
      const response = await fetch('/api/attendance?action=debug-status');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setAttendanceConfig(data.config);
        }
      }
    } catch (error) {
      console.error('加载点名设置失败:', error);
    }
  };

  const loadClubSettings = async () => {
    try {
      const response = await fetch('/api/club-settings');
      if (response.ok) {
        const data = await response.json();
        const clubSettings: ClubSettings = {};
        if (data.aboutTitle) clubSettings.aboutTitle = data.aboutTitle;
        if (data.aboutDescription) clubSettings.aboutDescription = data.aboutDescription;
        if (data.aboutEmail) clubSettings.aboutEmail = data.aboutEmail;
        if (data.aboutLocation) clubSettings.aboutLocation = data.aboutLocation;
        if (data.aboutMeetingTime) clubSettings.aboutMeetingTime = data.aboutMeetingTime;
        if (data.website) clubSettings.website = data.website;
        if (data.logoUrl) clubSettings.logoUrl = data.logoUrl;
        if (data.heroImage) clubSettings.heroImage = data.heroImage;
        if (data.heroImageAlt) clubSettings.heroImageAlt = data.heroImageAlt;
        if (data.recruitmentStatus) clubSettings.recruitmentStatus = data.recruitmentStatus;
        if (data.activeMembers) clubSettings.activeMembers = data.activeMembers;
        if (data.yearlyActivities) clubSettings.yearlyActivities = data.yearlyActivities;
        if (data.awardProjects) clubSettings.awardProjects = data.awardProjects;
        if (data.partners) clubSettings.partners = data.partners;
        if (data.githubUrl) clubSettings.githubUrl = data.githubUrl;
        if (data.discordUrl) clubSettings.discordUrl = data.discordUrl;
        if (data.instagramUrl) clubSettings.instagramUrl = data.instagramUrl;
        if (data.youtubeUrl) clubSettings.youtubeUrl = data.youtubeUrl;
        setSettings(clubSettings);
      }
    } catch (error) {
      console.error('加载社团设置失败:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout adminName="管理员">
        <div className="flex items-center gap-3 border border-[var(--rule-strong)] px-5 py-10">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Verifying permission
          </span>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSettingChange = (field: keyof ClubSettings, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (!passwordForm.oldPassword) {
      setPasswordError('请输入当前密码');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('请输入新密码');
      return;
    }
    if (!passwordForm.confirmPassword) {
      setPasswordError('请确认新密码');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('新密码与确认密码不匹配');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码至少 6 个字符');
      return;
    }
    if (passwordForm.newPassword === passwordForm.oldPassword) {
      setPasswordError('新密码不能与当前密码相同');
      return;
    }
    setIsChangingPassword(true);
    try {
      if (!user || !('role' in user)) {
        throw new Error('无法获取管理员信息');
      }
      const adminUsername = user.username || user.email.split('@')[0];
      await changeAdminPassword(
        adminUsername,
        passwordForm.oldPassword,
        passwordForm.newPassword
      );
      setPasswordSuccess(true);
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: unknown) {
      const err = error as Error & { message?: string };
      setPasswordError(err.message || '修改密码失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/club-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const data = await response.json();
        if (data.initUrl) {
          alert(`需要初始化数据库。请访问: ${data.initUrl}`);
          window.open(data.initUrl, '_blank');
          return;
        }
        throw new Error(data.message || 'Failed to save settings');
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('保存失败:', error);
      alert(`保存失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAttendanceConfig = async () => {
    setIsSavingAttendance(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-config',
          config: attendanceConfig,
        }),
      });
      if (!response.ok) {
        throw new Error('保存失败');
      }
      setAttendanceSuccess(true);
      setTimeout(() => setAttendanceSuccess(false), 3000);
    } catch (error) {
      console.error('保存点名设置失败:', error);
      alert('保存点名设置失败');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const tabItems = [
    { key: 'about' as const, label: '关于我们', note: '01' },
    { key: 'security' as const, label: '安全设置', note: '02' },
    { key: 'attendance' as const, label: '点名设置', note: '03' },
  ];

  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="mb-7">
        <div className="eyebrow">Club Settings · 社团资料</div>
        <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
          社团设置
        </h1>
        <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
          管理社团公开资料、管理员安全设置与点名时间配置。
        </p>
      </div>

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-[var(--border)]">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px shrink-0 border-b-2 px-0.5 pb-3 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors ${
              activeTab === tab.key
                ? 'border-[var(--primary)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--foreground)]'
            }`}
          >
            <span
              className={
                activeTab === tab.key
                  ? 'mr-2 text-[var(--primary)]'
                  : 'mr-2 text-[var(--text-tertiary)]'
              }
            >
              {tab.note}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'about' && (
        <div className="max-w-3xl space-y-5">
          <Panel title="基本信息" note="01 / Identity">
            <div className="space-y-5">
              <Input
                label="社团标题"
                value={settings.aboutTitle || ''}
                onChange={(e) => handleSettingChange('aboutTitle', e.target.value)}
                placeholder="例如: 康中电脑学会"
              />
              <div>
                <label
                  htmlFor="aboutDescription"
                  className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  社团介绍
                </label>
                <textarea
                  id="aboutDescription"
                  value={settings.aboutDescription || ''}
                  onChange={(e) => handleSettingChange('aboutDescription', e.target.value)}
                  placeholder="介绍社团的内容、使命和愿景…"
                  rows={4}
                  className="w-full resize-none rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                />
              </div>
            </div>
          </Panel>

          <Panel title="联系信息" note="02 / Contact">
            <div className="space-y-5">
              <Input
                label="邮箱"
                type="email"
                value={settings.aboutEmail || ''}
                onChange={(e) => handleSettingChange('aboutEmail', e.target.value)}
                placeholder="例如: computerclub@school.edu.my"
              />
              <Input
                label="活动地点"
                value={settings.aboutLocation || ''}
                onChange={(e) => handleSettingChange('aboutLocation', e.target.value)}
                placeholder="例如: 电脑室 A304，科学楼三楼"
              />
              <Input
                label="活动时间"
                value={settings.aboutMeetingTime || ''}
                onChange={(e) => handleSettingChange('aboutMeetingTime', e.target.value)}
                placeholder="例如: 每周五 下午 4:00 - 6:00"
              />
            </div>
          </Panel>

          <Panel title="网站外观" note="03 / Appearance">
            <div className="space-y-5">
              <Input
                label="官方网站 URL"
                type="url"
                value={settings.website || ''}
                onChange={(e) => handleSettingChange('website', e.target.value)}
                placeholder="例如: https://computerclub.school.edu.my"
                hint="社团官方网站链接"
              />
              <Input
                label="Logo URL"
                type="url"
                value={settings.logoUrl || ''}
                onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                placeholder="例如: https://example.com/logo.png"
                hint="建议尺寸 200×200，支持 PNG、SVG、JPG"
              />
              {settings.logoUrl && (
                <div className="border border-[var(--border)] p-4">
                  <div className="mono-label mb-3">Logo 预览</div>
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded-[3px] border border-[var(--border)] bg-[var(--background)]">
                      <img
                        src={settings.logoUrl}
                        alt="Logo 预览"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)]">在导航栏和页脚显示</p>
                  </div>
                </div>
              )}
              <Input
                label="主页 Hero 背景图片 URL"
                type="url"
                value={settings.heroImage || ''}
                onChange={(e) => handleSettingChange('heroImage', e.target.value)}
                placeholder="例如: https://example.com/hero.jpg"
                hint="建议尺寸 1200×800，支持 PNG、JPG"
              />
              <Input
                label="Hero 图片描述文字（Alt Text）"
                value={settings.heroImageAlt || ''}
                onChange={(e) => handleSettingChange('heroImageAlt', e.target.value)}
                placeholder="例如: 电脑学会活动现场"
                hint="用于图片无法加载时显示和辅助功能"
              />
              <Input
                label="招生 / 运行状态"
                value={settings.recruitmentStatus || ''}
                onChange={(e) => handleSettingChange('recruitmentStatus', e.target.value)}
                placeholder="例如: 社团运行中 / 2026 招新中"
                hint="显示在主页 Hero 标签与 INDEX 面板底部"
              />
              {settings.heroImage && (
                <div className="border border-[var(--border)] p-4">
                  <div className="mono-label mb-3">Hero 图片预览</div>
                  <div className="overflow-hidden rounded-[3px] border border-[var(--border)] bg-[var(--background)]">
                    <img
                      src={settings.heroImage}
                      alt={settings.heroImageAlt || 'Hero 预览'}
                      className="h-48 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                    在主页顶部 Hero 区域显示
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="社团统计数据" note="04 / Numbers">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="活跃社员数"
                type="number"
                value={settings.activeMembers || 0}
                onChange={(e) => handleSettingChange('activeMembers', parseInt(e.target.value))}
              />
              <Input
                label="年度活动数"
                type="number"
                value={settings.yearlyActivities || 0}
                onChange={(e) =>
                  handleSettingChange('yearlyActivities', parseInt(e.target.value))
                }
              />
              <Input
                label="获奖项目数"
                type="number"
                value={settings.awardProjects || 0}
                onChange={(e) => handleSettingChange('awardProjects', parseInt(e.target.value))}
              />
              <Input
                label="合作伙伴数"
                type="number"
                value={settings.partners || 0}
                onChange={(e) => handleSettingChange('partners', parseInt(e.target.value))}
              />
            </div>
          </Panel>

          <Panel title="社交媒体链接" note="05 / Social">
            <div className="space-y-5">
              <Input
                label="GitHub"
                type="url"
                value={settings.githubUrl || ''}
                onChange={(e) => handleSettingChange('githubUrl', e.target.value)}
                placeholder="例如: https://github.com/computerclub"
              />
              <Input
                label="Discord"
                type="url"
                value={settings.discordUrl || ''}
                onChange={(e) => handleSettingChange('discordUrl', e.target.value)}
                placeholder="例如: https://discord.gg/computerclub"
              />
              <Input
                label="Instagram"
                type="url"
                value={settings.instagramUrl || ''}
                onChange={(e) => handleSettingChange('instagramUrl', e.target.value)}
                placeholder="例如: https://instagram.com/computerclub"
              />
              <Input
                label="YouTube"
                type="url"
                value={settings.youtubeUrl || ''}
                onChange={(e) => handleSettingChange('youtubeUrl', e.target.value)}
                placeholder="例如: https://youtube.com/@computerclub"
              />
            </div>
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={loadClubSettings}
              disabled={isSaving}
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
            >
              放弃未保存的更改
            </button>
            <Button
              onClick={handleSaveSettings}
              variant="primary"
              isLoading={isSaving}
              disabled={isSaving}
            >
              保存更改
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-3xl">
          <Panel title="修改管理员密码" note="01 / Security">
            {passwordError && (
              <div className="mb-4 border border-[var(--error)]/40 bg-[var(--error-light)] px-3.5 py-2.5">
                <p className="text-[12px] text-[var(--error)]">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-3.5 py-2.5">
                <p className="text-[12px] text-[var(--primary)]">密码修改成功</p>
              </div>
            )}
            <div className="space-y-5">
              <Input
                label="当前密码"
                type="password"
                placeholder="输入当前密码…"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))
                }
                disabled={isChangingPassword}
              />
              <Input
                label="新密码"
                type="password"
                placeholder="输入新密码…"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                disabled={isChangingPassword}
              />
              <Input
                label="确认新密码"
                type="password"
                placeholder="确认新密码…"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                disabled={isChangingPassword}
              />
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <Button
                variant="primary"
                onClick={handlePasswordChange}
                isLoading={isChangingPassword}
                disabled={isChangingPassword}
              >
                更新密码
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="max-w-3xl space-y-5">
          <Panel title="点名时间配置" note="01 / Attendance">
            {attendanceSuccess && (
              <div className="mb-4 flex items-center gap-2 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-3.5 py-2.5">
                <span className="material-symbols-outlined text-[14px] text-[var(--primary)]">
                  check_circle
                </span>
                <p className="text-[12px] text-[var(--primary)]">点名设置已保存</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="weekStartDate"
                  className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  第 1 周开始日期（学期开始）
                </label>
                <input
                  id="weekStartDate"
                  type="date"
                  value={attendanceConfig.weekStartDate || '2026-01-06'}
                  onChange={(e) =>
                    setAttendanceConfig((prev) => ({
                      ...prev,
                      weekStartDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                />
                <p className="mt-1.5 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                  系统将从此日期开始计算第 1 周、第 2 周…
                </p>
              </div>

              <div>
                <label
                  htmlFor="attendanceDay"
                  className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  每周点名日期
                </label>
                <select
                  id="attendanceDay"
                  value={attendanceConfig.dayOfWeek}
                  onChange={(e) =>
                    setAttendanceConfig((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(e.target.value),
                    }))
                  }
                  className="w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                >
                  {DAY_NAMES.map((name, index) => (
                    <option key={index} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-[var(--border)] p-4">
                <div className="mb-4 flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-[14px] font-bold text-[var(--foreground)]">
                    第一时段
                  </h3>
                  <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--warning)]">
                    Session 01
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="开始小时"
                    type="number"
                    min={0}
                    max={23}
                    value={attendanceConfig.session1Start.hour}
                    onChange={(e) =>
                      setAttendanceConfig((prev) => ({
                        ...prev,
                        session1Start: {
                          ...prev.session1Start,
                          hour: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="text-center"
                  />
                  <Input
                    label="开始分钟"
                    type="number"
                    min={0}
                    max={59}
                    value={attendanceConfig.session1Start.minute}
                    onChange={(e) =>
                      setAttendanceConfig((prev) => ({
                        ...prev,
                        session1Start: {
                          ...prev.session1Start,
                          minute: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="text-center"
                  />
                  <Input
                    label="时长（分钟）"
                    type="number"
                    min={1}
                    max={60}
                    value={attendanceConfig.session1Duration}
                    onChange={(e) =>
                      setAttendanceConfig((prev) => ({
                        ...prev,
                        session1Duration: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="text-center"
                  />
                </div>
                <p className="mt-2 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                  开放时间：{String(attendanceConfig.session1Start.hour).padStart(2, '0')}:
                  {String(attendanceConfig.session1Start.minute).padStart(2, '0')} -{' '}
                  {String(
                    attendanceConfig.session1Start.hour +
                      Math.floor(
                        (attendanceConfig.session1Start.minute +
                          attendanceConfig.session1Duration) /
                          60
                      )
                  ).padStart(2, '0')}
                  :
                  {String(
                    (attendanceConfig.session1Start.minute +
                      attendanceConfig.session1Duration) %
                      60
                  ).padStart(2, '0')}
                </p>
              </div>

              <div className="border border-[var(--border)] p-4">
                <div className="mb-4 flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-[14px] font-bold text-[var(--foreground)]">
                    第二时段
                  </h3>
                  <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
                    Session 02
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="开始小时"
                    type="number"
                    min={0}
                    max={23}
                    value={attendanceConfig.session2Start.hour}
                    onChange={(e) =>
                      setAttendanceConfig((prev) => ({
                        ...prev,
                        session2Start: {
                          ...prev.session2Start,
                          hour: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="text-center"
                  />
                  <Input
                    label="开始分钟"
                    type="number"
                    min={0}
                    max={59}
                    value={attendanceConfig.session2Start.minute}
                    onChange={(e) =>
                      setAttendanceConfig((prev) => ({
                        ...prev,
                        session2Start: {
                          ...prev.session2Start,
                          minute: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="text-center"
                  />
                  <Input
                    label="时长（分钟）"
                    type="number"
                    min={1}
                    max={60}
                    value={attendanceConfig.session2Duration}
                    onChange={(e) =>
                      setAttendanceConfig((prev) => ({
                        ...prev,
                        session2Duration: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="text-center"
                  />
                </div>
                <p className="mt-2 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                  开放时间：{String(attendanceConfig.session2Start.hour).padStart(2, '0')}:
                  {String(attendanceConfig.session2Start.minute).padStart(2, '0')} -{' '}
                  {String(
                    attendanceConfig.session2Start.hour +
                      Math.floor(
                        (attendanceConfig.session2Start.minute +
                          attendanceConfig.session2Duration) /
                          60
                      )
                  ).padStart(2, '0')}
                  :
                  {String(
                    (attendanceConfig.session2Start.minute +
                      attendanceConfig.session2Duration) %
                      60
                  ).padStart(2, '0')}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <Button
                onClick={handleSaveAttendanceConfig}
                variant="primary"
                isLoading={isSavingAttendance}
                disabled={isSavingAttendance}
              >
                保存点名设置
              </Button>
            </div>
          </Panel>

          <Panel title="当前配置预览" note="02 / Preview">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[var(--border)] p-4">
                <p className="mono-label">点名日期</p>
                <p className="mt-2 font-display text-[20px] font-bold text-[var(--foreground)]">
                  {DAY_NAMES[attendanceConfig.dayOfWeek]}
                </p>
              </div>
              <div className="border border-[var(--border)] p-4">
                <p className="mono-label">总点名时长</p>
                <p className="mt-2 font-display text-[20px] font-bold text-[var(--foreground)]">
                  {attendanceConfig.session1Duration + attendanceConfig.session2Duration} 分钟
                </p>
              </div>
              <div className="border border-[var(--border)] p-4">
                <p className="mono-label">第一时段</p>
                <p className="mt-2 font-mono text-[16px] font-semibold text-[var(--warning)]">
                  {String(attendanceConfig.session1Start.hour).padStart(2, '0')}:
                  {String(attendanceConfig.session1Start.minute).padStart(2, '0')}
                </p>
              </div>
              <div className="border border-[var(--border)] p-4">
                <p className="mono-label">第二时段</p>
                <p className="mt-2 font-mono text-[16px] font-semibold text-[var(--primary)]">
                  {String(attendanceConfig.session2Start.hour).padStart(2, '0')}:
                  {String(attendanceConfig.session2Start.minute).padStart(2, '0')}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 border border-[var(--primary)]/40 bg-[var(--surface)] px-4 py-3">
          <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
            check_circle
          </span>
          <p className="text-[12px] text-[var(--foreground)]">设置保存成功</p>
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            aria-label="关闭成功提示"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
