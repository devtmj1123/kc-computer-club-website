'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { decodeHtmlEntities } from '@/lib/utils';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  signupDeadline: string;
  location: string;
  organizer: string | null;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
}

function formatDate(value: string): { day: string; month: string; full: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: '--', month: 'TBA', full: '待定', time: '' };
  }
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    full: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate()
    ).padStart(2, '0')}`,
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        const visibility = user ? 'all' : 'public';
        const response = await fetch(`/api/activities?onlyPublished=true&visibility=${visibility}`);
        const data = await response.json();
        if (data.success && data.activities) {
          const formattedActivities = data.activities
            .map((activity: Record<string, unknown>) => {
              const signupDeadline = String(activity.signupDeadline || '');
              const rawStatus = String(activity.status || '');
              const deadlinePassed = signupDeadline
                ? new Date(signupDeadline).getTime() < Date.now()
                : false;
              return {
                id: String(activity.$id || activity.id || ''),
                title: decodeHtmlEntities(String(activity.title || '')),
                description: decodeHtmlEntities(
                  String(activity.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                ),
                category: String(activity.category || '其他'),
                startTime: String(activity.startTime || ''),
                signupDeadline,
                location: String(activity.location || '待定'),
                organizer: activity.organizer ? String(activity.organizer) : null,
                maxParticipants: Number(activity.maxParticipants) || 0,
                currentParticipants: Number(activity.currentParticipants) || 0,
                status:
                  rawStatus === 'cancelled'
                    ? 'cancelled'
                    : rawStatus === 'ended'
                      ? 'ended'
                      : deadlinePassed
                        ? 'closed'
                        : 'open',
              } as Activity;
            })
            .filter((activity: Activity) => activity.id);
          setActivities(formattedActivities);
        } else {
          setActivities([]);
        }
      } catch (err) {
        console.error('加载活动失败:', err);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadActivities();
  }, [user, authLoading]);

  const categoryOptions = [
    { value: 'all', label: '所有分类' },
    ...Array.from(new Set(activities.map((activity) => activity.category))).map((category) => ({
      value: category,
      label: category,
    })),
  ];

  const statusOptions = [
    { value: 'all', label: '所有状态' },
    { value: 'open', label: '开放报名' },
    { value: 'closed', label: '已截止' },
    { value: 'ended', label: '已结束' },
  ];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' ||
      activity.status === selectedStatus ||
      (selectedStatus === 'closed' && activity.status === 'cancelled');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">活动</span>
        </nav>

        <header className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">UPCOMING EVENTS · 近期活动</div>
            <h1 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              一起动手，
              <br />
              <span className="text-[var(--primary)]">做出点东西。</span>
            </h1>
            <p className="mt-5 max-w-xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
              工作坊、讲座与校内比赛。选择感兴趣的活动查看详情并报名。
            </p>
          </div>
          <div className="shrink-0 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {String(filteredActivities.filter((activity) => activity.status === 'open').length).padStart(
              2,
              '0'
            )}{' '}
            个开放报名
          </div>
        </header>

        <div className="flex flex-col gap-3 border-b border-[var(--border)] py-5 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="搜索活动…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon="search"
            />
          </div>
          <div className="w-full sm:w-40">
            <NeumorphicSelect
              options={categoryOptions}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <NeumorphicSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Loading events…
            </span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon="event"
            title="暂无活动"
            description="没有找到符合条件的活动，请尝试调整搜索或筛选条件。"
            className="mt-10"
          />
        ) : (
          <div className="mt-2">
            {filteredActivities.map((activity) => {
              const date = formatDate(activity.startTime);
              const isFull =
                activity.maxParticipants > 0 &&
                activity.currentParticipants >= activity.maxParticipants;
              const statusLabel =
                activity.status === 'cancelled'
                  ? '已取消'
                  : activity.status === 'ended'
                    ? '已结束'
                    : activity.status === 'closed'
                      ? '已截止'
                      : isFull
                        ? '名额已满'
                        : '开放报名';

              return (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="group grid grid-cols-1 gap-5 border-b border-[var(--border)] py-6 transition-colors hover:bg-[var(--primary-light)] sm:grid-cols-[64px_minmax(0,1fr)_150px_18px] sm:items-start sm:px-3"
                >
                  <div className="flex w-14 flex-col items-center border border-[var(--rule-strong)] py-2">
                    <span className="font-display text-[26px] font-bold leading-none text-[var(--foreground)]">
                      {date.day}
                    </span>
                    <span className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                      {date.month}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--primary)]">
                        {activity.category}
                      </span>
                      <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                        {date.full} · {date.time}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-[19px] font-semibold leading-[1.45] tracking-[-0.01em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)] sm:text-[21px]">
                      {activity.title}
                    </h2>
                    {activity.description && (
                      <p className="mt-2 line-clamp-2 max-w-2xl text-[12px] leading-[1.8] text-[var(--text-secondary)]">
                        {activity.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        {activity.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[13px]">group</span>
                        {activity.currentParticipants}
                        {activity.maxParticipants > 0 ? ` / ${activity.maxParticipants}` : ''} 人
                      </span>
                      {activity.organizer && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px]">person</span>
                          {activity.organizer}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:justify-end">
                    <span
                      className={`inline-flex h-fit border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${
                        activity.status === 'open'
                          ? 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]'
                          : 'border-[var(--border)] text-[var(--text-tertiary)]'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <span className="hidden pt-0.5 text-[13px] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--primary)] sm:block">
                    ↗
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
