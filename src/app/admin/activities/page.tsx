'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AdminTableSkeleton } from '@/components/ui/PageSkeletons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Activity {
  $id: string;
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  currentParticipants: number;
  maxParticipants?: number;
  signupDeadline: string;
  status: 'published' | 'draft' | 'cancelled' | 'ongoing' | 'completed';
}

const statuses = ['全部', 'published', 'draft', 'cancelled'];

const statusLabels: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  cancelled: '已取消',
  ongoing: '进行中',
  completed: '已结束',
};

function activityKey(activity: Activity): string {
  return activity.$id || activity.id || '';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待定';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusMeta(status: string): { label: string; className: string } {
  switch (status) {
    case 'published':
      return {
        label: statusLabels.published,
        className:
          'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]',
      };
    case 'ongoing':
      return {
        label: statusLabels.ongoing,
        className:
          'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]',
      };
    case 'draft':
      return {
        label: statusLabels.draft,
        className: 'border-[var(--warning)]/40 bg-[var(--warning-light)] text-[var(--warning)]',
      };
    case 'cancelled':
      return {
        label: statusLabels.cancelled,
        className: 'border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]',
      };
    case 'completed':
      return {
        label: statusLabels.completed,
        className: 'border-[var(--rule-strong)] text-[var(--text-tertiary)]',
      };
    default:
      return {
        label: status || '未知',
        className: 'border-[var(--rule-strong)] text-[var(--text-secondary)]',
      };
  }
}

