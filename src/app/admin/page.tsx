'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Link from 'next/link';

interface ActivityRow {
  id: string;
  title: string;
  startTime: string;
  location: string;
  status: string;
  signupCount: number;
  maxParticipants: number;
}

interface DashboardStats {
  notices: number;
  activities: number;
  signups: number;
  pendingComments: number;
  pendingProjects: number;
}

const emptyStats: DashboardStats = {
  notices: 0,
  activities: 0,
  signups: 0,
  pendingComments: 0,
  pendingProjects: 0,
};

const quickActions = [
  { href: '/admin/notices/create', icon: 'campaign', label: '发布公告', note: '新建公告' },
  { href: '/admin/activities/create', icon: 'event', label: '创建活动', note: '安排活动' },
  { href: '/admin/comments', icon: 'chat', label: '评论审核', note: '处理待审评论' },
  { href: '/admin/projects', icon: 'folder_check', label: '项目审核', note: '处理待审项目' },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待定';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function statusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case 'published':
      return { label: '已发布', className: 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]' };
    case 'draft':
      return { label: '草稿', className: 'border-[var(--rule-strong)] text-[var(--text-secondary)]' };
    case 'cancelled':
      return { label: '已取消', className: 'border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]' };
    case 'ended':
      return { label: '已结束', className: 'border-[var(--rule-strong)] text-[var(--text-tertiary)]' };
    default:
      return { label: status || '未知', className: 'border-[var(--rule-strong)] text-[var(--text-secondary)]' };
  }
}

