'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
interface StatCard {
  label: string;
  value: number;
  trend: number;
  trendLabel: string;
  icon: string;
  color: string;
}
interface Activity {
  id: string;
  title: string;
  date: string;
  attendees: number;
  status: 'published' | 'draft' | 'planned';
}
interface RecentActivityItem {
  id: string;
  type: 'member_join' | 'event_created' | 'notice_published';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}
const defaultStats: StatCard[] = [
  {
    label: '公告总数',
    value: 0,
    trend: 0,
    trendLabel: '+0 本月',
    icon: 'campaign',
    color: 'from-blue-500 to-blue-600',
  },
  {
    label: '活动总数',
    value: 0,
    trend: 0,
    trendLabel: '+0 本月',
    icon: 'event',
    color: 'from-green-500 to-green-600',
  },
  {
    label: '参与成员',
    value: 0,
    trend: 0,
    trendLabel: '+0 本月',
    icon: 'people',
    color: 'from-purple-500 to-purple-600',
  },
];
export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatCard[]>(defaultStats);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);
  const loadDashboardData = async () => {
    try {
      setIsLoadingData(true);
      const [noticesRes, activitiesRes] = await Promise.all([
        fetch('/api/notices'),
        fetch('/api/activities'),
      ]);
      const noticesData = await noticesRes.json();
      const activitiesData = await activitiesRes.json();
      const notices = noticesData.success ? (noticesData.notices || []) : [];
      const activities = activitiesData.success ? (activitiesData.activities || []) : [];
      const noticeCount = notices.length;
      const activityCount = activities.length;
      const totalParticipants = activities.reduce(
        (sum: number, a: Record<string, unknown>) => sum + (Number(a.currentParticipants) || 0),
        0
      );
      setStats([
        {
          label: '公告总数',
          value: noticeCount,
          trend: 0,
          trendLabel: `${noticeCount} 个`,
          icon: 'campaign',
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: '活动总数',
          value: activityCount,
          trend: 0,
          trendLabel: `${activityCount} 个`,
          icon: 'event',
          color: 'from-green-500 to-green-600',
        },
        {
          label: '参与成员',
          value: totalParticipants,
          trend: 0,
          trendLabel: `${totalParticipants} 人`,
          icon: 'people',
          color: 'from-purple-500 to-purple-600',
        },
      ]);
      const recent = activities
        .filter((a: Record<string, unknown>) => a.status === 'published' || a.status === 'draft')
        .slice(0, 4)
        .map((a: Record<string, unknown>) => ({
          id: a.$id,
          title: a.title,
          date: new Date(a.startTime as string).toLocaleDateString('zh-CN'),
          attendees: a.currentParticipants || 0,
          status: a.status,
        }));
      setUpcomingActivities(recent);
      setRecentActivities([
        {
          id: '1',
          type: 'notice_published',
          title: '发布了新公告',
          description: `共有 ${noticeCount} 个公告`,
          timestamp: '最近',
          icon: 'campaign',
        },
        {
          id: '2',
          type: 'event_created',
          title: '创建了新活动',
          description: `共有 ${activityCount} 个活动`,
          timestamp: '最近',
          icon: 'event',
        },
        {
          id: '3',
          type: 'member_join',
          title: '成员参与',
          description: `共有 ${totalParticipants} 名参与者`,
          timestamp: '最近',
          icon: 'person_add',
        },
      ]);
    } catch (err) {
      console.error('加载仪表板数据失败:', err);
      setStats(defaultStats);
      setUpcomingActivities([]);
      setRecentActivities([]);
    } finally {
      setIsLoadingData(false);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="nm-panel text-center px-8 py-7">
          <div className="animate-spin mb-4 text-[var(--admin-primary)]">
            <span className="material-symbols-outlined text-5xl">
              hourglass_bottom
            </span>
          </div>
          <p className="text-[var(--foreground)]">加载中...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <AdminLayout adminName="管理员">
      <div className="mb-8 nm-panel p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,163,247,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(79,163,247,0.1),transparent_32%)]" />
        <div className="relative">
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">欢迎回来！</h1>
          <p className="text-[var(--text-secondary)] max-w-2xl">
            这是电脑学会的管理后台。您可以在这里管理公告、活动、评论和成员信息。
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card nm-hover-raise p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-12 rounded-2xl nm-raised-sm flex items-center justify-center bg-[var(--nm-bg)]">
                <span className="material-symbols-outlined text-[var(--foreground)] text-2xl">
                  {stat.icon}
                </span>
              </div>
              <span className="text-[var(--admin-primary)] text-sm font-semibold nm-inset-sm px-3 py-1 rounded-full">
                {stat.trendLabel}
              </span>
            </div>
            <h3 className="text-[var(--text-secondary)] text-sm font-medium mb-1">{stat.label}</h3>
            <p className="text-4xl font-black text-[var(--foreground)]">{stat.value}</p>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-tertiary)]">
                环比增长 {stat.trend > 0 ? '+' : ''}{stat.trend}%
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="nm-panel overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)]">近期活动</h2>
              <Link href="/admin/activities">
                <Button 
                  variant="primary" 
                  size="sm"
                  className="!bg-[var(--admin-primary)] !text-[#111814]"
                >
                  查看全部
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {upcomingActivities.map((activity) => {
                let statusBg = '';
                let statusText = '';
                let statusLabel = '';
                if (activity.status === 'published') {
                  statusBg = 'bg-green-500/10';
                  statusText = 'text-green-400';
                  statusLabel = '已发布';
                } else if (activity.status === 'draft') {
                  statusBg = 'bg-amber-500/10';
                  statusText = 'text-amber-400';
                  statusLabel = '草稿';
                } else {
                  statusBg = 'bg-[color:rgba(79,163,247,0.12)]';
                  statusText = 'text-[var(--admin-primary)]';
                  statusLabel = '计划中';
                }
                return (
                  <div
                    key={activity.id}
                    className="px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[var(--foreground)] font-semibold max-w-xs truncate">
                        {activity.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium nm-inset-sm ${statusBg} ${statusText}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          calendar_today
                        </span>
                        {activity.date}
                      </span>
                      {activity.status === 'published' && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            group
                          </span>
                          {activity.attendees} 人已报名
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="nm-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)]">最近活动</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentActivities.map((item, index) => (
              <div key={item.id} className="px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="size-10 rounded-full nm-raised-sm flex items-center justify-center mb-2 text-[var(--primary)]">
                      <span className="material-symbols-outlined text-lg">
                        {item.icon}
                      </span>
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div className="w-0.5 h-12 bg-[var(--border)]" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[var(--foreground)] font-medium text-sm">{item.title}</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-1">{item.description}</p>
                    <p className="text-[var(--text-tertiary)] text-xs mt-2">{item.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 nm-panel p-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/notices/create">
            <button className="w-full p-4 rounded-2xl nm-raised-sm hover:shadow-[var(--nm-raised)] transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl nm-inset-sm flex items-center justify-center group-hover:shadow-[var(--nm-inset)] transition-shadow text-[var(--admin-primary)]">
                  <span className="material-symbols-outlined">
                    add_circle
                  </span>
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-semibold text-sm">发布公告</p>
                  <p className="text-[var(--text-secondary)] text-xs">创建新的公告信息</p>
                </div>
              </div>
            </button>
          </Link>
          <Link href="/admin/activities/create">
            <button className="w-full p-4 rounded-2xl nm-raised-sm hover:shadow-[var(--nm-raised)] transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl nm-inset-sm flex items-center justify-center group-hover:shadow-[var(--nm-inset)] transition-shadow text-[var(--admin-primary)]">
                  <span className="material-symbols-outlined">
                    event_note
                  </span>
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-semibold text-sm">创建活动</p>
                  <p className="text-[var(--text-secondary)] text-xs">安排新的社团活动</p>
                </div>
              </div>
            </button>
          </Link>
          <Link href="/admin/comments">
            <button className="w-full p-4 rounded-2xl nm-raised-sm hover:shadow-[var(--nm-raised)] transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl nm-inset-sm flex items-center justify-center group-hover:shadow-[var(--nm-inset)] transition-shadow text-[var(--admin-primary)]">
                  <span className="material-symbols-outlined">
                    chat
                  </span>
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-semibold text-sm">管理评论</p>
                  <p className="text-[var(--text-secondary)] text-xs">审核和删除评论</p>
                </div>
              </div>
            </button>
          </Link>
          <Link href="/admin/manage">
            <button className="w-full p-4 rounded-2xl nm-raised-sm hover:shadow-[var(--nm-raised)] transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl nm-inset-sm flex items-center justify-center group-hover:shadow-[var(--nm-inset)] transition-shadow text-[var(--admin-primary)]">
                  <span className="material-symbols-outlined">
                    admin_panel_settings
                  </span>
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-semibold text-sm">管理员管理</p>
                  <p className="text-[var(--text-secondary)] text-xs">添加/删除管理员</p>
                </div>
              </div>
            </button>
          </Link>
          <Link href="/admin/settings">
            <button className="w-full p-4 rounded-2xl nm-raised-sm hover:shadow-[var(--nm-raised)] transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl nm-inset-sm flex items-center justify-center group-hover:shadow-[var(--nm-inset)] transition-shadow text-[var(--admin-primary)]">
                  <span className="material-symbols-outlined">
                    settings
                  </span>
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-semibold text-sm">社团设置</p>
                  <p className="text-[var(--text-secondary)] text-xs">管理社团信息</p>
                </div>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}