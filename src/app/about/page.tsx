'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';

const DEFAULT_CLUB_INFO = {
  name: '坤成中学电脑学会',
  description:
    '电脑学会成立于 1983 年，至今已有四十余年历史。我们致力于让团员跟进科技时代的步伐，提高对电脑的认识，并提升资讯工艺方面的能力。',
  email: 'computerclub@kuencheng.edu.my',
  location: '电脑室 A304，科学楼三楼',
  meetingTime: '每周五 16:00 - 18:00',
};

interface ClubInfo {
  name: string;
  description: string;
  email: string;
  location: string;
  meetingTime: string;
  socialLinks: {
    github?: string;
    discord?: string;
    instagram?: string;
    youtube?: string;
  };
}

const faqs = [
  {
    question: '如何成为团员？',
    answerLines: [
      '坤成初一新生：可以在新生营招生展来我们的摊位了解详情，之后在校务系统选取电脑学会即可。',
      '坤成其他年级学生：可以在年尾转换社团时来摊位了解详情，面试获得录取后填写转换社团表格，交给联课处。',
    ],
  },
  {
    question: '有分高级组和初级组吗？',
    answerLines: [
      '有。高级组为 2 学点，初级组为 1 学点；初级组团员只需认真上课与交功课。',
      '高级组除了上课，也需要参与服务，例如在学校演奏会、周会与多元学习日的控制室协助控制 LED 屏幕。',
    ],
  },
  {
    question: '活动信息在哪里发布？',
    answerLines: [
      '请查看本网站的公告与活动页面，或关注我们的 Instagram，了解社团日常与最新动态。',
    ],
  },
  {
    question: '完全没有电脑经验的学生可以加入吗？',
    answerLines: [
      '当然可以。科技影响着每一个领域，无论你来自理科、文科还是商科，只要对电脑有兴趣，都欢迎加入我们。',
    ],
  },
];

const activities = [
  {
    index: '01',
    title: '例常课程',
    description: '按分组级别进行电脑与资讯工艺课程，从基础操作到进阶主题。',
  },
  {
    index: '02',
    title: '项目实践',
    description: '以团队形式完成真实项目，把课堂上学到的知识变成可以运行的作品。',
  },
  {
    index: '03',
    title: '校园技术支持',
    description: '为学校活动提供控制室、LED 屏幕与现场技术协助，积累实战经验。',
  },
  {
    index: '04',
    title: '比赛与工作坊',
    description: '参与校内外比赛、工作坊与技术分享，和同伴一起持续进步。',
  },
];

