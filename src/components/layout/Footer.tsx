'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterLink {
  label: string;
  href: string;
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

const quickLinks: FooterLink[] = [
  { label: '关于我们', href: '/about' },
  { label: '公告通知', href: '/notices' },
  { label: '活动列表', href: '/activities' },
  { label: '项目展示', href: '/projects' },
];

const resourceLinks: FooterLink[] = [
  { label: '签到系统', href: '/attendance' },
  { label: '提交项目', href: '/projects/submit' },
  { label: '开发者教程', href: '/tutorial' },
  { label: '成员登录', href: '/auth/login' },
];

const SocialIcon = ({ platform }: { platform: SocialLink['platform'] }) => {
  switch (platform) {
    case 'github':
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      );
    case 'discord':
      return <span className="material-symbols-outlined text-[17px]">forum</span>;
    case 'instagram':
      return <span className="material-symbols-outlined text-[17px]">photo_camera</span>;
    case 'youtube':
      return <span className="material-symbols-outlined text-[17px]">play_circle</span>;
    case 'email':
      return <span className="material-symbols-outlined text-[17px]">mail</span>;
    default:
      return null;
  }
};

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="mono-label mb-4 text-[var(--text-tertiary)]">{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center justify-between border-b border-[var(--border)] py-2.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
            >
              <span>{link.label}</span>
              <span className="text-[12px] text-[var(--text-tertiary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--primary)]">
                ↗
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  const clubName = settings?.aboutTitle || '坤成中学电脑学会';
  const description =
    settings?.aboutDescription ||
    '培养学生编程能力与创新思维，推动校园信息技术教育。加入我们，一起探索技术的无限可能。';
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

  return (
    <footer className={cn('mt-20 border-t border-[var(--rule-strong)] bg-transparent', className)}>
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:pr-12">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center bg-[var(--primary)] font-mono text-[12px] font-semibold tracking-[0.04em] text-[var(--primary-contrast)]">
                KC
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-[17px] font-bold leading-none tracking-[0.01em] text-[var(--foreground)]">
                  {clubName}
                </span>
                <span className="font-mono text-[12px] leading-none tracking-[0.18em] text-[var(--text-tertiary)]">
                  KUEN CHENG COMPUTER CLUB · EST. 1983
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-[13px] leading-[1.9] text-[var(--text-secondary)]">
              {description}
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-7 flex items-center gap-2.5">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.href}
                    title={link.label || link.platform}
                    className="flex size-9 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="站点 / Index" links={quickLinks} />
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="资源 / Resources" links={resourceLinks} />
          </div>

          <div className="lg:col-span-3">
            <h3 className="mono-label mb-4 text-[var(--text-tertiary)]">联系 / Contact</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="group flex items-start gap-3 border-b border-[var(--border)] pb-3.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
                >
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--primary)]">
                    mail
                  </span>
                  <span>
                    <span className="mb-1 block font-mono text-[12px] tracking-[0.12em] text-[var(--text-tertiary)]">
                      邮箱
                    </span>
                    <span className="block text-[13px] font-medium">{email}</span>
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3 border-b border-[var(--border)] pb-3.5 text-[var(--text-secondary)]">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--primary)]">
                  location_on
                </span>
                <span>
                  <span className="mb-1 block font-mono text-[12px] tracking-[0.12em] text-[var(--text-tertiary)]">
                    地址
                  </span>
                  <span className="block text-[13px] font-medium">{address}</span>
                </span>
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--primary)]">
                  schedule
                </span>
                <span>
                  <span className="mb-1 block font-mono text-[12px] tracking-[0.12em] text-[var(--text-tertiary)]">
                    活动时间
                  </span>
                  <span className="block text-[13px] font-medium">{meetingTime}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col items-start justify-between gap-3 px-4 py-5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] sm:px-6 md:flex-row md:items-center lg:px-8">
          <span>
            © {currentYear} {clubName} · 保留所有权利
          </span>
          <span className="text-[var(--text-secondary)]">
            公告 / 活动 / 项目 / 关于 / 教程
          </span>
          <span>MADE BY KC COMPUTER CLUB</span>
        </div>
      </div>
    </footer>
  );
}
