'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterLink {
  label: string;
  href: string;
  icon?: string;
}

interface SocialLink {
  platform: 'github' | 'discord' | 'instagram' | 'youtube' | 'email';
  href: string;
  label?: string;
}

interface ClubSettings {
  aboutTitle?: string;
  aboutDescription?: string;
  aboutEmail?: string;
  aboutLocation?: string;
  aboutMeetingTime?: string;
  githubUrl?: string;
  discordUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}

interface FooterProps {
  className?: string;
}

const defaultQuickLinks: FooterLink[] = [
  { label: '关于我们', href: '/about', icon: 'info' },
  { label: '公告通知', href: '/notices', icon: 'campaign' },
  { label: '活动列表', href: '/activities', icon: 'event' },
  { label: '项目展示', href: '/projects', icon: 'folder' },
];

const defaultResourceLinks: FooterLink[] = [
  { label: '签到系统', href: '/attendance', icon: 'event_available' },
  { label: '群聊讨论', href: '/chat', icon: 'chat' },
  { label: '提交项目', href: '/projects/submit', icon: 'lightbulb' },
  { label: '开发者教程', href: '/tutorial', icon: 'school' },
  { label: '帮助中心', href: '/help', icon: 'help' },
];

const SocialIcon = ({ platform }: { platform: SocialLink['platform'] }) => {
  switch (platform) {
    case 'github':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      );
    case 'discord':
      return <span className="material-symbols-outlined text-[20px]">forum</span>;
    case 'instagram':
      return <span className="material-symbols-outlined text-[20px]">photo_camera</span>;
    case 'youtube':
      return <span className="material-symbols-outlined text-[20px]">play_circle</span>;
    case 'email':
      return <span className="material-symbols-outlined text-[20px]">mail</span>;
    default:
      return null;
  }
};

export function Footer({ className }: FooterProps) {
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/club-settings');
        if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            setSettings(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch club settings for footer:', error);
      }
    }
    fetchSettings();
  }, []);

  const clubName = settings?.aboutTitle || '康中电脑学会';
  const description = settings?.aboutDescription || '培养学生编程能力和创新思维，推动校园信息技术教育。加入我们，一起探索技术的无限可能。';
  const email = settings?.aboutEmail || 'computerclub@kuencheng.edu.my';
  const address = settings?.aboutLocation || '电脑室 A304，科学楼三楼';
  const meetingTime = settings?.aboutMeetingTime || '每周五 16:00 - 18:00';

  const socialLinks: SocialLink[] = [];
  if (settings?.githubUrl) {
    socialLinks.push({ platform: 'github', href: settings.githubUrl, label: 'GitHub' });
  }
  if (settings?.discordUrl) {
    socialLinks.push({ platform: 'discord', href: settings.discordUrl, label: 'Discord' });
  }
  if (settings?.instagramUrl) {
    socialLinks.push({ platform: 'instagram', href: settings.instagramUrl, label: 'Instagram' });
  }
  if (settings?.youtubeUrl) {
    socialLinks.push({ platform: 'youtube', href: settings.youtubeUrl, label: 'YouTube' });
  }
  if (socialLinks.length === 0) {
    socialLinks.push(
      { platform: 'github', href: 'https://github.com', label: 'GitHub' },
      { platform: 'discord', href: 'https://discord.gg', label: 'Discord' },
      { platform: 'instagram', href: 'https://instagram.com', label: 'Instagram' },
      { platform: 'youtube', href: 'https://youtube.com', label: 'YouTube' }
    );
  }

  return (
    <footer
      className={cn(
        'border-t border-gray-200 dark:border-[#283930]',
        'bg-gray-50 dark:bg-[#0d1812]',
        'mt-12',
        className
      )}
    >
      <div className="mx-auto max-w-300 px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20">
                <span className="text-primary font-black text-lg">KC</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {clubName}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kuen Cheng Computer Club
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.href}
                  title={link.label || link.platform}
                  className={cn(
                    'w-10 h-10 rounded-xl',
                    'bg-gray-200 dark:bg-[#1a2c23]',
                    'flex items-center justify-center',
                    'text-gray-600 dark:text-gray-300',
                    'hover:bg-primary hover:text-black dark:hover:text-black',
                    'transition-all duration-300'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              快速链接
            </h3>
            <ul className="space-y-3">
              {defaultQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    {link.icon && (
                      <span className="material-symbols-outlined text-[16px] opacity-50 group-hover:opacity-100 transition-opacity">
                        {link.icon}
                      </span>
                    )}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              资源
            </h3>
            <ul className="space-y-3">
              {defaultResourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    {link.icon && (
                      <span className="material-symbols-outlined text-[16px] opacity-50 group-hover:opacity-100 transition-opacity">
                        {link.icon}
                      </span>
                    )}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              联系我们
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors group"
                >
                  <span className="material-symbols-outlined text-[18px] mt-0.5 text-primary/50 group-hover:text-primary">
                    mail
                  </span>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">邮箱</p>
                    <p className="text-sm font-medium">{email}</p>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined text-[18px] mt-0.5 text-primary/50">
                  location_on
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">地址</p>
                  <p className="text-sm font-medium">{address}</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined text-[18px] mt-0.5 text-primary/50">
                  schedule
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">活动时间</p>
                  <p className="text-sm font-medium">{meetingTime}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-[#283930]">
        <div className="mx-auto max-w-300 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <span>© {currentYear} {clubName}</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline">保留所有权利</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                隐私政策
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                使用条款
              </Link>
              <span className="text-gray-400 dark:text-gray-600">
                用 💚 在马来西亚制作
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
