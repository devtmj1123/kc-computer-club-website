'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  use,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';

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

const grades = [
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

function parseAllowedGrades(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }
  return [];
}

function EditorSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[var(--rule-strong)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--border)] px-4 py-2.5 sm:px-5">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {title}
        </h2>
        <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
          {index}
        </span>
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function ChoiceRow({
  id,
  name,
  value,
  label,
  note,
  checked,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  label: string;
  note: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center justify-between border px-3 py-2.5 transition-colors ${
        checked
          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
          : 'border-[var(--border)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="size-3.5 accent-[var(--primary)]"
        />
        <span className="text-[12px] text-[var(--foreground)]">{label}</span>
      </span>
      <span
        className={`font-mono text-[12px] uppercase tracking-[0.08em] ${
          checked ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
        }`}
      >
        {note}
      </span>
    </label>
  );
}

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
          const deadlineDate = activity.signupDeadline
            ? new Date(activity.signupDeadline)
            : null;
          setFormData({
            title: activity.title || '',
            description: activity.description || '',
            date: startDate ? startDate.toISOString().split('T')[0] : '',
            startTime: startDate ? startDate.toTimeString().slice(0, 5) : '19:00',
            endDate: endDate ? endDate.toISOString().split('T')[0] : '',
            endTime: endDate ? endDate.toTimeString().slice(0, 5) : '21:00',
            location: activity.location || '',
            maxAttendees: activity.maxParticipants || 0,
            registrationDeadline: deadlineDate
              ? deadlineDate.toISOString().split('T')[0]
              : '',
            registrationDeadlineTime: deadlineDate
              ? deadlineDate.toTimeString().slice(0, 5)
              : '23:59',
            coverImageUrl: activity.coverImage || '',
            coverImageFile: null,
            status: activity.status === 'published' ? 'published' : 'draft',
            visibility: (activity.visibility as 'public' | 'internal') || 'public',
            allowedGrades: parseAllowedGrades(activity.allowedGrades),
          });
        } else {
          setErrorMessage('无法加载活动数据');
        }
      } catch (err) {
        console.error('加载活动失败:', err);
        setErrorMessage(
          '加载活动失败: ' + (err instanceof Error ? err.message : '网络错误')
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  const handleSubmit = async (e: FormEvent) => {
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
      setErrorMessage(
        '保存失败: ' + (error instanceof Error ? error.message : '网络错误')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxAttendees' ? parseInt(value) || 0 : value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] px-8 py-6 text-center">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Loading activity
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName="管理员">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
            Content · Activities · Edit
          </p>
          <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            编辑活动
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            修改活动信息并保存更改。
          </p>
        </div>
        <Link
          href="/admin/activities"
          aria-label="返回活动管理"
          className="flex size-9 shrink-0 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--rule-strong)] hover:text-[var(--foreground)]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </Link>
      </div>

      {successMessage && (
        <div className="mb-4 flex items-center gap-2 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-4 py-3">
          <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
            check_circle
          </span>
          <p className="text-[12px] text-[var(--primary)]">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
          <span className="material-symbols-outlined text-[16px] text-[var(--error)]">
            error
          </span>
          <p className="text-[12px] leading-relaxed text-[var(--error)]">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-6xl">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <EditorSection index="01" title="活动标题">
              <Input
                id="title"
                name="title"
                label="活动标题"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="输入活动标题…"
              />
            </EditorSection>

            <EditorSection index="02" title="活动时间">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  label="开始日期"
                  required
                  value={formData.date}
                  onChange={handleChange}
                />
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  label="开始时间"
                  value={formData.startTime}
                  onChange={handleChange}
                />
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  label="结束日期"
                  value={formData.endDate}
                  onChange={handleChange}
                />
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  label="结束时间"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
              {formData.date &&
                formData.startTime &&
                formData.endDate &&
                formData.endTime && (
                  <div className="mt-4 border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                    <p className="font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      从{' '}
                      <span className="text-[var(--foreground)]">
                        {formData.date} {formData.startTime}
                      </span>{' '}
                      至{' '}
                      <span className="text-[var(--foreground)]">
                        {formData.endDate} {formData.endTime}
                      </span>
                    </p>
                  </div>
                )}
            </EditorSection>

            <EditorSection index="03" title="地点与容量">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="location"
                  name="location"
                  label="活动地点"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="例如：教学楼 301"
                />
                <Input
                  id="maxAttendees"
                  name="maxAttendees"
                  type="number"
                  label="最大参与人数（0 = 无限制）"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </EditorSection>

            <EditorSection index="04" title="报名截止">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="registrationDeadline"
                  name="registrationDeadline"
                  type="date"
                  label="截止日期"
                  required
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                />
                <Input
                  id="registrationDeadlineTime"
                  name="registrationDeadlineTime"
                  type="time"
                  label="截止时间"
                  value={formData.registrationDeadlineTime}
                  onChange={handleChange}
                />
              </div>
              {formData.registrationDeadline && (
                <div className="mt-4 border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                  <p className="font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    截止至{' '}
                    <span className="text-[var(--foreground)]">
                      {formData.registrationDeadline} {formData.registrationDeadlineTime}
                    </span>
                    <br />
                    {(() => {
                      const deadlineDate = new Date(
                        `${formData.registrationDeadline}T${formData.registrationDeadlineTime}`
                      );
                      const daysRemaining = Math.ceil(
                        (deadlineDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      if (daysRemaining > 0) {
                        return (
                          <span className="text-[var(--primary)]">
                            {daysRemaining} 天截止
                          </span>
                        );
                      }
                      if (daysRemaining === 0) {
                        return (
                          <span className="text-[var(--warning)]">今天截止</span>
                        );
                      }
                      return <span className="text-[var(--error)]">已过期</span>;
                    })()}
                  </p>
                </div>
              )}
            </EditorSection>

            <EditorSection index="05" title="允许参加的年级">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {grades.map((grade) => (
                  <label
                    key={grade.value}
                    className="flex cursor-pointer items-center gap-2 py-1"
                  >
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
                            allowedGrades: prev.allowedGrades.filter(
                              (g) => g !== grade.value
                            ),
                          }));
                        }
                      }}
                      className="size-4 accent-[var(--primary)]"
                    />
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      {grade.label}
                    </span>
                  </label>
                ))}
              </div>
              {formData.allowedGrades.length === 0 && (
                <p className="mt-4 border border-[var(--warning)]/40 bg-[var(--warning-light)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--warning)]">
                  未选择任何年级 - 所有学生都可以报名
                </p>
              )}
            </EditorSection>

            <EditorSection index="06" title="活动描述">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="description"
                  className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  活动描述 <span className="text-[var(--error)]">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="输入活动详细描述…支持 Markdown 格式"
                  required
                  rows={9}
                  className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] leading-7 text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                />
                <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                  支持标题、列表、链接等 Markdown 语法
                </p>
              </div>
            </EditorSection>

            <EditorSection index="07" title="活动封面">
              <Input
                label="图片链接"
                placeholder="输入图片 URL，例如：https://example.com/image.jpg"
                value={formData.coverImageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    coverImageUrl: e.target.value,
                    coverImageFile: null,
                  }))
                }
                disabled={!!formData.coverImageFile}
              />

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                  或
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <label
                htmlFor="coverImage"
                className={`inline-flex h-10 items-center gap-2 border border-[var(--border)] px-4 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors ${
                  formData.coverImageUrl
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">image</span>
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

              {(formData.coverImageFile || formData.coverImageUrl) && (
                <div className="relative mt-4 h-44 w-full overflow-hidden border border-[var(--border)] bg-[var(--surface-hover)]">
                  <img
                    src={
                      formData.coverImageFile
                        ? URL.createObjectURL(formData.coverImageFile)
                        : formData.coverImageUrl
                    }
                    alt="预览"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        coverImageFile: null,
                        coverImageUrl: '',
                      }))
                    }
                    aria-label="移除封面"
                    className="absolute right-2 top-2 flex size-7 items-center justify-center bg-[var(--error)] text-[var(--error-contrast)]"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              )}
            </EditorSection>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="border border-[var(--rule-strong)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-4 py-2.5">
                <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Preview
                </h2>
              </div>
              <div className="px-4 py-4">
                <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <h3 className="font-display text-[15px] font-bold leading-snug text-[var(--foreground)]">
                    {formData.title || '未命名活动'}
                  </h3>
                  <div className="mt-2 space-y-1.5">
                    {formData.date && (
                      <p className="flex items-center gap-2 font-mono text-[12px] text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-[13px]">
                          calendar_today
                        </span>
                        {formData.date} {formData.startTime}
                      </p>
                    )}
                    {formData.location && (
                      <p className="flex items-center gap-2 font-mono text-[12px] text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-[13px]">
                          location_on
                        </span>
                        {formData.location}
                      </p>
                    )}
                  </div>
                  {formData.description && (
                    <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {formData.description.replace(/[#*`]/g, '')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-[var(--rule-strong)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-4 py-2.5">
                <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Publishing
                </h2>
              </div>
              <div className="space-y-5 px-4 py-4">
                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    发布状态
                  </p>
                  <ChoiceRow
                    id="draft"
                    name="status"
                    value="draft"
                    label="保存为草稿"
                    note="Draft"
                    checked={formData.status === 'draft'}
                    onChange={handleChange}
                  />
                  <ChoiceRow
                    id="published"
                    name="status"
                    value="published"
                    label="立即发布"
                    note="Live"
                    checked={formData.status === 'published'}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    可见范围
                  </p>
                  <ChoiceRow
                    id="public"
                    name="visibility"
                    value="public"
                    label="公开（所有人可见）"
                    note="Public"
                    checked={formData.visibility === 'public'}
                    onChange={handleChange}
                  />
                  <ChoiceRow
                    id="internal"
                    name="visibility"
                    value="internal"
                    label="内部（仅学生可见）"
                    note="Internal"
                    checked={formData.visibility === 'internal'}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2 border-t border-[var(--border)] pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSaving}
                    disabled={
                      isSaving ||
                      !formData.title ||
                      !formData.location ||
                      !formData.date
                    }
                  >
                    保存修改
                  </Button>
                  <Link
                    href="/admin/activities"
                    className="flex h-10 w-full items-center justify-center border border-[var(--border)] text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  >
                    取消
                  </Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </AdminLayout>
  );
}
