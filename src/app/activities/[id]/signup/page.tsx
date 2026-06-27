'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/contexts/AuthContext';
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
  coverImage: string;
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
export default function ActivitySignupPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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
      setFormData(prev => ({
        ...prev,
        email: user.email,
      }));
    }
  }, [user]);
  useEffect(() => {
    if (!authLoading && activity) {
      if (activity.visibility === 'internal' && !user) {
        router.push('/auth/login?redirect=' + encodeURIComponent(`/activities/${params.id}/signup`));
      }
    }
  }, [activity, user, authLoading, router, params.id]);
  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)', minHeight: '400px' }}>
          <Loading size="lg" text="加载中..." />
        </div>
      </StudentLayout>
    );
  }
  if (!activity || error === '活动未找到') {
    return (
      <StudentLayout>
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)', minHeight: '400px' }}>
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl mb-4" style={{ color: 'var(--primary)' }}>error</span>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>活动未找到</h2>
            <Link href="/activities">
              <Button variant="primary">返回活动列表</Button>
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }
  if (activity.visibility === 'internal' && !user) {
    return (
      <StudentLayout>
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)', minHeight: '400px' }}>
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl mb-4" style={{ color: 'var(--primary)' }}>lock</span>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>此活动仅限学生报名</h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>请先登录后再报名此活动</p>
            <Link href={`/auth/login?redirect=${encodeURIComponent(`/activities/${params.id}/signup`)}`}>
              <Button variant="primary">登录</Button>
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }
  const isFull = activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants;
  const isDeadlinePassed = new Date(activity.signupDeadline) < new Date();
  if (success) {
    return (
      <StudentLayout>
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)', minHeight: '400px' }}>
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl mb-4" style={{ color: '#13ec80' }}>check_circle</span>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>报名成功！</h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>正在返回活动详情页...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <nav className="flex items-center text-sm mb-8 font-medium" style={{ color: 'var(--text-secondary)' }}>
          <Link href="/activities" className="transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            活动
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/activities/${params.id}`} className="transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            {activity.title}
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: 'var(--foreground)' }}>报名</span>
        </nav>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--foreground)' }}>
            活动报名
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            填写以下信息完成对《{activity.title}》的报名
          </p>
          {activity.visibility === 'public' && !user && (
            <p className="mt-2 text-sm" style={{ color: '#13ec80' }}>
              <span className="material-symbols-outlined text-sm align-middle mr-1">public</span>
              此为公开活动，校外人员也可报名
            </p>
          )}
        </div>
        <div className="mb-8 rounded-xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex gap-6 items-start">
            <div className="w-32 h-32 rounded-lg flex-shrink-0 overflow-hidden">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${activity.coverImage || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop'})` }} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                {activity.title}
              </h2>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <span>{new Date(activity.startTime).toLocaleDateString('zh-CN')} {new Date(activity.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">location_on</span>
                  <span>{activity.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">group</span>
                  <span>{activity.currentParticipants} / {activity.maxParticipants || '不限'} 人</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-8 rounded-lg border-l-4 p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgb(239, 68, 68)', color: 'rgb(239, 68, 68)' }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5">error</span>
              <p>{error}</p>
            </div>
          </div>
        )}
        {isFull && (
          <div className="mb-8 rounded-lg border-l-4 p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgb(239, 68, 68)', color: 'rgb(239, 68, 68)' }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5">info</span>
              <div>
                <p className="font-semibold">报名已满</p>
                <p className="text-sm opacity-90">此活动报名人数已达上限，无法继续报名。</p>
              </div>
            </div>
          </div>
        )}
        {isDeadlinePassed && !isFull && (
          <div className="mb-8 rounded-lg border-l-4 p-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgb(245, 158, 11)', color: 'rgb(245, 158, 11)' }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5">warning</span>
              <div>
                <p className="font-semibold">报名截止</p>
                <p className="text-sm opacity-90">报名截止时间已过，但您仍可以尝试报名。</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-xl border p-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                全名 <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <Input
                type="text"
                placeholder="请输入您的全名"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                邮箱地址 <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isSubmitting || !!user}
                required
              />
              {user && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  账户邮箱地址，无法修改
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                学号
              </label>
              <Input
                type="text"
                placeholder="例如: 2024001（校外人员可留空）"
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                年级 <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <NeumorphicSelect
                options={GRADE_OPTIONS}
                value={formData.grade}
                onChange={(value) => handleInputChange('grade', value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                电话号码 <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <Input
                type="tel"
                placeholder="例如: +60 1-XXXX-XXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                附加信息
              </label>
              <textarea
                placeholder="请输入任何补充信息（可选）"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                disabled={isSubmitting}
                rows={5}
                className="w-full rounded-lg border p-3 text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                  '--tw-ring-color': 'var(--primary)',
                } as React.CSSProperties}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                您可以在此说明任何相关的信息，例如特殊需求或备注
              </p>
            </div>
            <div className="flex gap-4 pt-6">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || isFull}
                className="flex-1"
                style={{
                  opacity: isSubmitting || isFull ? 0.5 : 1,
                  cursor: isSubmitting || isFull ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">hourglass_empty</span>
                    提交中...
                  </>
                ) : isFull ? (
                  '报名已满'
                ) : (
                  '确认报名'
                )}
              </Button>
              <Link href={`/activities/${params.id}`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  取消
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </StudentLayout>
  );
}