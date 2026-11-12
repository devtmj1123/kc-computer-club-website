'use client';

import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { useClub } from '@/contexts/ClubContext';

type SocialKey = 'githubUrl' | 'discordUrl' | 'instagramUrl' | 'youtubeUrl';

const socialLabels: Array<{ key: SocialKey; label: string }> = [
  { key: 'githubUrl', label: 'GitHub' },
  { key: 'discordUrl', label: 'Discord' },
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'youtubeUrl', label: 'YouTube' },
];

export default function AboutPage() {
  const { clubInfo } = useClub();

  const availableSocials = socialLabels.filter(({ key }) => Boolean(clubInfo[key]));
  const headingComma = clubInfo.aboutHeading.indexOf('，');
  const headingFirst =
    headingComma > 0 ? clubInfo.aboutHeading.slice(0, headingComma + 1) : clubInfo.aboutHeading;
  const headingSecond = headingComma > 0 ? clubInfo.aboutHeading.slice(headingComma + 1) : '';

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
              {headingFirst}
              {headingSecond && (
                <>
                  <br />
                  <span className="text-[var(--primary)]">{headingSecond}</span>
                </>
              )}
            </h1>
            <p className="mt-7 max-w-2xl text-[14px] leading-[1.95] text-[var(--text-secondary)]">
              {clubInfo.aboutDescription}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-[var(--primary)]" />
                EST. {clubInfo.foundedYear}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-[var(--primary)]" />
                {clubInfo.aboutLocation}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-[var(--primary)]" />
                {clubInfo.aboutMeetingTime}
              </span>
            </div>
          </div>

          <div className="self-start border border-[var(--rule-strong)]">
            <div className="border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              CONTACT / 联系
            </div>
            <div className="divide-y divide-[var(--border)]">
              <a
                href={`mailto:${clubInfo.aboutEmail}`}
                className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--primary-light)]"
              >
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">mail</span>
                <span>
                  <span className="block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    邮箱
                  </span>
                  <span className="mt-1 block text-[12px] font-medium text-[var(--foreground)]">
                    {clubInfo.aboutEmail}
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
                    {clubInfo.aboutLocation}
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
                    {clubInfo.aboutMeetingTime}
                  </span>
                </span>
              </div>
            </div>

            {availableSocials.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-4">
                {availableSocials.map(({ key, label }) => (
                  <a
                    key={key}
                    href={clubInfo[key]}
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
            {clubInfo.aboutActivities.map((activity, index) => (
              <div
                key={`${activity.title}-${index}`}
                className="border-b border-r border-[var(--border)] p-5 sm:p-6"
              >
                <span className="font-mono text-[12px] tracking-[0.12em] text-[var(--primary)]">
                  {String(index + 1).padStart(2, '0')}
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
            {clubInfo.faqs.map((faq, index) => (
              <div key={`${faq.question}-${index}`} className="border-t border-[var(--border)] pt-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-[var(--primary)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-[17px] font-semibold leading-[1.5] text-[var(--foreground)]">
                    {faq.question}
                  </h3>
                </div>
                <div className="mt-3 space-y-2 pl-7 text-[12px] leading-[1.85] text-[var(--text-secondary)]">
                  {faq.answer
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, lineIndex) => (
                      <p key={`${faq.question}-${lineIndex}`}>{line}</p>
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
              {clubInfo.joinTitle}
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {clubInfo.joinDescription}
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
