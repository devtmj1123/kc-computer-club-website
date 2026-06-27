'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { changeAdminPassword, getAdminSessions, logoutOtherSession } from '@/services/auth.service';
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
export default function AdminSettings() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<ClubSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'security' | 'api' | 'attendance'>('about');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [adminSessions, setAdminSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([
    {
      id: 'key_1',
      name: '默认密钥',
      key: 'sk_live_' + 'x'.repeat(28),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    },
  ]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState({
    'notice.published': true,
    'activity.created': true,
    'comment.posted': true,
  });
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfig>(DEFAULT_ATTENDANCE_CONFIG);
  const [debugMode, setDebugMode] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router]);
  useEffect(() => {
    if (activeTab === 'security' && isAdmin && !isLoadingSessions) {
      loadSessions();
    }
  }, [activeTab, isAdmin]);
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
        setDebugMode(data.debugMode || false);
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
  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const sessions = await getAdminSessions();
      setAdminSessions(sessions);
    } catch (error) {
      console.error('加载会话失败:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };
  if (isLoading) {
    return (
      <AdminLayout adminName="管理员">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
            <p className="mt-4 text-gray-400">正在验证权限...</p>
          </div>
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
  const handleLogoutSession = async (sessionId: string) => {
    try {
      await logoutOtherSession(sessionId);
      await loadSessions();
    } catch (error) {
      console.error('登出会话失败:', error);
    }
  };
  const generateNewApiKey = () => {
    const newKey = {
      id: 'key_' + Date.now(),
      name: '新密钥 ' + (apiKeys.length + 1),
      key: 'sk_live_' + Math.random().toString(36).substring(2, 30),
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    setApiKeys([...apiKeys, newKey]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  const deleteApiKey = (keyId: string) => {
    if (confirm('确定要删除此 API 密钥吗？')) {
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  };
  const handleSaveWebhook = async () => {
    if (!webhookUrl) {
      alert('请输入 Webhook URL');
      return;
    }
    try {
      new URL(webhookUrl);
    } catch {
      alert('请输入有效的 Webhook URL');
      return;
    }
    setIsSavingWebhook(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (error) {
      alert('保存 Webhook 失败');
    } finally {
      setIsSavingWebhook(false);
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
      localStorage.setItem('clubSettings', JSON.stringify(settings));
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
  const handleToggleDebugMode = async () => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-debug',
          enabled: !debugMode,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setDebugMode(data.debugMode);
      }
    } catch (error) {
      console.error('切换调试模式失败:', error);
    }
  };
  return (
    <AdminLayout adminName="管理员">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">社团设置</h1>
        <p className="text-gray-400">管理社团信息、安全设置和 API 密钥。</p>
      </div>
      <div className="mb-6 flex gap-2 border-b border-[#283946]">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'about'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          关于我们
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          安全设置
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'api'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          API 设置
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'attendance'
              ? 'border-[#137fec] text-[#137fec]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          点名设置
        </button>
      </div>
      {activeTab === 'about' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <label htmlFor="aboutTitle" className="block text-white font-semibold mb-3">
              社团标题
            </label>
            <Input
              id="aboutTitle"
              value={settings.aboutTitle || ''}
              onChange={(e) => handleSettingChange('aboutTitle', e.target.value)}
              placeholder="例如: 康中电脑学会"
            />
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <label htmlFor="aboutDescription" className="block text-white font-semibold mb-3">
              社团介绍
            </label>
            <textarea
              id="aboutDescription"
              value={settings.aboutDescription || ''}
              onChange={(e) => handleSettingChange('aboutDescription', e.target.value)}
              placeholder="介绍社团的内容、使命和愿景..."
              rows={4}
              className="w-full bg-[#1f2d39] border border-[#283946] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#137fec] transition-colors resize-none"
            />
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">联系信息</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="aboutEmail" className="block text-gray-400 text-sm font-medium mb-2">
                  邮箱
                </label>
                <Input
                  id="aboutEmail"
                  type="email"
                  value={settings.aboutEmail || ''}
                  onChange={(e) => handleSettingChange('aboutEmail', e.target.value)}
                  placeholder="例如: computerclub@school.edu.my"
                />
              </div>
              <div>
                <label htmlFor="aboutLocation" className="block text-gray-400 text-sm font-medium mb-2">
                  活动地点
                </label>
                <Input
                  id="aboutLocation"
                  value={settings.aboutLocation || ''}
                  onChange={(e) => handleSettingChange('aboutLocation', e.target.value)}
                  placeholder="例如: 电脑室 A304，科学楼三楼"
                />
              </div>
              <div>
                <label htmlFor="aboutMeetingTime" className="block text-gray-400 text-sm font-medium mb-2">
                  活动时间
                </label>
                <Input
                  id="aboutMeetingTime"
                  value={settings.aboutMeetingTime || ''}
                  onChange={(e) => handleSettingChange('aboutMeetingTime', e.target.value)}
                  placeholder="例如: 每周五 下午 4:00 - 6:00"
                />
              </div>
            </div>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">网站外观</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="website" className="block text-gray-400 text-sm font-medium mb-2">
                  官方网站 URL
                </label>
                <Input
                  id="website"
                  type="url"
                  value={settings.website || ''}
                  onChange={(e) => handleSettingChange('website', e.target.value)}
                  placeholder="例如: https://computerclub.school.edu.my"
                />
                <p className="text-gray-500 text-xs mt-1">社团官方网站链接</p>
              </div>
              <div>
                <label htmlFor="logoUrl" className="block text-gray-400 text-sm font-medium mb-2">
                  Logo URL
                </label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={settings.logoUrl || ''}
                  onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                  placeholder="例如: https://example.com/logo.png"
                />
                <p className="text-gray-500 text-xs mt-1">建议尺寸：200x200 像素，支持 PNG、SVG、JPG 格式</p>
              </div>
              {settings.logoUrl && (
                <div className="p-4 bg-[#1f2d39] rounded-lg border border-[#283946]">
                  <p className="text-gray-400 text-sm mb-3">Logo 预览</p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#0d1117] flex items-center justify-center overflow-hidden">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo 预览" 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>在导航栏和页脚显示</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="heroImage" className="block text-gray-400 text-sm font-medium mb-2">
                  主页 Hero 背景图片 URL
                </label>
                <Input
                  id="heroImage"
                  type="url"
                  value={settings.heroImage || ''}
                  onChange={(e) => handleSettingChange('heroImage', e.target.value)}
                  placeholder="例如: https://example.com/hero.jpg"
                />
                <p className="text-gray-500 text-xs mt-1">建议尺寸：1200x800 像素，支持 PNG、JPG 格式</p>
              </div>
              <div>
                <label htmlFor="heroImageAlt" className="block text-gray-400 text-sm font-medium mb-2">
                  Hero 图片描述文字（Alt Text）
                </label>
                <Input
                  id="heroImageAlt"
                  value={settings.heroImageAlt || ''}
                  onChange={(e) => handleSettingChange('heroImageAlt', e.target.value)}
                  placeholder="例如: 电脑学会活动现场"
                />
                <p className="text-gray-500 text-xs mt-1">用于图片无法加载时显示和辅助功能</p>
              </div>
              {settings.heroImage && (
                <div className="p-4 bg-[#1f2d39] rounded-lg border border-[#283946]">
                  <p className="text-gray-400 text-sm mb-3">Hero 图片预览</p>
                  <div className="rounded-lg overflow-hidden bg-[#0d1117]">
                    <img 
                      src={settings.heroImage} 
                      alt={settings.heroImageAlt || 'Hero 预览'} 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    <p>在主页顶部 Hero 区域显示</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">社团统计数据</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="activeMembers" className="block text-gray-400 text-sm font-medium mb-2">
                  活跃社员数
                </label>
                <Input
                  id="activeMembers"
                  type="number"
                  value={settings.activeMembers || 0}
                  onChange={(e) => handleSettingChange('activeMembers', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="yearlyActivities" className="block text-gray-400 text-sm font-medium mb-2">
                  年度活动数
                </label>
                <Input
                  id="yearlyActivities"
                  type="number"
                  value={settings.yearlyActivities || 0}
                  onChange={(e) => handleSettingChange('yearlyActivities', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="awardProjects" className="block text-gray-400 text-sm font-medium mb-2">
                  获奖项目数
                </label>
                <Input
                  id="awardProjects"
                  type="number"
                  value={settings.awardProjects || 0}
                  onChange={(e) => handleSettingChange('awardProjects', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="partners" className="block text-gray-400 text-sm font-medium mb-2">
                  合作伙伴数
                </label>
                <Input
                  id="partners"
                  type="number"
                  value={settings.partners || 0}
                  onChange={(e) => handleSettingChange('partners', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">社交媒体链接</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="githubUrl" className="block text-gray-400 text-sm font-medium mb-2">
                  GitHub
                </label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={settings.githubUrl || ''}
                  onChange={(e) => handleSettingChange('githubUrl', e.target.value)}
                  placeholder="例如: https://github.com/computerclub"
                />
              </div>
              <div>
                <label htmlFor="discordUrl" className="block text-gray-400 text-sm font-medium mb-2">
                  Discord
                </label>
                <Input
                  id="discordUrl"
                  type="url"
                  value={settings.discordUrl || ''}
                  onChange={(e) => handleSettingChange('discordUrl', e.target.value)}
                  placeholder="例如: https://discord.gg/computerclub"
                />
              </div>
              <div>
                <label htmlFor="instagramUrl" className="block text-gray-400 text-sm font-medium mb-2">
                  Instagram
                </label>
                <Input
                  id="instagramUrl"
                  type="url"
                  value={settings.instagramUrl || ''}
                  onChange={(e) => handleSettingChange('instagramUrl', e.target.value)}
                  placeholder="例如: https://instagram.com/computerclub"
                />
              </div>
              <div>
                <label htmlFor="youtubeUrl" className="block text-gray-400 text-sm font-medium mb-2">
                  YouTube
                </label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={settings.youtubeUrl || ''}
                  onChange={(e) => handleSettingChange('youtubeUrl', e.target.value)}
                  placeholder="例如: https://youtube.com/@computerclub"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveSettings}
              variant="primary"
              className="bg-[#137fec]! hover:bg-[#0f5fcc]"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存更改'}
            </Button>
            <Button variant="secondary">取消</Button>
          </div>
        </div>
      )}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">修改密码</h3>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">✓ 密码修改成功！</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="oldPassword" className="block text-gray-400 text-sm font-medium mb-2">
                  当前密码
                </label>
                <Input
                  id="oldPassword"
                  type="password"
                  placeholder="输入当前密码..."
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  disabled={isChangingPassword}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-gray-400 text-sm font-medium mb-2">
                  新密码
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="输入新密码..."
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={isChangingPassword}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-400 text-sm font-medium mb-2">
                  确认新密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="确认新密码..."
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={isChangingPassword}
                />
              </div>
            </div>
            <Button 
              className="mt-4 bg-[#137fec]! hover:bg-[#0f5fcc]" 
              variant="primary"
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? '修改中...' : '更新密码'}
            </Button>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">两步验证</h3>
              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
                已启用
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              使用认证器应用程序增加帐户安全性。
            </p>
            <Button variant="secondary" disabled>暂未开放</Button>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">活跃会话</h3>
            {isLoadingSessions ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#137fec]"></div>
              </div>
            ) : adminSessions.length > 0 ? (
              <div className="space-y-3">
                {adminSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-[#1f2d39] rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{session.device} - {session.browser}</p>
                      <p className="text-gray-400 text-xs">{session.ip} - {session.location}</p>
                      <p className="text-gray-500 text-xs mt-1">最后活动: {new Date(session.lastActive).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.isCurrent && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">当前设备</span>
                      )}
                      {!session.isCurrent && (
                        <button 
                          onClick={() => handleLogoutSession(session.id)}
                          className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                        >
                          登出
                        </button>
                      )}
                      {session.isCurrent && (
                        <span className="text-xs text-green-400 font-medium">活跃</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无活跃会话</p>
            )}
          </div>
        </div>
      )}
      {activeTab === 'api' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">API 密钥管理</h3>
            <p className="text-gray-400 text-sm mb-6">
              使用 API 密钥在程序中访问 API。请妥善保管密钥，不要在任何地方共享。
            </p>
            <div className="space-y-3 mb-6">
              {apiKeys.length > 0 ? (
                apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="flex items-center justify-between p-4 bg-[#1f2d39] rounded-lg border border-[#283946]">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium mb-1">{apiKey.name}</p>
                      <p className="text-gray-500 text-xs font-mono break-all">{apiKey.key}</p>
                      <p className="text-gray-600 text-xs mt-2">
                        创建于: {new Date(apiKey.createdAt).toLocaleString()}
                        {apiKey.lastUsed && ` | 最后使用: ${new Date(apiKey.lastUsed).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="p-2 hover:bg-[#283946] text-gray-400 hover:text-blue-400 rounded-lg transition-colors"
                        title="复制密钥"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      <button 
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="p-2 hover:bg-[#283946] text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        title="删除密钥"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm py-4">暂无 API 密钥</p>
              )}
            </div>
            <Button 
              variant="primary"
              className="bg-[#137fec]! hover:bg-[#0f5fcc]"
              onClick={generateNewApiKey}
            >
              生成新密钥
            </Button>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Webhook 配置</h3>
            {webhookSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">✓ Webhook 配置已保存！</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="webhookUrl" className="block text-gray-400 text-sm font-medium mb-2">
                  Webhook URL
                </label>
                <Input
                  id="webhookUrl"
                  placeholder="https://example.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  disabled={isSavingWebhook}
                />
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm font-medium">订阅事件</p>
                <div className="space-y-2">
                  {Object.entries(webhookEvents).map(([event, enabled]) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="cursor-pointer"
                        checked={enabled}
                        onChange={(e) => setWebhookEvents(prev => ({
                          ...prev,
                          [event]: e.target.checked
                        }))}
                        disabled={isSavingWebhook}
                      />
                      <span className="text-gray-300 text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <Button 
              className="mt-4 bg-[#137fec]! hover:bg-[#0f5fcc]" 
              variant="primary"
              onClick={handleSaveWebhook}
              disabled={isSavingWebhook}
            >
              {isSavingWebhook ? '保存中...' : '保存 Webhook'}
            </Button>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">API 文档</h3>
            <p className="text-gray-400 text-sm mb-4">
              查看我们的 API 文档了解如何集成和使用 API。
            </p>
            <Button 
              variant="secondary"
              onClick={() => window.open('/api/docs', '_blank')}
            >
              查看 API 文档
            </Button>
          </div>
        </div>
      )}
      {activeTab === 'attendance' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#137fec] text-2xl">schedule</span>
              <h3 className="text-white font-semibold text-lg">点名时间配置</h3>
            </div>
            {attendanceSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                <p className="text-green-400 text-sm">点名设置已保存！</p>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  第1周开始日期（学期开始）
                </label>
                <input
                  type="date"
                  value={attendanceConfig.weekStartDate || '2026-01-06'}
                  onChange={(e) => setAttendanceConfig(prev => ({
                    ...prev,
                    weekStartDate: e.target.value
                  }))}
                  className="w-full bg-[#1f2d39] border border-[#283946] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#137fec] transition-colors"
                />
                <p className="text-gray-500 text-xs mt-2">
                  系统将从此日期开始计算第1周、第2周...
                </p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  每周点名日期
                </label>
                <select
                  value={attendanceConfig.dayOfWeek}
                  onChange={(e) => setAttendanceConfig(prev => ({
                    ...prev,
                    dayOfWeek: parseInt(e.target.value)
                  }))}
                  className="w-full bg-[#1f2d39] border border-[#283946] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#137fec] transition-colors"
                >
                  {DAY_NAMES.map((name, index) => (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-[#1f2d39] rounded-xl border border-[#283946]">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-sm">schedule</span>
                  第一时段
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">开始小时</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={attendanceConfig.session1Start.hour}
                      onChange={(e) => setAttendanceConfig(prev => ({
                        ...prev,
                        session1Start: { ...prev.session1Start, hour: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#0d1117] border border-[#283946] rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-[#137fec]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">开始分钟</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={attendanceConfig.session1Start.minute}
                      onChange={(e) => setAttendanceConfig(prev => ({
                        ...prev,
                        session1Start: { ...prev.session1Start, minute: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#0d1117] border border-[#283946] rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-[#137fec]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">时长（分钟）</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={attendanceConfig.session1Duration}
                      onChange={(e) => setAttendanceConfig(prev => ({
                        ...prev,
                        session1Duration: parseInt(e.target.value) || 5
                      }))}
                      className="w-full bg-[#0d1117] border border-[#283946] rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-[#137fec]"
                    />
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  开放时间：{String(attendanceConfig.session1Start.hour).padStart(2, '0')}:{String(attendanceConfig.session1Start.minute).padStart(2, '0')} - {String(attendanceConfig.session1Start.hour + Math.floor((attendanceConfig.session1Start.minute + attendanceConfig.session1Duration) / 60)).padStart(2, '0')}:{String((attendanceConfig.session1Start.minute + attendanceConfig.session1Duration) % 60).padStart(2, '0')}
                </p>
              </div>
              <div className="p-4 bg-[#1f2d39] rounded-xl border border-[#283946]">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-sm">schedule</span>
                  第二时段
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">开始小时</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={attendanceConfig.session2Start.hour}
                      onChange={(e) => setAttendanceConfig(prev => ({
                        ...prev,
                        session2Start: { ...prev.session2Start, hour: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#0d1117] border border-[#283946] rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-[#137fec]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">开始分钟</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={attendanceConfig.session2Start.minute}
                      onChange={(e) => setAttendanceConfig(prev => ({
                        ...prev,
                        session2Start: { ...prev.session2Start, minute: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#0d1117] border border-[#283946] rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-[#137fec]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">时长（分钟）</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={attendanceConfig.session2Duration}
                      onChange={(e) => setAttendanceConfig(prev => ({
                        ...prev,
                        session2Duration: parseInt(e.target.value) || 5
                      }))}
                      className="w-full bg-[#0d1117] border border-[#283946] rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-[#137fec]"
                    />
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  开放时间：{String(attendanceConfig.session2Start.hour).padStart(2, '0')}:{String(attendanceConfig.session2Start.minute).padStart(2, '0')} - {String(attendanceConfig.session2Start.hour + Math.floor((attendanceConfig.session2Start.minute + attendanceConfig.session2Duration) / 60)).padStart(2, '0')}:{String((attendanceConfig.session2Start.minute + attendanceConfig.session2Duration) % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSaveAttendanceConfig}
              variant="primary"
              className="mt-6 bg-[#137fec]! hover:bg-[#0f5fcc]"
              disabled={isSavingAttendance}
            >
              {isSavingAttendance ? '保存中...' : '保存点名设置'}
            </Button>
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-amber-400 text-2xl">bug_report</span>
              <h3 className="text-white font-semibold text-lg">调试模式</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              启用调试模式后，学生可以在任何时间进行点名测试，不受时间限制。
            </p>
            <div className="flex items-center justify-between p-4 bg-[#1f2d39] rounded-xl border border-[#283946]">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${debugMode ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-white font-medium">
                  调试模式 {debugMode ? '已开启' : '已关闭'}
                </span>
              </div>
              <button
                onClick={handleToggleDebugMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  debugMode
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                    : 'bg-[#283946] text-gray-400 hover:bg-[#3a4a56] hover:text-white'
                }`}
              >
                {debugMode ? '关闭' : '开启'}
              </button>
            </div>
            {debugMode && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  调试模式已开启，学生可在任何时间点名。请在测试完成后关闭。
                </p>
              </div>
            )}
          </div>
          <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#137fec] text-2xl">analytics</span>
              <h3 className="text-white font-semibold text-lg">当前配置预览</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#1f2d39] rounded-xl">
                <p className="text-gray-400 text-sm mb-1">点名日期</p>
                <p className="text-white text-xl font-bold">{DAY_NAMES[attendanceConfig.dayOfWeek]}</p>
              </div>
              <div className="p-4 bg-[#1f2d39] rounded-xl">
                <p className="text-gray-400 text-sm mb-1">总点名时长</p>
                <p className="text-white text-xl font-bold">{attendanceConfig.session1Duration + attendanceConfig.session2Duration} 分钟</p>
              </div>
              <div className="p-4 bg-[#1f2d39] rounded-xl">
                <p className="text-gray-400 text-sm mb-1">第一时段</p>
                <p className="text-amber-400 text-lg font-bold">
                  {String(attendanceConfig.session1Start.hour).padStart(2, '0')}:{String(attendanceConfig.session1Start.minute).padStart(2, '0')}
                </p>
              </div>
              <div className="p-4 bg-[#1f2d39] rounded-xl">
                <p className="text-gray-400 text-sm mb-1">第二时段</p>
                <p className="text-blue-400 text-lg font-bold">
                  {String(attendanceConfig.session2Start.hour).padStart(2, '0')}:{String(attendanceConfig.session2Start.minute).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div className="flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xl bg-green-500/20 border-green-500/30">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <p className="text-sm text-white">设置保存成功！</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}