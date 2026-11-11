'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { decodeHtmlEntities } from '@/lib/utils';

interface SignupFormData {
  fullName: string;
  email: string;
  studentId: string;
  grade: string;
  phone: string;
  additionalInfo: string;
}

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

const GRADE_OPTIONS = [
  { value: '', label: '选择年级' },
  { value: 'junior_1', label: '初一' },
  { value: 'junior_2', label: '初二' },
  { value: 'junior_3', label: '初三' },
  { value: 'senior_1_science', label: '高一理科' },
  { value: 'senior_2_science', label: '高二理科' },
  { value: 'senior_3_science', label: '高三理科' },
  { value: 'senior_1_commerce', label: '高一纯商' },
  { value: 'senior_2_commerce', label: '高二纯商' },
  { value: 'senior_3_commerce', label: '高三纯商' },
  { value: 'senior_1_arts', label: '高一文' },
  { value: 'senior_2_arts', label: '高二文' },
  { value: 'senior_3_arts', label: '高三文' },
  { value: 'other', label: '其他（校外人员）' },
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '待定';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')} · ${date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function ActivitySignupPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    studentId: '',
    grade: '',
    phone: '',
    additionalInfo: '',
  });

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/activities/${params.id}`);
        const data = await response.json();
        if (data.success && data.activity) {
          setActivity(data.activity);
        } else {
          setError('活动未找到');
        }
      } catch (err) {
        console.error('Failed to load activity:', err);
        setError('加载活动失败');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) {
      loadActivity();
    }
  }, [params.id]);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && activity) {
      if (activity.visibility === 'internal' && !user) {
        router.push(
          '/auth/login?redirect=' + encodeURIComponent(`/activities/${params.id}/signup`)
        );
      }
    }
  }, [activity, user, authLoading, router, params.id]);

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim()) {
      setError('请输入您的全名');
      return;
    }
    if (!formData.email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    if (!formData.grade) {
      setError('请选择您的年级');
      return;
    }
    if (!formData.phone.trim()) {
      setError('请输入电话号码');
      return;
    }

    setIsSubmitting(true);
    try {
      let recaptchaToken: string | undefined;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('activity_signup');
        } catch (captchaError) {
          console.error('人机验证初始化失败:', captchaError);
        }
      }

      const response = await fetch('/api/activities/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: params.id,
          fullName: formData.fullName,
          email: formData.email,
          studentId: formData.studentId,
          grade: formData.grade,
          phone: formData.phone,
          additionalInfo: formData.additionalInfo,
          userId: user?.id || null,
          recaptchaToken,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/activities/${params.id}`);
        }, 2000);
      } else {
        setError(result.error || '报名失败，请稍后重试');
      }
    } catch (err) {
      console.error('Signup failed:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <StudentLayout>
        <main className="flex items-center justify-center py-32">
          <Loading size="lg" text="加载报名信息…" />
        </main>
      </StudentLayout>
    );
  }

  if (!activity || error === '活动未找到') {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[900px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">404 · NOT FOUND</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            活动未找到
          </h1>
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

  if (activity.visibility === 'internal' && !user) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[900px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">MEMBERS ONLY · 仅限会员</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            此活动仅限学生报名
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            请先登录学生账号，再返回此页面完成报名。
          </p>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(
              `/activities/${params.id}/signup`
            )}`}
            className="mt-8 inline-flex items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[15px]">login</span>
            登录账号
          </Link>
        </main>
      </StudentLayout>
    );
  }

  const isFull =
    activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants;
  const isDeadlinePassed = new Date(activity.signupDeadline) < new Date();

  if (success) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[900px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">SUBMITTED · 已提交</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            报名成功！
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            你的报名已提交，正在等待管理员审核。即将返回活动详情页…
          </p>
          <div className="mt-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            PENDING REVIEW
          </div>
        </main>
      </StudentLayout>
    );
  }

  const title = decodeHtmlEntities(activity.title);

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/activities" className="transition-colors hover:text-[var(--foreground)]">
            活动
          </Link>
          <span>/</span>
          <Link
            href={`/activities/${params.id}`}
            className="max-w-[220px] truncate transition-colors hover:text-[var(--foreground)]"
          >
            {title}
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">报名</span>
        </nav>

        <header className="border-b border-[var(--rule-strong)] pb-8">
          <div className="eyebrow">ACTIVITY SIGNUP · 活动报名</div>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--foreground)]">
            填写报名信息。
          </h1>
          <p className="mt-4 max-w-2xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            你正在报名《{title}》。提交后报名将进入审核状态，请确认信息填写正确。
          </p>
          {activity.visibility === 'public' && !user && (
            <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--primary)]">
              <span className="material-symbols-outlined text-[13px]">public</span>
              公开活动 · 校外人员也可报名
            </p>
          )}
        </header>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
          <section className="min-w-0">
            {error && (
              <div className="mb-6 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
                  error
                </span>
                <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
              </div>
            )}

            {isFull && (
              <div className="mb-6 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
                  info
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--error)]">报名已满</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--error)]">
                    此活动报名人数已达上限，无法继续报名。
                  </p>
                </div>
              </div>
            )}

            {isDeadlinePassed && !isFull && (
              <div className="mb-6 flex items-start gap-3 border border-[var(--warning)]/30 bg-[var(--warning-light)] px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--warning)]">
                  warning
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--warning)]">报名截止</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--warning)]">
                    报名截止时间已过，提交后仍需管理员确认。
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="border border-[var(--rule-strong)]">
              <div className="border-b border-[var(--border)] px-5 py-3.5 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                FORM / 报名资料
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <Input
                  label="全名"
                  type="text"
                  placeholder="请输入您的全名"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={isSubmitting}
                  required
                />

                <Input
                  label="邮箱地址"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isSubmitting || !!user}
                  hint={user ? '账户邮箱地址，无法修改' : '用于接收报名审核结果'}
                  required
                />

                <Input
                  label="学号"
                  type="text"
                  placeholder="例如：2024001（校外人员可留空）"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  disabled={isSubmitting}
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <NeumorphicSelect
                    label="年级"
                    options={GRADE_OPTIONS}
                    value={formData.grade}
                    onChange={(value) => handleInputChange('grade', value)}
                    disabled={isSubmitting}
                  />

                  <Input
                    label="电话号码"
                    type="tel"
                    placeholder="例如：+60 1-XXXX-XXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="additionalInfo"
                    className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                  >
                    附加信息
                  </label>
                  <textarea
                    id="additionalInfo"
                    placeholder="补充说明（可选）"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                  />
                  <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                    例如特殊需求、备注或其他需要说明的信息
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] p-5 sm:flex-row sm:items-center sm:p-6">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting || isFull}
                  isLoading={isSubmitting}
                  className="sm:min-w-[160px]"
                >
                  确认报名
                </Button>
                <Link
                  href={`/activities/${params.id}`}
                  className="inline-flex items-center justify-center border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  取消
                </Link>
              </div>
            </form>
          </section>

          <aside className="lg:sticky lg:top-[98px] lg:h-fit">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>ACTIVITY / 活动</span>
                <span className="text-[var(--primary)]">
                  {activity.visibility === 'internal' ? 'MEMBER' : 'PUBLIC'}
                </span>
              </div>

              {activity.coverImage && (
                <img
                  src={activity.coverImage}
                  alt={activity.title}
                  className="h-32 w-full border-b border-[var(--border)] object-cover"
                />
              )}

              <div className="p-4">
                <h2 className="font-display text-[17px] font-semibold leading-[1.45] tracking-[-0.01em] text-[var(--foreground)]">
                  {title}
                </h2>

                <div className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-3.5 font-mono text-[12px] tracking-[0.02em] text-[var(--text-tertiary)]">
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                    {formatDateTime(activity.startTime)}
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {activity.location}
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[13px]">group</span>
                    {activity.currentParticipants} / {activity.maxParticipants || '不限'} 人
                  </p>
                </div>
              </div>

              <Link
                href={`/activities/${params.id}`}
                className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
              >
                返回活动详情
                <span>→</span>
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </StudentLayout>
  );
}
