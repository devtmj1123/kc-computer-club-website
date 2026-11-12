'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Signup {
  $id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  signedUpAt: string;
  status: 'attended' | 'registered' | 'cancelled' | 'pending' | 'confirmed';
}

interface Activity {
  $id: string;
  title: string;
  description?: string;
}

const statusLabels: Record<string, string> = {
  attended: '已参加',
  registered: '已注册',
  cancelled: '已取消',
  pending: '待确认',
  confirmed: '已确认',
};

const statusBadgeClasses: Record<string, string> = {
  attended:
    'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]',
  registered:
    'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]',
  confirmed:
    'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]',
  pending:
    'border-[var(--warning)]/40 bg-[var(--warning-light)] text-[var(--warning)]',
  cancelled:
    'border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]',
};

function signupKey(signup: Signup): string {
  return signup.$id || signup.id;
}

export default function ActivitySignups() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin' && activityId) {
      loadActivityAndSignups();
    }
  }, [user, activityId]);

  const loadActivityAndSignups = async () => {
    try {
      setIsLoading(true);
      setError('');
      const activityRes = await fetch(`/api/activities/${activityId}`);
      const activityData = await activityRes.json();
      if (activityData.success && activityData.activity) {
        const raw = activityData.activity as Record<string, unknown>;
        setActivity({
          $id: String(raw.$id || raw.id || ''),
          title: String(raw.title || ''),
          description:
            typeof raw.description === 'string' ? raw.description : undefined,
        });
      }
      const signupsRes = await fetch(`/api/signups?activityId=${activityId}`);
      const signupsData = await signupsRes.json();
      if (signupsData.success && signupsData.signups) {
        const formatted = (signupsData.signups as unknown[]).map((s: unknown) => {
          const signup = s as Record<string, unknown>;
          const rawStatus = String(signup.status || 'pending');
          const status = (
            ['attended', 'registered', 'cancelled', 'pending', 'confirmed'].includes(
              rawStatus
            )
              ? rawStatus
              : 'pending'
          ) as Signup['status'];
          return {
            $id: (signup.$id as string) || (signup.id as string) || '',
            id: (signup.$id as string) || (signup.id as string) || '',
            name: (signup.studentName as string) || '',
            email: (signup.email as string) || '',
            phone: (signup.phone as string) || '',
            signedUpAt: new Date(
              signup.createdAt as string
            ).toLocaleDateString('zh-CN'),
            status,
          };
        });
        setSignups(formatted);
      } else {
        setSignups([]);
        if (signupsData.error) setError(signupsData.error);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setSignups([]);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      setError('');
      const response = await fetch(`/api/signups/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSignups((prev) => prev.filter((signup) => signupKey(signup) !== id));
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除报名失败:', err);
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const confirmedCount = signups.filter(
    (s) => s.status === 'registered' || s.status === 'confirmed'
  ).length;
  const attendedCount = signups.filter((s) => s.status === 'attended').length;
  const cancelledCount = signups.filter((s) => s.status === 'cancelled').length;

  if (authLoading) {
    return (
      <AdminLayout adminName="管理员">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] px-8 py-6 text-center">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Loading signups
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout adminName="管理员">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
            Activity · Signups
          </p>
          <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            报名名单
          </h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {activity?.title
              ? `${activity.title} · 管理参与者的报名信息。`
              : '管理参与者的报名信息。'}
          </p>
        </div>
        <Link
          href="/admin/activities"
          className="inline-flex w-fit items-center gap-2 border border-[var(--border)] px-4 py-2.5 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          返回活动管理
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-px border border-[var(--rule-strong)] bg-[var(--border)] lg:grid-cols-4">
        {[
          { label: '总报名人数', note: 'TOTAL', value: signups.length },
          { label: '已确认', note: 'CONFIRMED', value: confirmedCount },
          { label: '已参加', note: 'ATTENDED', value: attendedCount },
          { label: '已取消', note: 'CANCELLED', value: cancelledCount },
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

      {error && (
        <div className="mt-5 flex items-start gap-2 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
          <span className="material-symbols-outlined text-[16px] text-[var(--error)]">error</span>
          <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
        </div>
      )}

      <section className="mt-5 border border-[var(--rule-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Participant index
          </h2>
          <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
            {String(signups.length).padStart(2, '0')} 条
          </span>
        </div>

        {isLoading ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Loading participants
            </p>
          </div>
        ) : signups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['学生', '联系方式', '报名时间', '状态', '操作'].map((label) => (
                    <th
                      key={label}
                      className={`px-5 py-3 font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)] ${
                        label === '操作' ? 'text-right' : ''
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signups.map((signup) => {
                  const id = signupKey(signup);
                  return (
                    <tr
                      key={id}
                      className="border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--primary-light)]"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] font-semibold text-[var(--foreground)]">
                          {signup.name || '未填写姓名'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-[12px] text-[var(--text-secondary)]">
                          {signup.email || '—'}
                        </p>
                        {signup.phone && (
                          <p className="mt-0.5 font-mono text-[12px] text-[var(--text-tertiary)]">
                            {signup.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                        {signup.signedUpAt}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${
                            statusBadgeClasses[signup.status] ||
                            'border-[var(--rule-strong)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {statusLabels[signup.status] || signup.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id, name: signup.name })}
                            title="删除报名"
                            aria-label={`删除 ${signup.name} 的报名`}
                            className="flex size-8 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <span className="material-symbols-outlined text-[28px] text-[var(--text-tertiary)]">
              person
            </span>
            <p className="mt-3 font-display text-[16px] font-bold text-[var(--foreground)]">
              暂无报名信息
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              该活动还没有收到报名记录。
            </p>
          </div>
        )}
      </section>

      {deleteTarget && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="animate-scale-in w-full max-w-sm border border-[var(--rule-strong)] bg-[var(--surface)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] px-5 py-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--error)]">
                Delete / Signup
              </p>
            </div>
            <div className="px-5 py-5">
              <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                确认删除报名
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                将删除 {deleteTarget.name || '该学生'} 的报名记录，此操作无法撤销。
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  isLoading={isDeleting}
                  onClick={() => handleDelete(deleteTarget.id)}
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