export default function AdminActivities() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch('/api/activities');
        const data = await response.json();
        if (data.success && data.activities) {
          const formatted: Activity[] = (data.activities as Record<string, unknown>[]).map(
            (a) => ({
              $id: String(a.$id || a.id || ''),
              id: String(a.$id || a.id || ''),
              title: String(a.title || '未命名活动'),
              startTime: String(a.startTime || ''),
              endTime: String(a.endTime || ''),
              location: String(a.location || '待定'),
              currentParticipants: Number(a.currentParticipants) || 0,
              maxParticipants: Number(a.maxParticipants) || 0,
              signupDeadline: String(a.signupDeadline || ''),
              status: (a.status as Activity['status']) || 'draft',
            })
          );
          setActivities(formatted);
        } else {
          setActivities([]);
          setError(data.error || '');
        }
      } catch (err) {
        console.error('加载活动失败:', err);
        setActivities([]);
        setError(err instanceof Error ? err.message : '加载活动失败');
      } finally {
        setIsLoading(false);
      }
    };
    if (user && 'role' in user && user.role === 'admin') {
      loadActivities();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      setError('');
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setActivities((prev) => prev.filter((activity) => activityKey(activity) !== id));
        setDeleteId(null);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const keyword = searchTerm.toLowerCase();
    const matchSearch =
      activity.title.toLowerCase().includes(keyword) ||
      activity.location.toLowerCase().includes(keyword);
    const matchStatus = selectedStatus === '全部' || activity.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const publishedCount = activities.filter((a) => a.status === 'published').length;
  const draftCount = activities.filter((a) => a.status === 'draft').length;
  const participantCount = activities.reduce(
    (sum, a) => sum + (a.currentParticipants || 0),
    0
  );

  return (
    <AdminLayout adminName="管理员">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
            Content · Activities
          </p>
          <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            活动管理
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            管理社团的所有活动，支持创建、编辑和取消活动。
          </p>
        </div>
        <Link
          href="/admin/activities/create"
          className="inline-flex w-fit items-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          <span className="text-[14px] leading-none">+</span>
          创建活动
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-px border border-[var(--rule-strong)] bg-[var(--border)] lg:grid-cols-4">
        {[
          { label: '活动总数', note: 'TOTAL', value: activities.length },
          { label: '已发布', note: 'PUBLISHED', value: publishedCount },
          { label: '草稿中', note: 'DRAFTS', value: draftCount },
          { label: '参与人数', note: 'SIGNUPS', value: participantCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--surface)] px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {stat.label}
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] sm:block">
                {stat.note}
              </span>
            </div>
            <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {String(stat.value).padStart(2, '0')}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-5 flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`h-8 border px-3 font-mono text-[12px] uppercase tracking-[0.06em] transition-colors ${
                selectedStatus === status
                  ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              }`}
            >
              {status === '全部' ? '全部' : statusLabels[status]}
            </button>
          ))}
        </div>
        <Input
          type="text"
          placeholder="搜索活动名称或地点…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon="search"
          containerClassName="w-full sm:w-72"
        />
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
          <span className="material-symbols-outlined text-[16px] text-[var(--error)]">error</span>
          <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
        </div>
      )}

      <section className="mt-5 border border-[var(--rule-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Activity index
          </h2>
          <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
            {String(filteredActivities.length).padStart(2, '0')} 条
          </span>
        </div>

        <div className="hidden border-b border-[var(--border)] px-5 py-3 md:grid md:grid-cols-[minmax(0,1fr)_132px_100px_88px_124px] md:gap-4">
          {['活动', '时间', '报名', '状态', '操作'].map((label) => (
            <span
              key={label}
              className={`font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] ${
                label === '操作' ? 'text-right' : ''
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        {isLoading ? (
          <AdminTableSkeleton rows={6} columns={5} className="border-0" />
        ) : filteredActivities.length > 0 ? (
          <div>
            {filteredActivities.map((activity) => {
              const id = activityKey(activity);
              const status = statusMeta(activity.status);
              const capacity = activity.maxParticipants || 0;
              const percent =
                capacity > 0
                  ? Math.min(
                      100,
                      Math.round((activity.currentParticipants / capacity) * 100)
                    )
                  : 0;
              return (
                <div
                  key={id}
                  className="grid grid-cols-1 gap-3 border-b border-[var(--border)] px-5 py-4 transition-colors last:border-b-0 hover:bg-[var(--primary-light)] md:grid-cols-[minmax(0,1fr)_132px_100px_88px_124px] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[12px] font-semibold text-[var(--foreground)]">
                        {activity.title}
                      </h3>
                      <span className="md:hidden">
                        <span
                          className={`inline-flex border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                      {activity.location}
                    </p>
                  </div>

                  <div className="font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    <span className="block">{formatDate(activity.startTime)}</span>
                    <span className="block text-[var(--text-tertiary)]">
                      {formatTime(activity.startTime)}
                      {activity.endTime ? ` – ${formatTime(activity.endTime)}` : ''}
                    </span>
                  </div>

                  <div>
                    <p className="font-mono text-[12px] text-[var(--text-secondary)]">
                      {activity.currentParticipants}
                      {capacity > 0 ? ` / ${capacity}` : ' / 不限'} 人
                    </p>
                    <div className="mt-1.5 h-1 w-full bg-[var(--border)]">
                      <div
                        className="h-full bg-[var(--primary)]"
                        style={{ width: `${capacity > 0 ? percent : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <span
                      className={`inline-flex border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 md:justify-end">
                    <Link
                      href={`/admin/activities/${id}/edit`}
                      title="编辑活动"
                      aria-label="编辑活动"
                      className="flex size-8 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </Link>
                    <Link
                      href={`/admin/activities/${id}/signups`}
                      title="查看报名"
                      aria-label="查看报名"
                      className="flex size-8 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <span className="material-symbols-outlined text-[16px]">group</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteId(id)}
                      title="删除活动"
                      aria-label="删除活动"
                      className="flex size-8 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <span className="material-symbols-outlined text-[28px] text-[var(--text-tertiary)]">
              event
            </span>
            <p className="mt-3 font-display text-[16px] font-bold text-[var(--foreground)]">
              没有找到活动
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {activities.length === 0 ? '创建第一个活动来开始。' : '尝试调整搜索或状态筛选。'}
            </p>
            {activities.length === 0 && (
              <Link
                href="/admin/activities/create"
                className="mt-4 inline-flex h-9 items-center border border-[var(--primary)] px-3 text-[12px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-light)]"
              >
                创建第一个活动
              </Link>
            )}
          </div>
        )}
      </section>

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          onClick={() => !isDeleting && setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm border border-[var(--rule-strong)] bg-[var(--surface)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] px-5 py-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--error)]">
                Delete / Activity
              </p>
            </div>
            <div className="px-5 py-5">
              <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                确定删除此活动？
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                删除后将无法恢复，该活动的所有报名数据也将被清除。
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  isLoading={isDeleting}
                  onClick={() => deleteId && handleDelete(deleteId)}
                >
                  确认删除
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