export default function AdminDashboard() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isLoading, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const loadDashboardData = async () => {
      try {
        setIsLoadingData(true);
        const [noticesRes, activitiesRes, commentsRes, projectsRes] = await Promise.all([
          fetch('/api/notices'),
          fetch('/api/activities'),
          fetch('/api/comments?onlyApproved=false'),
          fetch('/api/projects?status=pending'),
        ]);

        const noticesData = noticesRes.ok ? await noticesRes.json() : { notices: [] };
        const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };
        const commentsData = commentsRes.ok ? await commentsRes.json() : { comments: [] };
        const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };

        const notices = Array.isArray(noticesData.notices) ? noticesData.notices : [];
        const activities = Array.isArray(activitiesData.activities) ? activitiesData.activities : [];
        const comments = Array.isArray(commentsData.comments) ? commentsData.comments : [];
        const pendingProjects = Array.isArray(projectsData.projects) ? projectsData.projects : [];

        const totalSignups = activities.reduce(
          (sum: number, activity: Record<string, unknown>) =>
            sum + (Number(activity.currentParticipants) || 0),
          0
        );
        const pendingComments = comments.filter(
          (comment: Record<string, unknown>) => comment.status === 'pending'
        ).length;

        setStats({
          notices: notices.length,
          activities: activities.length,
          signups: totalSignups,
          pendingComments,
          pendingProjects: pendingProjects.length,
        });

        const now = Date.now();
        const upcoming = activities
          .map((activity: Record<string, unknown>) => {
            const startTime = String(activity.startTime || '');
            const timestamp = new Date(startTime).getTime();
            return {
              id: String(activity.$id || activity.id || ''),
              title: String(activity.title || '未命名活动'),
              startTime,
              location: String(activity.location || '待定'),
              status: String(activity.status || ''),
              signupCount: Number(activity.currentParticipants) || 0,
              maxParticipants: Number(activity.maxParticipants) || 0,
              timestamp,
            };
          })
          .filter(
            (activity: { id: string; timestamp: number }) =>
              activity.id && !Number.isNaN(activity.timestamp) && activity.timestamp >= now - 86400000
          )
          .sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)
          .slice(0, 4)
          .map((activity: Record<string, unknown>) => ({
            id: activity.id as string,
            title: activity.title as string,
            startTime: activity.startTime as string,
            location: activity.location as string,
            status: activity.status as string,
            signupCount: activity.signupCount as number,
            maxParticipants: activity.maxParticipants as number,
          }));

        setUpcomingActivities(upcoming);
      } catch (error) {
        console.error('加载仪表板数据失败:', error);
        setStats(emptyStats);
        setUpcomingActivities([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user, isAdmin]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="border border-[var(--border)] bg-[var(--surface)] px-10 py-8 text-center">
          <div className="mx-auto mb-4 size-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Loading dashboard
          </p>
        </div>
      </div>
    );
  }

  const displayName = user.name || '管理员';
  const dateLabel = new Date().toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const pendingTotal = stats.pendingComments + stats.pendingProjects;

  return (
    <AdminLayout adminName={displayName}>
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
            {dateLabel}
          </div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            下午好，{displayName}。
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {pendingTotal > 0
              ? `今天有 ${stats.pendingComments} 条待审核评论、${stats.pendingProjects} 个待审核项目。`
              : '当前没有待审核事项，可以开始安排新的内容。'}
          </p>
        </div>
        <Link
          href="/admin/notices/create"
          className="inline-flex w-fit items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          <span className="text-[14px] leading-none">+</span>
          发布公告
        </Link>
      </div>

      <section className="border border-[var(--rule-strong)]">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: '公告总数',
              note: 'NOTICES',
              value: isLoadingData ? '—' : String(stats.notices).padStart(2, '0'),
            },
            {
              label: '活动总数',
              note: 'ACTIVITIES',
              value: isLoadingData ? '—' : String(stats.activities).padStart(2, '0'),
            },
            {
              label: '活动报名',
              note: 'SIGNUPS',
              value: isLoadingData ? '—' : String(stats.signups).padStart(2, '0'),
            },
            {
              label: '待审核',
              note: 'PENDING',
              value: isLoadingData ? '—' : String(pendingTotal).padStart(2, '0'),
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={
                index % 2 === 0
                  ? 'border-b border-r border-[var(--border)] px-5 py-5 lg:border-b-0 lg:border-r'
                  : 'border-b border-[var(--border)] px-5 py-5 lg:border-b-0 lg:border-r'
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  {stat.label}
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] sm:block">
                  {stat.note}
                </span>
              </div>
              <div className="mt-3 font-display text-[30px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)]">
                {stat.value}
              </div>
              <div className="mt-2 h-px w-8 bg-[var(--primary)]" />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="border border-[var(--rule-strong)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">近期活动</h2>
            <Link
              href="/admin/activities"
              className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
            >
              全部活动 →
            </Link>
          </div>

          {upcomingActivities.length === 0 ? (
            <div className="flex items-center justify-between px-5 py-10">
              <p className="text-[12px] text-[var(--text-secondary)]">
                {isLoadingData ? '正在加载活动…' : '暂无即将进行的活动'}
              </p>
              <Link
                href="/admin/activities/create"
                className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]"
              >
                + 创建活动
              </Link>
            </div>
          ) : (
            <div>
              {upcomingActivities.map((activity) => {
                const status = statusLabel(activity.status);
                return (
                  <Link
                    key={activity.id}
                    href={`/admin/activities/${activity.id}/edit`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-[var(--border)] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[var(--primary-light)] sm:grid-cols-[minmax(0,1fr)_92px_70px_76px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
                        {activity.title}
                      </p>
                      <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                        {activity.location}
                      </p>
                    </div>
                    <span className="font-mono text-[12px] text-[var(--text-secondary)]">
                      {formatDate(activity.startTime)}
                    </span>
                    <span className="text-right font-mono text-[12px] text-[var(--text-secondary)]">
                      {activity.signupCount}
                      {activity.maxParticipants > 0 ? ` / ${activity.maxParticipants}` : ''} 人
                    </span>
                    <span
                      className={`justify-self-end border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="border border-[var(--rule-strong)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">待处理</h2>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
              {String(pendingTotal).padStart(2, '0')}
            </span>
          </div>

          <Link
            href="/admin/comments"
            className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4 transition-colors hover:bg-[var(--primary-light)]"
          >
            <span className="pt-0.5 font-mono text-[12px] text-[var(--primary)]">01</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-[var(--foreground)]">
                审核 {stats.pendingComments} 条匿名评论
              </span>
              <span className="mt-1 block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                COMMENTS · 待审核
              </span>
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">↗</span>
          </Link>

          <Link
            href="/admin/projects"
            className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4 transition-colors hover:bg-[var(--primary-light)]"
          >
            <span className="pt-0.5 font-mono text-[12px] text-[var(--primary)]">02</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-[var(--foreground)]">
                审核 {stats.pendingProjects} 个学生项目
              </span>
              <span className="mt-1 block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                PROJECTS · 待审核
              </span>
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">↗</span>
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[var(--primary-light)]"
          >
            <span className="pt-0.5 font-mono text-[12px] text-[var(--primary)]">03</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-[var(--foreground)]">
                更新社团公开信息
              </span>
              <span className="mt-1 block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                SETTINGS · 社团信息
              </span>
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">↗</span>
          </Link>
        </section>
      </div>

      <section className="mt-5 border border-[var(--rule-strong)]">
        <div className="border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">快捷操作</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 border-b border-[var(--border)] px-5 py-4 transition-colors hover:bg-[var(--primary-light)] sm:border-r lg:border-b-0"
            >
              <span className="flex size-8 shrink-0 items-center justify-center border border-[var(--border)] text-[var(--primary)] transition-colors group-hover:border-[var(--primary)]">
                <span className="material-symbols-outlined text-[16px]">{action.icon}</span>
              </span>
              <span>
                <span className="block text-[12px] font-semibold text-[var(--foreground)]">
                  {action.label}
                </span>
                <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  {action.note}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
