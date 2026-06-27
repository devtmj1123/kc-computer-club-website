'use client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useRouter } from 'next/navigation';
interface ClubSettings {
  clubName: string;
  description: string;
  email: string;
  location: string;
  meetingTime: string;
  phone: string;
  website: string;
  facebook: string;
  twitter: string;
  instagram: string;
  discord: string;
  logoUrl: string;
  faviconUrl: string;
  noticeCardLogoUrl: string;
  activityCardLogoUrl: string;
  projectCardLogoUrl: string;
  cardLogoLink: string;
}
const defaultSettings: ClubSettings = {
  clubName: '康中电脑学会',
  description: '我们是一群热爱科技的学生，致力于探索编程、人工智能、网络安全等领域。',
  email: 'computerclub@school.edu.my',
  location: '电脑室 A304，科学楼三楼',
  meetingTime: '每周五 下午 4:00 - 6:00',
  phone: '+60 1-XXXX-XXXX',
  website: 'https://computerclub.school.edu.my',
  facebook: 'https://facebook.com/computerclub',
  twitter: 'https://twitter.com/computerclub',
  instagram: 'https://instagram.com/computerclub',
  discord: 'https://discord.gg/computerclub',
  logoUrl: '',
  faviconUrl: '',
  noticeCardLogoUrl: '',
  activityCardLogoUrl: '',
  projectCardLogoUrl: '',
  cardLogoLink: '/club-settings',
};
export default function ClubSettings() {
  const { user, isLoading } = useAuth();
  const { updateClubInfo } = useClub();
  const router = useRouter();
  const [settings, setSettings] = useState<ClubSettings>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'appearance' | 'advanced'>('basic');
  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);
  const handleInputChange = (field: keyof ClubSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    updateClubInfo({
      logoUrl: settings.logoUrl,
      clubName: settings.clubName,
    });
    setIsSaving(false);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  const handleCancel = () => {
    setSettings(defaultSettings);
    setIsEditing(false);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <Header />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
          </div>
        </main>
      </div>
    );
  }
  if (!user || !('role' in user) || user.role !== 'admin') {
    return null;
  }
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Header />
      <main className="grow py-8 px-4 md:px-10 lg:px-20">
        <div className="max-w-300 mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: 'var(--foreground)' }}>社团设置</h1>
            <p style={{ color: 'var(--text-secondary)' }}>管理社团信息和联系方式</p>
          </div>
          {showSuccess && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
              <span className="material-symbols-outlined">check_circle</span>
              <p className="text-sm">设置已成功保存！</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="rounded-xl border p-4 sticky top-24" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="space-y-2">
                  {[
                    { id: 'basic', label: '基本信息', icon: 'info' },
                    { id: 'social', label: '社交媒体', icon: 'share' },
                    { id: 'appearance', label: '网站外观', icon: 'palette' },
                    { id: 'advanced', label: '高级选项', icon: 'settings' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <span className="material-symbols-outlined">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="rounded-xl border p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>基本信息</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>编辑社团的基本信息</p>
                      </div>
                      <Button
                        variant={isEditing ? 'secondary' : 'primary'}
                        size="sm"
                        rightIcon={isEditing ? 'close' : 'edit'}
                        onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
                      >
                        {isEditing ? '取消' : '编辑'}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>社团名称</label>
                        <Input
                          value={settings.clubName}
                          onChange={(e) => handleInputChange('clubName', e.target.value)}
                          disabled={!isEditing}
                          leftIcon="groups"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>社团描述</label>
                        <textarea
                          className="w-full rounded-xl border p-4 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 outline-none transition-all resize-none"
                          style={{ 
                            borderColor: 'var(--border)',
                            backgroundColor: 'var(--input-bg)',
                            color: 'var(--foreground)',
                          }}
                          placeholder="输入社团描述..."
                          rows={4}
                          value={settings.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>邮箱地址</label>
                        <Input type="email" value={settings.email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={!isEditing} leftIcon="mail" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>电话号码</label>
                        <Input type="tel" value={settings.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} leftIcon="phone" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>社团地点</label>
                        <Input value={settings.location} onChange={(e) => handleInputChange('location', e.target.value)} disabled={!isEditing} leftIcon="location_on" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>活动时间</label>
                        <Input value={settings.meetingTime} onChange={(e) => handleInputChange('meetingTime', e.target.value)} disabled={!isEditing} leftIcon="schedule" />
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <Button variant="secondary" onClick={handleCancel} className="flex-1">取消</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={isSaving} rightIcon="check" className="flex-1">保存更改</Button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>社交媒体</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>管理社交媒体链接</p>
                      </div>
                      <Button variant={isEditing ? 'secondary' : 'primary'} size="sm" rightIcon={isEditing ? 'close' : 'edit'} onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}>
                        {isEditing ? '取消' : '编辑'}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {[
                        { field: 'website', label: '官方网站', icon: 'language' },
                        { field: 'facebook', label: 'Facebook', icon: 'groups' },
                        { field: 'twitter', label: 'Twitter / X', icon: 'public' },
                        { field: 'instagram', label: 'Instagram', icon: 'photo_camera' },
                        { field: 'discord', label: 'Discord 服务器', icon: 'forum' },
                      ].map((item) => (
                        <div key={item.field}>
                          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{item.label}</label>
                          <Input
                            type="url"
                            value={settings[item.field as keyof ClubSettings] as string}
                            onChange={(e) => handleInputChange(item.field as keyof ClubSettings, e.target.value)}
                            disabled={!isEditing}
                            leftIcon={item.icon}
                          />
                        </div>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <Button variant="secondary" onClick={handleCancel} className="flex-1">取消</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={isSaving} rightIcon="check" className="flex-1">保存更改</Button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>网站外观</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>自定义网站图标和外观</p>
                      </div>
                      <Button variant={isEditing ? 'secondary' : 'primary'} size="sm" rightIcon={isEditing ? 'close' : 'edit'} onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}>
                        {isEditing ? '取消' : '编辑'}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>官方网站</label>
                        <Input type="url" value={settings.website} onChange={(e) => handleInputChange('website', e.target.value)} disabled={!isEditing} leftIcon="language" placeholder="https://example.com" />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>社团官方网站 URL</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>网站 Logo 链接</label>
                        <Input type="url" value={settings.logoUrl} onChange={(e) => handleInputChange('logoUrl', e.target.value)} disabled={!isEditing} leftIcon="image" placeholder="https://example.com/logo.png" />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>建议尺寸：200x200 像素，支持 PNG、SVG、JPG 格式</p>
                      </div>
                      {settings.logoUrl && (
                        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-hover)', borderColor: 'var(--border)' }}>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Logo 预览</p>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
                              <img src={settings.logoUrl} alt="Logo 预览" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <p>在导航栏和页脚显示</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--info)', opacity: 0.15, borderColor: 'var(--info)' }}>
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined" style={{ color: 'var(--info)' }}>info</span>
                          <div className="text-sm">
                            <p className="font-medium mb-1" style={{ color: 'var(--info)' }}>提示</p>
                            <p style={{ color: 'var(--text-secondary)' }}>如果没有设置图标，网站将显示默认的文字标识 "KC"。建议使用可公开访问的图片链接。</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <Button variant="secondary" onClick={handleCancel} className="flex-1">取消</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={isSaving} rightIcon="check" className="flex-1">保存更改</Button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>高级选项</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>更多社团管理功能</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { title: '导入/导出社团数据', desc: '备份或导出社团的所有信息', icon: 'download', action: '导出' },
                        { title: '通知设置', desc: '配置系统通知的发送方式', icon: 'notifications', action: '配置' },
                        { title: '成员管理', desc: '管理社团的领导团队和主要成员', icon: 'group', action: '管理' },
                        { title: '活动日志', desc: '查看社团的所有重要操作记录', icon: 'history', action: '查看' },
                      ].map((item) => (
                        <div key={item.title} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-hover)', borderColor: 'var(--border)' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>{item.title}</h4>
                              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                            </div>
                            <Button variant="secondary" size="sm" rightIcon={item.icon}>{item.action}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}