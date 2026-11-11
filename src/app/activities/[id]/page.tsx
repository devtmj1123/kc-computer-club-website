'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Loading } from '@/components/ui/Loading';
import { CommentForm } from '@/components/comments/CommentForm';
import { CommentList } from '@/components/comments/CommentList';
import { useAuth } from '@/contexts/AuthContext';
import { Comment } from '@/services/comment.service';
import { decodeHtmlEntities } from '@/lib/utils';

interface Activity {
  id?: string;
  $id?: string;
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
  coverImage?: string;
  allowedGrades?: string;
  visibility?: 'public' | 'internal';
}

function formatDateParts(value: string): { day: string; month: string; full: string; time: string } {
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

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ActivityDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const activityId = Array.isArray(params.id) ? params.id[0] : String(params.id);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/activities/${activityId}`);
        const data = await response.json();
        if (data.success && data.activity) {
          const raw = data.activity;
          const signupDeadline = raw.signupDeadline ? new Date(raw.signupDeadline) : null;
          const isDeadlinePassed = signupDeadline ? signupDeadline < new Date() : false;
          setActivity({
            id: raw.$id,
            $id: raw.$id,
            title: raw.title,
            description: raw.description,
            category: raw.category,
            startTime: raw.startTime,
            endTime: raw.endTime,
            signupDeadline: raw.signupDeadline,
            location: raw.location,
            organizer: raw.organizer || null,
            maxParticipants: Number(raw.maxParticipants) || 0,
            currentParticipants: Number(raw.currentParticipants) || 0,
            status: raw.status === 'cancelled' ? 'cancelled' : isDeadlinePassed ? 'closed' : 'published',
            coverImage: raw.coverImage || undefined,
            allowedGrades: raw.allowedGrades,
            visibility: raw.visibility === 'internal' ? 'internal' : 'public',
          });
          loadComments(raw.$id);
        } else {
          setActivity(null);
        }
      } catch (err) {
        console.error('加载活动失败:', err);
        setActivity(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  const loadComments = async (id: string) => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/comments?contentType=activity&contentId=${id}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <main className="flex items-center justify-center py-32">
          <Loading size="lg" text="加载活动详情…" />
        </main>
      </StudentLayout>
    );
  }

  if (!activity) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[1200px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">404 · NOT FOUND</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            活动不存在
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            请检查链接是否正确，或返回活动列表浏览其他活动。
          </p>
          <Link
            href="/activities"
            className="mt-8 inline-flex items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="text-[13px] leading-none">←</span>
            返回活动列表
          </Link>
        </main>
      </StudentLayout>
    );
  }

  const date = formatDateParts(activity.startTime);
  const endTime = activity.endTime ? formatDateParts(activity.endTime).time : '';
  const deadline = activity.signupDeadline ? formatDateParts(activity.signupDeadline) : null;
  const now = Date.now();
  const deadlinePassed = activity.signupDeadline
    ? new Date(activity.signupDeadline).getTime() < now
    : false;
  const isFull =
    activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants;
  const isCancelled = activity.status === 'cancelled';
  const canSignup = !isCancelled && !deadlinePassed && !isFull;

  const capacityPercent =
    activity.maxParticipants > 0
      ? Math.min(
          100,
          Math.round((activity.currentParticipants / activity.maxParticipants) * 100)
        )
      : 0;

  const statusLabel = isCancelled
    ? '已取消'
    : deadlinePassed
      ? '已截止'
      : isFull
        ? '名额已满'
        : '开放报名';

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <Link href="/activities" className="transition-colors hover:text-[var(--foreground)]">
            活动
          </Link>
          <span>/</span>
          <span className="truncate text-[var(--foreground)]">
            {decodeHtmlEntities(activity.title)}
          </span>
        </nav>

        <header className="grid grid-cols-1 gap-8 border-b border-[var(--rule-strong)] pb-10 lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-12">
          <div className="flex h-fit w-24 flex-col items-center border border-[var(--rule-strong)] py-3">
            <span className="font-display text-[42px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {date.day}
            </span>
            <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              {date.month}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-[var(--primary)]/40 bg-[var(--primary-light)] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
                {activity.category || '活动'}
              </span>
              <span
                className={`border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] ${
                  canSignup
                    ? 'border-[var(--primary)]/40 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-tertiary)]'
                }`}
              >
                {statusLabel}
              </span>
              {activity.visibility === 'internal' && (
                <span className="border border-[var(--border)] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  仅限会员
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.04em] text-[var(--foreground)]">
              {decodeHtmlEntities(activity.title)}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {date.full}
                {date.time && ` · ${date.time}`}
                {endTime && ` – ${endTime}`}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                {activity.location}
              </span>
              {activity.organizer && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {activity.organizer}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="min-w-0">
            {activity.coverImage && (
              <div className="mb-10 border border-[var(--border)]">
                <img
                  src={activity.coverImage}
                  alt={activity.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            <section>
              <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                  01
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                  活动详情
                </h2>
                <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
              </div>
              <p className="mt-6 whitespace-pre-wrap text-[14px] leading-[1.95] text-[var(--text-secondary)]">
                {decodeHtmlEntities(stripHtml(activity.description)) || '暂无活动描述。'}
              </p>
            </section>

            <section className="mt-12">
              <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                  02
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                  报名信息
                </h2>
                <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
              </div>

              <dl className="mt-2">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-[var(--border)] py-4">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    报名截止
                  </dt>
                  <dd className="text-[13px] font-medium text-[var(--foreground)]">
                    {deadline
                      ? `${deadline.full}${deadline.time ? ` · ${deadline.time}` : ''}`
                      : '未设置截止时间'}
                  </dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-[var(--border)] py-4">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    名额
                  </dt>
                  <dd className="text-[13px] font-medium text-[var(--foreground)]">
                    {activity.maxParticipants > 0
                      ? `${activity.currentParticipants} / ${activity.maxParticipants} 人`
                      : `不限名额 · 已报名 ${activity.currentParticipants} 人`}
                  </dd>
                </div>
                {activity.allowedGrades && activity.allowedGrades !== '[]' && (
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-[var(--border)] py-4">
                    <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                      开放年级
                    </dt>
                    <dd className="text-[13px] font-medium text-[var(--foreground)]">
                      {(() => {
                        try {
                          const grades = JSON.parse(activity.allowedGrades || '[]');
                          return Array.isArray(grades) && grades.length > 0 ? grades.join('、') : '全校';
                        } catch {
                          return '全校';
                        }
                      })()}
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-4">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    报名方式
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    {activity.visibility === 'internal'
                      ? '本活动仅限会员报名，请先登录学生账号。'
                      : '公开活动，校内外人员均可报名。报名需通过人机验证，并等待管理员审核。'}
                  </dd>
                </div>
              </dl>

              {activity.maxParticipants > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    <span>报名进度</span>
                    <span>{capacityPercent}%</span>
                  </div>
                  <div className="mt-2 h-[3px] w-full bg-[var(--border)]">
                    <div
                      className="h-full bg-[var(--primary)] transition-all"
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="mt-12 border-t border-[var(--rule-strong)] pt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    COMMENTS
                  </span>
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    活动评论
                  </h2>
                  <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
                    {String(comments.length).padStart(2, '0')} 条
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComments(!showComments)}
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
                >
                  {showComments ? '收起' : '展开'}
                  <span className="material-symbols-outlined text-[15px]">
                    {showComments ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>

              {showComments && (
                <div className="pt-6">
                  {isLoadingComments ? (
                    <div className="py-8 text-center">
                      <Loading size="md" text="加载评论…" />
                    </div>
                  ) : (
                    <>
                      <CommentList
                        comments={comments}
                        contentType="activity"
                        contentId={activityId}
                        onCommentDeleted={() => loadComments(activityId)}
                      />
                      <div className="mt-8 border-t border-[var(--border)] pt-6">
                        <h3 className="mb-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                          <span className="material-symbols-outlined text-[15px] text-[var(--primary)]">
                            edit_note
                          </span>
                          发表评论
                        </h3>
                        <CommentForm
                          contentType="activity"
                          contentId={activityId}
                          onCommentSubmitted={() => loadComments(activityId)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>

            <div className="mt-10 border-t border-[var(--border)] pt-6">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 border-b border-transparent pb-0.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                返回活动列表
              </Link>
            </div>
          </div>

          <aside className="lg:sticky lg:top-[98px] lg:h-fit">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>REGISTRATION / 报名</span>
                <span className={canSignup ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}>
                  {statusLabel}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
                  <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    名额
                  </span>
                  <span className="font-display text-[20px] font-bold text-[var(--foreground)]">
                    {activity.maxParticipants > 0
                      ? `${activity.currentParticipants}/${activity.maxParticipants}`
                      : activity.currentParticipants}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--border)] py-3">
                  <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    截止
                  </span>
                  <span className="text-[12px] font-medium text-[var(--foreground)]">
                    {deadline ? deadline.full : '未设置'}
                  </span>
                </div>

                {isCancelled ? (
                  <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    此活动已取消，请浏览其他活动。
                  </p>
                ) : activity.visibility === 'internal' && !user ? (
                  <>
                    <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      此活动仅限会员报名，请先登录学生账号。
                    </p>
                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(
                        `/activities/${activityId}/signup`
                      )}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                    >
                      <span className="material-symbols-outlined text-[15px]">login</span>
                      登录后报名
                    </Link>
                  </>
                ) : !canSignup ? (
                  <>
                    <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {isFull ? '此活动名额已满。' : '此活动报名已截止。'}
                      你可以关注其他开放报名的活动。
                    </p>
                    <Link
                      href="/activities"
                      className="mt-4 flex w-full items-center justify-center gap-2 border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      浏览其他活动
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/activities/${activityId}/signup`}
                      className="mt-4 flex w-full items-center justify-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                    >
                      前往报名
                      <span className="text-[13px] leading-none">↗</span>
                    </Link>
                    <p className="mt-3 font-mono text-[12px] uppercase leading-relaxed tracking-[0.06em] text-[var(--text-tertiary)]">
                      公开活动需人机验证 · 提交后等待审核
                    </p>
                  </>
                )}
              </div>
            </div>

            <Link
              href="/notices"
              className="group mt-5 block border border-[var(--rule-strong)] p-4 transition-colors hover:bg-[var(--primary-light)]"
            >
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
                NOTICES / 公告
              </span>
              <span className="mt-3 block font-display text-[17px] font-semibold leading-[1.4] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                查看社团最新公告 →
              </span>
            </Link>
          </aside>
        </div>
      </main>
    </StudentLayout>
  );
}
