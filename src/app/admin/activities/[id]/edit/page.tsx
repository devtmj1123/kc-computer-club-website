'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect, use } from 'react';
interface ActivityFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  maxAttendees: number;
  registrationDeadline: string;
  registrationDeadlineTime: string;
  coverImageUrl: string; 
  coverImageFile: File | null; 
  status: 'draft' | 'published';
  visibility: 'public' | 'internal';
  allowedGrades: string[];
}
const INITIAL_FORM_DATA: ActivityFormData = {
  title: '',
  description: '',
  date: '',
  startTime: '19:00',
  endDate: '',
  endTime: '21:00',
  location: '',
  maxAttendees: 0,
  registrationDeadline: '',
  registrationDeadlineTime: '23:59',
  coverImageUrl: '',
  coverImageFile: null,
  status: 'draft',
  visibility: 'public',
  allowedGrades: [],
};
export default function EditActivity({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const activityId = resolvedParams.id;
  const { user } = useAuth();
  const [formData, setFormData] = useState<ActivityFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadActivity = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/activities/${activityId}`);
        const data = await response.json();
        if (data.success && data.activity) {
          const activity = data.activity;
          const startDate = activity.startTime ? new Date(activity.startTime) : null;
          const endDate = activity.endTime ? new Date(activity.endTime) : null;
          const deadlineDate = activity.signupDeadline ? new Date(activity.signupDeadline) : null;
          setFormData({
            title: activity.title || '',
            description: activity.description || '',
            date: startDate ? startDate.toISOString().split('T')[0] : '',
            startTime: startDate ? startDate.toTimeString().slice(0, 5) : '19:00',
            endDate: endDate ? endDate.toISOString().split('T')[0] : '',
            endTime: endDate ? endDate.toTimeString().slice(0, 5) : '21:00',
            location: activity.location || '',
            maxAttendees: activity.maxParticipants || 0,
            registrationDeadline: deadlineDate ? deadlineDate.toISOString().split('T')[0] : '',
            registrationDeadlineTime: deadlineDate ? deadlineDate.toTimeString().slice(0, 5) : '23:59',
            coverImageUrl: activity.coverImage || '',
            coverImageFile: null,
            status: activity.status === 'published' ? 'published' : 'draft',
            visibility: (activity.visibility as 'public' | 'internal') || 'public',
            allowedGrades: activity.allowedGrades ? JSON.parse(activity.allowedGrades) : [],
          });
        } else {
          setErrorMessage('无法加载活动数据');
        }
      } catch (err) {
        console.error('加载活动失败:', err);
        setErrorMessage('加载活动失败: ' + (err instanceof Error ? err.message : '网络错误'));
      } finally {
        setIsLoading(false);
      }
    };
    if (activityId) {
      loadActivity();
    }
  }, [activityId]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const signupDeadline = `${formData.registrationDeadline}T${formData.registrationDeadlineTime}`;
      let coverImageUrl: string | null = null;
      if (formData.coverImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.coverImageFile);
        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: uploadFormData,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResponse.ok && uploadResult.url) {
          coverImageUrl = uploadResult.url;
        } else {
          setErrorMessage('图片上传失败: ' + (uploadResult.error || '未知错误'));
          setIsSaving(false);
          return;
        }
      } else if (formData.coverImageUrl) {
        coverImageUrl = formData.coverImageUrl;
      }
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: 'workshop',
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          endDate: formData.endDate,
          location: formData.location,
          capacity: formData.maxAttendees,
          maxAttendees: formData.maxAttendees,
          registrationDeadline: formData.registrationDeadline,
          registrationDeadlineTime: formData.registrationDeadlineTime,
          signupDeadline: signupDeadline,
          organizer: user?.name || '未知管理员',
          organizerId: user?.id || '',
          coverImage: coverImageUrl,
          status: formData.status,
          visibility: formData.visibility,
          allowedGrades: formData.allowedGrades,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessMessage('活动更新成功！');
        setTimeout(() => {
          window.location.href = '/admin/activities';
        }, 1500);
      } else {
        setErrorMessage('更新失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('更新活动失败:', error);
      setErrorMessage('保存失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      setIsSaving(false);
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxAttendees' ? parseInt(value) || 0 : value,
    }));
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        coverImageFile: file,
        coverImageUrl: '',
      }));
    }
  };
  if (isLoading) {
    return (
      <AdminLayout adminName="管理员">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="加载活动数据中..." />
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout adminName="管理员">
      {successMessage && (
        <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <p className="text-green-400 font-medium">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400">error</span>
          <p className="text-red-400 font-medium">{errorMessage}</p>
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">编辑活动</h1>
          <p className="text-gray-400">修改活动信息并保存更改。</p>
        </div>
        <Link href="/admin/activities">
          <button className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label htmlFor="title" className="block text-white font-semibold mb-3">
                活动标题 *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="输入活动标题..."
                required
              />
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">活动时间 *</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-gray-400 text-sm font-medium mb-2">
                    开始日期
                  </label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-gray-400 text-sm font-medium mb-2">
                    开始时间
                  </label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-gray-400 text-sm font-medium mb-2">
                    结束日期
                  </label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-gray-400 text-sm font-medium mb-2">
                    结束时间
                  </label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
              {formData.date && formData.startTime && formData.endDate && formData.endTime && (
                <div className="mt-3 bg-[#1f2d39] rounded-lg p-3 border border-[#283946]">
                  <p className="text-gray-400 text-sm">
                    活动时间：从 <span className="text-white font-semibold">{formData.date} {formData.startTime}</span>
                    {' '}至 <span className="text-white font-semibold">{formData.endDate} {formData.endTime}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">活动地点与容量 *</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-gray-400 text-sm font-medium mb-2">
                    活动地点
                  </label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="例如：教学楼 301"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="maxAttendees" className="block text-gray-400 text-sm font-medium mb-2">
                    最大参与人数（0 = 无限制）
                  </label>
                  <Input
                    id="maxAttendees"
                    name="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">报名截止 *</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="registrationDeadline" className="block text-gray-400 text-sm font-medium mb-2">
                      截止日期
                    </label>
                    <Input
                      id="registrationDeadline"
                      name="registrationDeadline"
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="registrationDeadlineTime" className="block text-gray-400 text-sm font-medium mb-2">
                      截止时间
                    </label>
                    <Input
                      id="registrationDeadlineTime"
                      name="registrationDeadlineTime"
                      type="time"
                      value={formData.registrationDeadlineTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {formData.registrationDeadline && (
                  <div className="bg-[#1f2d39] rounded-lg p-3 border border-[#283946]">
                    <p className="text-gray-400 text-sm">
                      报名截止：<span className="text-white font-semibold">{formData.registrationDeadline} {formData.registrationDeadlineTime}</span>
                      <br />
                      {(() => {
                        const deadlineDate = new Date(`${formData.registrationDeadline}T${formData.registrationDeadlineTime}`);
                        const daysRemaining = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        if (daysRemaining > 0) {
                          return (
                            <>
                              <span className="text-[#137fec] font-semibold">
                                {daysRemaining}
                              </span>
                              {' '}天截止
                            </>
                          );
                        } else if (daysRemaining === 0) {
                          return <span className="text-amber-400 font-semibold">今天截止</span>;
                        } else {
                          return <span className="text-red-400 font-semibold">已过期</span>;
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">允许参加的年级</h3>
              <div className="space-y-3">
                {[
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
                ].map((grade) => (
                  <label key={grade.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      value={grade.value}
                      checked={formData.allowedGrades.includes(grade.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            allowedGrades: [...prev.allowedGrades, grade.value],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            allowedGrades: prev.allowedGrades.filter((g) => g !== grade.value),
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-400 text-[#137fec] focus:ring-[#137fec] cursor-pointer"
                    />
                    <span className="text-gray-300 text-sm">{grade.label}</span>
                  </label>
                ))}
              </div>
              {formData.allowedGrades.length === 0 && (
                <p className="text-yellow-400 text-sm mt-4">未选择任何年级 - 所有学生都可以报名</p>
              )}
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label htmlFor="description" className="block text-white font-semibold mb-3">
                活动描述 *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="输入活动详细描述...支持 Markdown 格式"
                required
                rows={8}
                className="w-full bg-[#1f2d39] border border-[#283946] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#137fec] transition-colors resize-none"
              />
              <p className="text-gray-500 text-sm mt-2">
                支持 Markdown 格式，包括标题、列表、链接等
              </p>
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label className="block text-white font-semibold mb-3">
                活动封面图像
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    图片链接
                  </label>
                  <Input
                    placeholder="输入图片 URL，例如：https://example.com/image.jpg"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value, coverImageFile: null }))}
                    disabled={!!formData.coverImageFile}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#283946]"></div>
                  <span className="text-gray-500 text-sm">或</span>
                  <div className="flex-1 h-px bg-[#283946]"></div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    上传图片
                  </label>
                  <label htmlFor="coverImage" className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg font-semibold text-sm hover:bg-[#0f5fcc] transition-colors cursor-pointer w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{opacity: formData.coverImageUrl ? 0.5 : 1, cursor: formData.coverImageUrl ? 'not-allowed' : 'pointer'}}>
                    <span className="material-symbols-outlined text-[20px]">image</span>
                    选择图片
                  </label>
                  <input
                    type="file"
                    id="coverImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={!!formData.coverImageUrl}
                    className="hidden"
                  />
                </div>
                {(formData.coverImageFile || formData.coverImageUrl) && (
                  <div className="relative w-full h-40 bg-[#1f2d39] rounded-lg overflow-hidden border border-[#283946]">
                    <img
                      src={
                        formData.coverImageFile
                          ? URL.createObjectURL(formData.coverImageFile)
                          : formData.coverImageUrl
                      }
                      alt="预览"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImageFile: null, coverImageUrl: '' }))}
                      className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6 sticky top-6">
              <h2 className="text-white font-semibold mb-4">预览</h2>
              <div className="bg-[#1f2d39] rounded-xl p-4 mb-4 space-y-3">
                {formData.title && (
                  <h3 className="text-white font-semibold text-sm">{formData.title}</h3>
                )}
                {formData.date && (
                  <p className="text-gray-400 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {formData.date} {formData.startTime}
                  </p>
                )}
                {formData.location && (
                  <p className="text-gray-400 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {formData.location}
                  </p>
                )}
                {formData.description && (
                  <p className="text-gray-400 text-xs line-clamp-3">
                    {formData.description.replace(/[#*`]/g, '')}
                  </p>
                )}
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="draft"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={handleChange}
                    className="cursor-pointer"
                  />
                  <label htmlFor="draft" className="text-gray-400 text-sm cursor-pointer flex-1">
                    保存为草稿
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="published"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={handleChange}
                    className="cursor-pointer"
                  />
                  <label htmlFor="published" className="text-gray-400 text-sm cursor-pointer flex-1">
                    立即发布
                  </label>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 text-sm">可见范围</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="radio"
                      id="public"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={handleChange}
                      className="cursor-pointer"
                    />
                    <label htmlFor="public" className="text-gray-400 text-sm cursor-pointer flex-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-base">public</span>
                      公开（所有人可见）
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="radio"
                      id="internal"
                      name="visibility"
                      value="internal"
                      checked={formData.visibility === 'internal'}
                      onChange={handleChange}
                      className="cursor-pointer"
                    />
                    <label htmlFor="internal" className="text-gray-400 text-sm cursor-pointer flex-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-400 text-base">lock</span>
                      内部（仅学生可见）
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-[#137fec]! hover:bg-[#0f5fcc]"
                  leftIcon={isSaving ? 'sync' : 'check'}
                  disabled={isSaving || !formData.title || !formData.location || !formData.date}
                >
                  {isSaving ? '保存中...' : '保存修改'}
                </Button>
                <Link href="/admin/activities" className="w-full">
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-[#1f2d39] hover:bg-[#283946] text-gray-400 rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-[#283946]">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors"
                >
                  删除活动
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}