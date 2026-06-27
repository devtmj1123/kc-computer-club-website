'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { Loading } from '@/components/ui/Loading';
import { CommentForm } from '@/components/comments/CommentForm';
import { CommentList } from '@/components/comments/CommentList';
import { useAuth } from '@/contexts/AuthContext';
import { Comment } from '@/services/comment.service';
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
}
const YEAR_OPTIONS = [
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
];
export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    yearMajor: '',
    className: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (user?.email) {
      const emailPrefix = user.email.replace(/[^0-9]/g, '').slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        name: emailPrefix,
        studentId: emailPrefix,
        email: user.email,
      }));
    }
  }, [user?.email]);
  useEffect(() => {
    const loadActivity = async () => {
      try {
        setIsLoading(true);
        const activityId = Array.isArray(params.id) ? params.id[0] : String(params.id);
        const response = await fetch(`/api/activities/${activityId}`);
        const data = await response.json();
        if (data.success && data.activity) {
          const activity = data.activity;
          const signupDeadline = activity.signupDeadline ? new Date(activity.signupDeadline) : null;
          const isDeadlinePassed = signupDeadline ? signupDeadline < new Date() : false;
          setActivity({
            id: activity.$id,
            $id: activity.$id,
            title: activity.title,
            description: activity.description,
            category: activity.category,
            startTime: activity.startTime,
            endTime: activity.endTime,
            signupDeadline: activity.signupDeadline,
            location: activity.location,
            organizer: activity.organizer || null,
            maxParticipants: activity.maxParticipants || 0,
            currentParticipants: activity.currentParticipants || 0,
            status: isDeadlinePassed ? 'closed' : 'published',
            coverImage:
              activity.coverImage ||
              'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop',
            allowedGrades: activity.allowedGrades,
          });
          loadComments(activity.$id);
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
    loadActivity();
  }, [params.id]);
  const loadComments = async (activityId: string) => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/comments?contentType=activity&contentId=${activityId}`);
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
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.yearMajor) {
      newErrors.yearMajor = '请选择年级';
    }
    if (!formData.className.trim()) {
      newErrors.className = '请输入班级';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const activityId = Array.isArray(params.id) ? params.id[0] : String(params.id);
      const checkRes = await fetch(
        `/api/signups?activityId=${activityId}&email=${encodeURIComponent(formData.email)}`
      );
      const checkData = await checkRes.json();
      if (checkData.success && checkData.signups && checkData.signups.length > 0) {
        setToastType('error');
        setToastMessage('你已经报名过这个活动了！');
        setShowToast(true);
        setIsSubmitting(false);
        return;
      }
      const response = await fetch('/api/signups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: params.id,
          activityTitle: activity?.title,
          studentName: formData.name,
          studentEmail: formData.email,
          studentId: formData.studentId,
          year: formData.yearMajor,
          className: formData.className,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setToastType('success');
        setToastMessage('报名成功！我们将通过邮件发送确认信息。');
        setShowToast(true);
        setFormData({
          name: '',
          studentId: '',
          email: '',
          yearMajor: '',
          className: '',
        });
        setTimeout(() => {
          router.push('/activities');
        }, 3000);
      } else {
        setToastType('error');
        setToastMessage(data.error || '报名失败，请重试');
        setShowToast(true);
      }
    } catch (err) {
      console.error('报名失败:', err);
      setToastType('error');
      setToastMessage('网络错误，请重试');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <StudentLayout>
        <main
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          <Loading size="lg" text="加载活动详情..." />
        </main>
      </StudentLayout>
    );
  }
  if (!activity) {
    return (
      <StudentLayout>
        <main
          className="flex-1 flex flex-col items-center justify-center py-20"
          style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          <span
            className="material-symbols-outlined text-6xl mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            event_busy
          </span>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            活动不存在
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            请检查链接是否正确，或返回活动列表
          </p>
          <Link href="/activities">
            <Button variant="primary" leftIcon="arrow_back">
              返回活动列表
            </Button>
          </Link>
        </main>
      </StudentLayout>
    );
  }
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
    <StudentLayout>
      <main
        className="flex-1 w-full max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <nav
          className="flex items-center text-sm mb-6 font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Link href="/" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>
            首页
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/activities"
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            活动
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: 'var(--foreground)' }} className="truncate max-w-50">
            {activity.title}
          </span>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
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
                          activity.status === 'published'
                            ? 'bg-[#13ec80] text-[#102219]'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {activity.status === 'published' ? '开放报名' : '已截止'}
                      </span>
                      {activity.maxParticipants > 0 && (
                        <span className="px-3 py-1 rounded-full bg-black/50 text-white border border-white/20 text-xs font-medium backdrop-blur-sm">
                          容量: {activity.currentParticipants}/{activity.maxParticipants}
                        </span>
                      )}
                    </div>
                    <h1 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
                      {activity.title}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div
                  className="flex flex-wrap gap-y-4 gap-x-8 pb-6 border-b mb-6"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                    >
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
                    <div
                      className="size-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                    >
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
                      <div
                        className="size-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                      >
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
                    <div
                      className="size-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                    >
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium uppercase"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        报名截止
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color:
                            deadlineStatus.color === 'text-red-400'
                              ? '#ff6b6b'
                              : deadlineStatus.color === 'text-amber-400'
                                ? '#ffd43b'
                                : 'var(--primary)',
                        }}
                      >
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
                        {activity.currentParticipants}/{activity.maxParticipants} ({capacityPercent}
                        %)
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--border)' }}
                    >
                      <div
                        className={`h-full rounded-full transition-all`}
                        style={{
                          width: `${Math.min(capacityPercent, 100)}%`,
                          backgroundColor: capacityPercent >= 100 ? '#ff6b6b' : 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <p style={{ color: 'var(--foreground)' }}>{activity.description}</p>
                  <h4 className="font-bold mt-6 mb-3" style={{ color: 'var(--foreground)' }}>
                    活动须知：
                  </h4>
                  <ul
                    className="list-disc pl-5 space-y-1 marker:text-primary"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <li>请准时到达活动地点</li>
                    <li>携带必要的设备（如工作坊需要笔记本电脑）</li>
                    <li>如需取消报名，请提前24小时通知</li>
                  </ul>
                  {activity.category === '工作坊' && (
                    <p
                      className="mt-4 text-sm p-3 rounded-lg border flex items-start gap-2"
                      style={{
                        backgroundColor: 'var(--primary) / 0.1',
                        borderColor: 'var(--primary) / 0.3',
                        color: 'var(--primary)',
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">info</span>
                      <span>工作坊期间请保持安静，尊重讲师和其他参与者。</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div
              className="mt-8 rounded-xl shadow-sm overflow-hidden border p-6 md:p-8"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="size-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                >
                  <span className="material-symbols-outlined">comment</span>
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  活动评论
                </h3>
                <span className="text-sm ml-auto" style={{ color: 'var(--text-secondary)' }}>
                  {comments.length} 条评论
                </span>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--primary)' }}
                  title={showComments ? '隐藏评论' : '显示评论'}
                >
                  <span className="material-symbols-outlined">
                    {showComments ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
              {showComments && (
                <>
                  {isLoadingComments ? (
                    <div className="text-center py-8">
                      <Loading size="md" text="加载评论..." />
                    </div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <CommentList
                          comments={comments}
                          contentType="activity"
                          contentId={Array.isArray(params.id) ? params.id[0] : String(params.id)}
                          onCommentDeleted={() =>
                            loadComments(
                              Array.isArray(params.id) ? params.id[0] : String(params.id)
                            )
                          }
                        />
                      </div>
                      <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                        <h4
                          className="text-sm font-bold mb-4 flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <span className="material-symbols-outlined text-lg">edit_note</span>
                          发表评论
                        </h4>
                        <CommentForm
                          contentType="activity"
                          contentId={Array.isArray(params.id) ? params.id[0] : String(params.id)}
                          onCommentSubmitted={() =>
                            loadComments(
                              Array.isArray(params.id) ? params.id[0] : String(params.id)
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="mt-6">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                返回活动列表
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {!user ? (
                <div
                  className="rounded-xl shadow-sm border p-6 md:p-8 text-center"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ backgroundColor: 'var(--primary) / 0.2' }}
                  >
                    <span
                      className="material-symbols-outlined text-4xl"
                      style={{ color: 'var(--primary)' }}
                    >
                      lock
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    需要登录才能报名
                  </h3>
                  <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    请先登录或注册账号，然后就可以报名这个活动
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors w-full"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                    >
                      <span className="material-symbols-outlined">login</span>
                      登录账号
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors w-full"
                      style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                    >
                      <span className="material-symbols-outlined">person_add</span>
                      创建新账号
                    </Link>
                  </div>
                  <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
                    已有账号？
                    <Link
                      href="/auth/login"
                      className="hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      登录
                    </Link>
                  </p>
                </div>
              ) : activity.status === 'published' ? (
                <div
                  className="rounded-xl shadow-sm border p-6 md:p-8 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{
                      backgroundImage: 'linear-gradient(to right, var(--primary), #2ecc71)',
                    }}
                  ></div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="size-10 rounded flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                    >
                      <span className="material-symbols-outlined">edit_square</span>
                    </div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                      立即报名
                    </h3>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="name">
                        姓名 <span className="text-red-400">*</span>
                      </label>
                      <Input
                        id="name"
                        placeholder="请输入您的姓名"
                        value={formData.name}
                        disabled
                        rightIcon={
                          <span className="material-symbols-outlined text-[20px]">badge</span>
                        }
                      />
                      <p className="text-xs text-[#9db9ab]">自动从邮箱提取</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="studentId">
                        学号 <span className="text-red-400">*</span>
                      </label>
                      <Input
                        id="studentId"
                        placeholder="请输入您的学号"
                        value={formData.studentId}
                        disabled
                        rightIcon={
                          <span className="material-symbols-outlined text-[20px]">numbers</span>
                        }
                      />
                      <p className="text-xs text-[#9db9ab]">自动从邮箱提取</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="email">
                        邮箱 <span className="text-red-400">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@school.edu"
                        value={formData.email}
                        disabled
                        rightIcon={
                          <span className="material-symbols-outlined text-[20px]">mail</span>
                        }
                      />
                      <p className="text-xs text-[#9db9ab]">我们将通过此邮箱发送活动确认信息</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="yearMajor">
                        年级 <span className="text-red-400">*</span>
                      </label>
                      <NeumorphicSelect
                        options={
                          activity.allowedGrades
                            ? YEAR_OPTIONS.filter(
                                (opt) =>
                                  opt.value === '' ||
                                  JSON.parse(activity.allowedGrades || '[]').includes(opt.value)
                              )
                            : YEAR_OPTIONS
                        }
                        value={formData.yearMajor}
                        onChange={(value) => setFormData({ ...formData, yearMajor: value })}
                        error={errors.yearMajor}
                      />
                      {activity.allowedGrades && JSON.parse(activity.allowedGrades).length > 0 && (
                        <p className="text-xs text-[#9db9ab]">
                          仅限{' '}
                          {JSON.parse(activity.allowedGrades)
                            .map((g: string) => YEAR_OPTIONS.find((o) => o.value === g)?.label || g)
                            .join('、')}{' '}
                          学生报名
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="className">
                        班级 <span className="text-red-400">*</span>
                      </label>
                      <Input
                        id="className"
                        placeholder="请输入您的班级，例如：初一 A 班"
                        value={formData.className}
                        onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                        rightIcon={
                          <span className="material-symbols-outlined text-[20px]">groups</span>
                        }
                        error={errors.className}
                      />
                    </div>
                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        glow
                        isLoading={isSubmitting}
                        rightIcon="arrow_forward"
                        className="w-full"
                      >
                        确认报名
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div
                  className="rounded-xl shadow-sm border p-6 md:p-8 text-center"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <span
                    className="material-symbols-outlined text-5xl mb-4"
                    style={{ color: '#ff6b6b' }}
                  >
                    event_busy
                  </span>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    报名已截止
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    该活动报名已结束，请关注其他活动
                  </p>
                  <Link href="/activities">
                    <Button variant="secondary" leftIcon="event">
                      浏览其他活动
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xl ${
              toastType === 'success'
                ? 'bg-green-500/20 border-green-500/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                toastType === 'success' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {toastType === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className="text-sm text-white">{toastMessage}</p>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}