const socialLabels: Array<{ key: keyof ClubInfo['socialLinks']; label: string }> = [
  { key: 'github', label: 'GitHub' },
  { key: 'discord', label: 'Discord' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
];

export default function AboutPage() {
  const [clubInfo, setClubInfo] = useState<ClubInfo>({
    ...DEFAULT_CLUB_INFO,
    socialLinks: {},
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/club-settings');
        if (response.ok) {
          const settings = await response.json();
          setClubInfo({
            name: settings.aboutTitle || DEFAULT_CLUB_INFO.name,
            description: settings.aboutDescription || DEFAULT_CLUB_INFO.description,
            email: settings.aboutEmail || DEFAULT_CLUB_INFO.email,
            location: settings.aboutLocation || DEFAULT_CLUB_INFO.location,
            meetingTime: settings.aboutMeetingTime || DEFAULT_CLUB_INFO.meetingTime,
            socialLinks: {
              github: settings.githubUrl || undefined,
              discord: settings.discordUrl || undefined,
              instagram: settings.instagramUrl || undefined,
              youtube: settings.youtubeUrl || undefined,
            },
          });
        }
      } catch (error) {
        console.error('Failed to load club settings:', error);
      }
    };
    loadSettings();
  }, []);

  const availableSocials = socialLabels.filter(({ key }) => Boolean(clubInfo.socialLinks[key]));

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">关于</span>
        </nav>

        <header className="grid grid-cols-1 gap-10 border-b border-[var(--rule-strong)] pb-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16">
          <div>
            <div className="eyebrow">ABOUT THE CLUB · 关于我们</div>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,6vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.045em] text-[var(--foreground)]">
              一起学习，
              <br />
              <span className="text-[var(--primary)]">一起创造。</span>
            </h1>
            <p className="mt-7 max-w-2xl text-[14px] leading-[1.95] text-[var(--text-secondary)]">
              {clubInfo.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-[var(--primary)]" />
                EST. 1983
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-[var(--primary)]" />
                {clubInfo.location}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-[var(--primary)]" />
                {clubInfo.meetingTime}
              </span>
            </div>
          </div>

          <div className="self-start border border-[var(--rule-strong)]">
            <div className="border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              CONTACT / 联系
            </div>
            <div className="divide-y divide-[var(--border)]">
              <a
                href={`mailto:${clubInfo.email}`}
                className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--primary-light)]"
              >
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">mail</span>
                <span>
                  <span className="block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    邮箱
                  </span>
                  <span className="mt-1 block text-[12px] font-medium text-[var(--foreground)]">
                    {clubInfo.email}
                  </span>
                </span>
              </a>
              <div className="flex items-start gap-3 px-4 py-4">
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
                  location_on
                </span>
                <span>
                  <span className="block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    地点
                  </span>
                  <span className="mt-1 block text-[12px] font-medium text-[var(--foreground)]">
                    {clubInfo.location}
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-3 px-4 py-4">
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
                  schedule
                </span>
                <span>
                  <span className="block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    活动时间
                  </span>
                  <span className="mt-1 block text-[12px] font-medium text-[var(--foreground)]">
                    {clubInfo.meetingTime}
                  </span>
                </span>
              </div>
            </div>

            {availableSocials.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-4">
                {availableSocials.map(({ key, label }) => (
                  <a
                    key={key}
                    href={clubInfo.socialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[var(--border)] px-2.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        <section className="border-b border-[var(--rule-strong)] py-12">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">01</span>
            <h2 className="font-display text-[26px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
              我们做什么
            </h2>
            <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
          </div>

          <div className="mt-7 grid grid-cols-1 border-l border-t border-[var(--border)] sm:grid-cols-2">
            {activities.map((activity) => (
              <div
                key={activity.index}
                className="border-b border-r border-[var(--border)] p-5 sm:p-6"
              >
                <span className="font-mono text-[12px] tracking-[0.12em] text-[var(--primary)]">
                  {activity.index}
                </span>
                <h3 className="mt-4 font-display text-[19px] font-semibold text-[var(--foreground)]">
                  {activity.title}
                </h3>
                <p className="mt-2 text-[12px] leading-[1.85] text-[var(--text-secondary)]">
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--rule-strong)] py-12">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">02</span>
            <h2 className="font-display text-[26px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
              常见问题
            </h2>
            <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
          </div>

          <div className="mt-7 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="border-t border-[var(--border)] pt-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-[var(--primary)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-[17px] font-semibold leading-[1.5] text-[var(--foreground)]">
                    {faq.question}
                  </h3>
                </div>
                <div className="mt-3 space-y-2 pl-7 text-[12px] leading-[1.85] text-[var(--text-secondary)]">
                  {faq.answerLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
              JOIN US / 加入我们
            </div>
            <h2 className="mt-3 font-display text-[26px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
              对电脑有兴趣，就足够了。
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              查看近期活动，或登录成员账号了解更多社团信息。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/activities"
              className="inline-flex items-center gap-4 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              浏览活动 <span className="text-[13px] leading-none">↗</span>
            </Link>
            <Link
              href="/auth/login"
              className="border-b border-[var(--rule-strong)] pb-1 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              成员登录 →
            </Link>
          </div>
        </section>
      </main>
    </StudentLayout>
  );
}
