'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  signupDeadline: string;
  location: string;
  organizer: string | null;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  coverImage: string;
  isPinned: boolean;
  [key: string]: unknown;
}
const CATEGORY_OPTIONS = [
  { value: 'all', label: '所有分类' },
  { value: '编程', label: '编程' },
  { value: 'AI', label: 'AI' },
  { value: '网页', label: '网页' },
  { value: '比赛', label: '比赛' },
  { value: '工作坊', label: '工作坊' },
  { value: '讲座', label: '讲座' },
  { value: '其他', label: '其他' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: '所有状态' },
  { value: 'open', label: '开放报名' },
  { value: 'closed', label: '已截止' },
];
const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  编程: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: '编程' },
  AI: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'AI' },
  网页: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: '网页' },
  比赛: { bg: 'bg-red-500/10', text: 'text-red-400', label: '比赛' },
  工作坊: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '工作坊' },
  讲座: { bg: 'bg-green-500/10', text: 'text-green-400', label: '讲座' },
  其他: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: '其他' },
};
export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
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
          const formattedActivities = data.activities.map((activity: Record<string, unknown>) => {
            const signupDeadline = activity.signupDeadline as string;
            const isDeadlinePassed = signupDeadline ? new Date(signupDeadline) < new Date() : false;
            return {
              id: activity.$id as string,
              title: activity.title as string,
              description: activity.description as string,
              category: (activity.category as string) || '其他',
              startTime: activity.startTime as string,
              endTime: activity.endTime as string,
              signupDeadline: signupDeadline,
              location: activity.location as string,
              organizer: (activity.organizer as string) || null,
              maxParticipants: (activity.maxParticipants as number) || 0,
              currentParticipants: (activity.currentParticipants as number) || 0,
              status: isDeadlinePassed ? 'closed' : 'open',
              coverImage:
                (activity.coverImage as string) ||
                'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop',
              isPinned: false,
            } as Activity;
          });
          setActivities(formattedActivities);
          if (formattedActivities.length > 0) {
            setSelectedActivity(formattedActivities[0]);
          }
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
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  return (
    <StudentLayout>
      <main
        className="flex-1 w-full max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            近期活动
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            浏览并报名参加俱乐部的工作坊、黑客马拉松和社交活动
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="搜索活动..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<span className="material-symbols-outlined text-[20px]">search</span>}
            />
          </div>
          <div className="w-full sm:w-40">
            <NeumorphicSelect
              options={CATEGORY_OPTIONS}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <NeumorphicSelect
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loading size="lg" text="加载活动中..." />
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon="event"
            title="暂无活动"
            description="没有找到符合条件的活动，请尝试调整筛选条件"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  活动列表
                </h3>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {filteredActivities.filter((a) => a.status === 'open').length} 个开放
                </span>
              </div>
              {filteredActivities.map((activity) => {
                const isSelected = selectedActivity?.id === activity.id;
                const categoryStyle = CATEGORY_STYLES[activity.category] || CATEGORY_STYLES['其他'];
                return (
                  <div
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity)}
                    className={`group cursor-pointer rounded-xl p-4 transition-all ${
                      isSelected ? 'shadow-[0_2px_8px_rgba(0,0,0,0.1)]' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--card-hover-bg)' : 'var(--card-bg)',
                      borderLeft: isSelected ? '4px solid var(--primary)' : 'none',
                      borderColor: 'var(--card-border)',
                      border: isSelected
                        ? '4px solid var(--primary)'
                        : `1px solid var(--card-border)`,
                    }}
                  >
                    <div className="flex gap-4">
                      <div
                        className="bg-cover bg-center rounded-lg size-16 shrink-0"
                        style={{ backgroundImage: `url(${activity.coverImage})` }}
                      />
                      <div className="flex flex-col justify-center min-w-0">
                        <p
                          className={`text-base font-bold leading-tight truncate`}
                          style={{ color: isSelected ? 'var(--foreground)' : 'var(--foreground)' }}
                        >
                          {activity.title}
                        </p>
                        <p
                          className="text-sm font-normal mt-1 flex items-center gap-1"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            calendar_today
                          </span>
                          {new Date(activity.startTime).toLocaleDateString('zh-CN')}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
                          >
                            {categoryStyle.label}
                          </span>
                          {activity.status === 'closed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">
                              已截止
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="lg:col-span-8 flex flex-col gap-6">
              {selectedActivity ? (
                <ActivityDetail activity={selectedActivity} />
              ) : (
                <div
                  className="rounded-xl border p-12 text-center"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <span
                    className="material-symbols-outlined text-5xl mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    touch_app
                  </span>
                  <p style={{ color: 'var(--text-secondary)' }}>选择左侧的活动查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
interface ActivityDetailProps {
  activity: Activity;
}
function ActivityDetail({ activity }: ActivityDetailProps) {
  const categoryStyle = CATEGORY_STYLES[activity.category] || CATEGORY_STYLES['其他'];
  const capacityPercent =
    activity.maxParticipants > 0
      ? Math.round((activity.currentParticipants / activity.maxParticipants) * 100)
      : 0;
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '未知';
    const date = new Date(isoString);
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const getDeadlineStatus = () => {
    if (!activity.signupDeadline) return { text: '未设置', color: 'text-gray-400' };
    const deadline = new Date(activity.signupDeadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      return { text: '已截止', color: 'text-red-400' };
    } else if (daysRemaining === 0) {
      return { text: '今天截止', color: 'text-amber-400' };
    } else if (daysRemaining <= 3) {
      return { text: `还剩 ${daysRemaining} 天`, color: 'text-amber-400' };
    } else {
      return { text: `还剩 ${daysRemaining} 天`, color: 'text-[#13ec80]' };
    }
  };
  const deadlineStatus = getDeadlineStatus();
  return (
    <>
      <div
        className="rounded-xl shadow-sm overflow-hidden border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="h-48 md:h-64 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${activity.coverImage})` }}
        >
          <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-6">
            <div className="w-full">
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    activity.status === 'open'
                      ? 'bg-[#13ec80] text-white dark:text-[#102219]'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {activity.status === 'open' ? '开放报名' : '已截止'}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
                >
                  {categoryStyle.label}
                </span>
                {activity.maxParticipants > 0 && (
                  <span className="px-3 py-1 rounded-full bg-black/50 text-white border border-white/20 text-xs font-medium backdrop-blur-sm">
                    容量: {activity.currentParticipants}/{activity.maxParticipants}
                  </span>
                )}
              </div>
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight"
                style={{ color: 'var(--foreground)' }}
              >
                {activity.title}
              </h2>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div
            className="flex flex-wrap gap-y-4 gap-x-8 pb-6 mb-6"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p
                  className="text-xs font-medium uppercase"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  日期时间
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {formatDateTime(activity.startTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <p
                  className="text-xs font-medium uppercase"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  地点
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {activity.location}
                </p>
              </div>
            </div>
            {activity.organizer && (
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p
                    className="text-xs font-medium uppercase"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    组织者
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {activity.organizer}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
                <span className="material-symbols-outlined">event</span>
              </div>
              <div>
                <p
                  className="text-xs font-medium uppercase"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  报名截止
                </p>
                <p className="text-sm font-semibold" style={{ color: deadlineStatus.color }}>
                  {deadlineStatus.text}
                </p>
              </div>
            </div>
          </div>
          {activity.maxParticipants > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>报名进度</span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {activity.currentParticipants}/{activity.maxParticipants} ({capacityPercent}%)
                </span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--border)' }}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    capacityPercent >= 100 ? 'bg-red-500' : 'bg-[#13ec80]'
                  }`}
                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            style={{ color: 'var(--foreground)' }}
          >
            <p>{activity.description}</p>
            <h4 className="font-bold mt-4 mb-2" style={{ color: 'var(--foreground)' }}>
              活动须知：
            </h4>
            <ul className="list-disc pl-5 space-y-1 marker:text-[#13ec80]">
              <li>请准时到达活动地点</li>
              <li>携带必要的设备（如工作坊需要笔记本电脑）</li>
              <li>如需取消报名，请提前24小时通知</li>
            </ul>
            {activity.category === '工作坊' && (
              <p className="mt-4 text-sm bg-amber-500/10 text-amber-200 p-3 rounded-lg border border-amber-500/20 flex items-start gap-2">
                <span className="material-symbols-outlined text-lg">info</span>
                <span>工作坊期间请保持安静，尊重讲师和其他参与者。</span>
              </p>
            )}
          </div>
        </div>
      </div>
      {activity.status === 'open' && (
        <Link
          href={`/activities/${activity.id}`}
          className="block rounded-xl shadow-sm border p-6 md:p-8 relative overflow-hidden group hover:border-[#13ec80]/50 transition-colors"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#13ec80] to-emerald-600"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded bg-[#13ec80] flex items-center justify-center text-white dark:text-[#102219]">
                <span className="material-symbols-outlined">edit_square</span>
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  立即报名
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  点击进入报名页面填写信息
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#13ec80] text-3xl group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>
      )}
    </>
  );
}