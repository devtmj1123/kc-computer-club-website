'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { HeroSection } from '@/components/sections/HeroSection';
import { NoticesSection, EventsSection } from '@/components/sections/NoticesSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import AttendanceWidget from '@/components/attendance/AttendanceWidget';
import { decodeHtmlEntities } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  summary: string;
  category: string;
  icon: string;
  iconColor: string;
  publishedAt: string | Date;
}

interface Activity {
  id: string;
  title: string;
  category: string;
  date: string | Date;
  time: string;
  location: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  contributors: number;
  repoUrl?: string;
}

interface IndexItem {
  label: string;
  title: string;
  href: string;
  dateLabel: string;
}

function formatMonthDay(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function IndexPanel({
  items,
  statusText,
  heroImage,
  heroImageAlt,
}: {
  items: IndexItem[];
  statusText: string;
  heroImage?: string;
  heroImageAlt?: string;
}) {
  return (
    <aside className="panel-corners self-start border border-[var(--rule-strong)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        <span>INDEX / 近期</span>
        <span className="inline-flex items-center gap-1.5 text-[var(--primary)]">
          <span className="size-1 rounded-full bg-[var(--primary)]" />
          LIVE
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
            近期内容将在这里更新。
          </p>
          <Link
            href="/notices"
            className="mt-3 inline-block border-b border-[var(--rule-strong)] pb-0.5 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            浏览公告 →
          </Link>
        </div>
      ) : (
        items.map((item, index) => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            className="group grid grid-cols-[22px_minmax(0,1fr)_40px] items-start gap-3 border-b border-[var(--border)] px-4 py-[18px] transition-colors hover:bg-[var(--primary-light)]"
          >
            <span className="pt-0.5 font-mono text-[12px] leading-relaxed text-[var(--primary)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0">
              <span className="mb-1 block font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {item.label}
              </span>
              <span className="block text-[13px] font-medium leading-[1.55] tracking-[0.005em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                {item.title}
              </span>
            </span>
            <span className="pt-0.5 text-right font-mono text-[12px] leading-relaxed tracking-[0.04em] text-[var(--text-tertiary)]">
              {item.dateLabel}
            </span>
          </Link>
        ))
      )}

      {heroImage && (
        <div className="border-b border-[var(--border)]">
          <img
            src={heroImage}
            alt={heroImageAlt || '社团照片'}
            className="h-28 w-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        <span className="inline-flex items-center gap-2 text-[var(--primary)]">
          <span className="size-1 rounded-full bg-[var(--primary)]" />
          {statusText || '社团运行中'}
        </span>
        <Link href="/notices" className="transition-colors hover:text-[var(--foreground)]">
          查看全部 →
        </Link>
      </div>
    </aside>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clubStatus, setClubStatus] = useState<string>('社团运行中');
  const [clubSettings, setClubSettings] = useState<{ heroImage?: string; heroImageAlt?: string } | null>(null);

  useEffect(() => {
    const fetchClubSettings = async () => {
      try {
        const response = await fetch('/api/club-settings');
        if (response.ok) {
          const data = await response.json();
          setClubSettings({
            heroImage: data.heroImage,
            heroImageAlt: data.heroImageAlt,
          });
          if (data.recruitmentStatus) {
            setClubStatus(data.recruitmentStatus);
          }
        }
      } catch (error) {
        console.error('Failed to fetch club settings:', error);
      }
    };
    fetchClubSettings();
  }, []);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch('/api/notices?onlyPublished=true');
        if (response.ok) {
          const data = await response.json();
          const noticesData = data.notices || data;
          if (Array.isArray(noticesData) && noticesData.length > 0) {
            const formattedNotices = noticesData
              .slice(0, 3)
              .map((notice: Record<string, unknown>) => ({
                id: (notice.id || notice.$id) as string,
                title: decodeHtmlEntities(notice.title as string),
                summary: decodeHtmlEntities(
                  ((notice.content as string)?.substring(0, 100) || '') as string
                ),
                category: (notice.category || '其他') as string,
                icon: mapCategoryToIcon((notice.category || '其他') as string),
                iconColor: mapCategoryToColor((notice.category || '其他') as string),
                publishedAt: (notice.publishedAt ||
                  notice.createdAt ||
                  notice.$createdAt) as string,
              }));
            setNotices(formattedNotices);
          }
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error);
      }
    };
    fetchNotices();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities?onlyPublished=true');
        if (response.ok) {
          const data = await response.json();
          const activitiesData = data.activities || data;
          if (Array.isArray(activitiesData) && activitiesData.length > 0) {
            const formattedActivities = activitiesData
              .slice(0, 3)
              .map((activity: Record<string, unknown>) => ({
                id: (activity.id || activity.$id) as string,
                title: activity.title as string,
                category: (activity.category || '活动') as string,
                date: (activity.startTime || new Date()) as string | Date,
                time: activity.startTime
                  ? new Date(activity.startTime as string).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '待定',
                location: (activity.location || '待定') as string,
              }));
            setActivities(formattedActivities);
          }
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          const projectsArray = data.projects || data;
          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            const formattedProjects = projectsArray.slice(0, 3).map((project: Record<string, unknown>) => ({
              id: (project.projectId || project.id || project.$id) as string,
              title: project.title as string,
              description: project.description as string,
              contributors: ((project.members as unknown[])?.length || 0) + 1,
              repoUrl: project.projectLink as string | undefined,
            }));
            setProjects(formattedProjects);
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const indexCandidates: Array<IndexItem | null> = [
    notices[0]
      ? {
          label: '公告',
          title: notices[0].title,
          href: `/notices/${notices[0].id}`,
          dateLabel: formatMonthDay(notices[0].publishedAt),
        }
      : null,
    activities[0]
      ? {
          label: '活动',
          title: activities[0].title,
          href: `/activities/${activities[0].id}`,
          dateLabel: formatMonthDay(activities[0].date),
        }
      : null,
    projects[0]
      ? {
          label: '项目',
          title: projects[0].title,
          href: `/projects/${projects[0].id}`,
          dateLabel: 'OPEN',
        }
      : null,
    notices[1]
      ? {
          label: '公告',
          title: notices[1].title,
          href: `/notices/${notices[1].id}`,
          dateLabel: formatMonthDay(notices[1].publishedAt),
        }
      : null,
    activities[1]
      ? {
          label: '活动',
          title: activities[1].title,
          href: `/activities/${activities[1].id}`,
          dateLabel: formatMonthDay(activities[1].date),
        }
      : null,
  ];
  const indexItems = indexCandidates.filter((item): item is IndexItem => item !== null).slice(0, 4);

  const currentYear = new Date().getFullYear();
  const clubYears = currentYear - 1983;

  return (
    <StudentLayout>
      <div className="mx-auto w-full max-w-[1360px]">
        <HeroSection
          statusText={clubStatus}
          aside={
            <IndexPanel
              items={indexItems}
              statusText={clubStatus}
              heroImage={clubSettings?.heroImage}
              heroImageAlt={clubSettings?.heroImageAlt}
            />
          }
        />

        <section className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 border-b border-[var(--rule-strong)] sm:grid-cols-3">
            {[
              { value: '1983', unit: '', label: '成立年份', note: 'ESTABLISHED' },
              { value: String(clubYears), unit: '年', label: '社团历史', note: 'YEARS' },
              { value: '05', unit: '组', label: '分组方向', note: 'GROUPS' },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={
                  index === 0
                    ? 'py-6 sm:pr-6'
                    : 'border-t border-[var(--border)] py-6 sm:border-l sm:border-t-0 sm:px-6'
                }
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[34px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)] sm:text-[38px]">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="font-display text-[14px] font-semibold text-[var(--primary)]">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                    {stat.label}
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    {stat.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.74fr)] lg:gap-16 lg:px-8 lg:py-14">
          <NoticesSection notices={notices} />
          <EventsSection activities={activities} />
        </div>

        <div className="px-4 pb-14 sm:px-6 lg:px-8">
          <ProjectsSection projects={projects} />
        </div>

        {user && !('role' in user) && (
          <div className="border-t border-[var(--border)] px-4 py-10 sm:px-6 lg:px-8">
            <AttendanceWidget
              studentId={user.id}
              studentName={user.name}
              studentEmail={user.email}
            />
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function mapCategoryToIcon(category: string): string {
  const iconMap: Record<string, string> = {
    系统: 'warning',
    新闻: 'emoji_events',
    更新: 'science',
    活动: 'calendar_month',
    紧急: 'priority_high',
    公告: 'campaign',
    default: 'info',
  };
  return iconMap[category] || iconMap.default;
}

function mapCategoryToColor(category: string): string {
  const colorMap: Record<string, string> = {
    系统: 'orange',
    新闻: 'green',
    更新: 'blue',
    活动: 'purple',
    紧急: 'red',
    公告: 'green',
    default: 'blue',
  };
  return colorMap[category] || colorMap.default;
}
