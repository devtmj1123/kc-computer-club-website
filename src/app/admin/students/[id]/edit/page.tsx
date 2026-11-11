'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';

const groupLevelOptions = [
  { value: '', label: '选择分组级别' },
  { value: '初级组 \'1 学点\'', label: '初级组 (1学点)' },
  { value: '初级组 \'2 学点\'', label: '初级组 (2学点)' },
  { value: '高级组 \'1 学点\'', label: '高级组 (1学点)' },
  { value: '高级组 \'2 学点\'', label: '高级组 (2学点)' },
  { value: '服务组', label: '服务组' },
];

const levelOptions = [
  { value: '', label: '选择级别' },
  { value: 'Advance \'高级\'', label: '高级 (Advance)' },
  { value: 'Beginner \'初级\'', label: '初级 (Beginner)' },
];

const positionOptions = [
  { value: '', label: '选择职位（可选）' },
  { value: '主席', label: '主席' },
  { value: '副主席', label: '副主席' },
  { value: '总务', label: '总务' },
  { value: '副总务', label: '副总务' },
  { value: '文书1', label: '文书1' },
  { value: '文书2', label: '文书2' },
  { value: '财务', label: '财务' },
  { value: '组长', label: '组长' },
  { value: '成员', label: '成员' },
];

interface FormData {
  studentId: string;
  chineseName: string;
  englishName: string;
  email: string;
  classNameCn: string;
  classNameEn: string;
  classCode: string;
  groupLevel: string;
  level: string;
  phone: string;
  instagram: string;
  group: string;
  position: string;
  notes: string;
}

interface StudentInfo {
  $id: string;
  email: string;
  studentId: string;
  chineseName: string;
  englishName: string;
  classNameCn: string;
  classNameEn: string;
  classCode: string;
  groupLevel: string;
  level: string;
  phone: string;
  instagram: string;
  group: string;
  position: string;
  notes: string;
  role: string;
}

const emptyForm: FormData = {
  studentId: '',
  chineseName: '',
  englishName: '',
  email: '',
  classNameCn: '',
  classNameEn: '',
  classCode: '',
  groupLevel: '',
  level: '',
  phone: '',
  instagram: '',
  group: '',
  position: '',
  notes: '',
};

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isAuthLoading && (!user || !('role' in user) || user.role !== 'admin')) {
    router.push('/admin/login');
    return null;
  }

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/admin/students/${id}`);
        const data = await response.json();
        if (data.success && data.student) {
          setStudent(data.student);
          setFormData({
            studentId: data.student.studentId || '',
            chineseName: data.student.chineseName || '',
            englishName: data.student.englishName || '',
            email: data.student.email || '',
            classNameCn: data.student.classNameCn || '',
            classNameEn: data.student.classNameEn || '',
            classCode: data.student.classCode || '',
            groupLevel: data.student.groupLevel || '',
            level: data.student.level || '',
            phone: data.student.phone || '',
            instagram: data.student.instagram || '',
            group: data.student.group || '',
            position: data.student.position || '',
            notes: data.student.notes || '',
          });
        } else {
          setError('加载学生信息失败');
        }
      } catch (err) {
        console.error('加载学生信息失败:', err);
        setError('加载学生信息失败');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (!formData.studentId.trim()) {
        throw new Error('学号不能为空');
      }
      if (formData.studentId.trim().length < 3) {
        throw new Error('学号至少需要 3 位');
      }
      if (!formData.chineseName.trim()) {
        throw new Error('中文姓名不能为空');
      }
      if (formData.chineseName.trim().length < 2) {
        throw new Error('中文姓名至少需要 2 个字符');
      }
      if (!formData.email.trim()) {
        throw new Error('邮箱不能为空');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('请输入有效的邮箱地址');
      }
      const updateData = {
        studentId: formData.studentId.trim(),
        chineseName: formData.chineseName.trim(),
        englishName: formData.englishName.trim(),
        email: formData.email.trim(),
        classNameCn: formData.classNameCn.trim(),
        classNameEn: formData.classNameEn.trim(),
        classCode: formData.classCode.trim(),
        groupLevel: formData.groupLevel,
        level: formData.level,
        phone: formData.phone.trim(),
        instagram: formData.instagram.trim(),
        group: formData.group.trim(),
        position: formData.position,
        notes: formData.notes.trim(),
      };
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '更新学生信息失败');
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/students');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新学生信息失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <AdminLayout adminName="">
        <div className="flex items-center gap-3 border border-[var(--rule-strong)] px-5 py-10">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Loading student
          </span>
        </div>
      </AdminLayout>
    );
  }

  if (!student && !isLoading) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="max-w-4xl border border-[var(--error)]/40 px-6 py-12 text-center">
          <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--error)]">
            Record not found
          </div>
          <h1 className="mt-3 font-display text-[26px] font-bold text-[var(--foreground)]">
            学生不存在
          </h1>
          <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
            无法找到该学生的信息，可能已被删除。
          </p>
          <Link
            href="/admin/students"
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-[3px] bg-[var(--primary)] px-4 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            返回学生列表
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="max-w-4xl">
        <div className="mb-7">
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            <Link
              href="/admin/students"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              学生管理
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-[var(--foreground)]">编辑学生信息</span>
          </div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            编辑学生信息
          </h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            修改学生账户资料。当前登录邮箱：
            <code className="ml-1 border border-[var(--border)] bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--primary)]">
              {formData.email}
            </code>
          </p>
        </div>

        {success && (
          <div className="mb-5 flex items-start gap-3 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[17px] text-[var(--primary)]">
              check_circle
            </span>
            <div>
              <p className="text-[12px] font-semibold text-[var(--primary)]">学生信息已更新</p>
              <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                正在跳转到学生列表…
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[17px] text-[var(--error)]">
              error
            </span>
            <p className="text-[12px] text-[var(--error)]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="border border-[var(--rule-strong)]">
            <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
              <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">
                基本信息
              </h2>
              <span className="mono-label">01 / Profile</span>
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
              <Input
                label="学号"
                placeholder="例如: 12345"
                value={formData.studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                leftIcon="badge"
                required
                hint="学生的唯一识别码"
              />
              <Input
                label="邮箱"
                type="email"
                placeholder="例如: 12345@kuencheng.edu.my"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                leftIcon="email"
                required
                hint="学生用于登录系统的邮箱地址"
              />
              <Input
                label="中文姓名"
                placeholder="例如: 张三"
                value={formData.chineseName}
                onChange={(e) => handleChange('chineseName', e.target.value)}
                leftIcon="person"
                required
              />
              <Input
                label="英文姓名"
                placeholder="例如: Zhang San"
                value={formData.englishName}
                onChange={(e) => handleChange('englishName', e.target.value)}
                leftIcon="translate"
              />
              <Input
                label="电话号码"
                placeholder="例如: 012-3456789"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                leftIcon="phone"
              />
            </div>
          </section>

          <section className="border border-[var(--rule-strong)]">
            <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
              <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">
                班级信息
              </h2>
              <span className="mono-label">02 / Class</span>
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
              <Input
                label="班级 (中文)"
                placeholder="例如: 高三纯商C"
                value={formData.classNameCn}
                onChange={(e) => handleChange('classNameCn', e.target.value)}
                leftIcon="class"
              />
              <Input
                label="班级 (英文)"
                placeholder="例如: Sr3ComC"
                value={formData.classNameEn}
                onChange={(e) => handleChange('classNameEn', e.target.value)}
                leftIcon="class"
              />
              <Input
                label="班级代号"
                placeholder="例如: A802"
                value={formData.classCode}
                onChange={(e) => handleChange('classCode', e.target.value)}
                leftIcon="tag"
              />
            </div>
          </section>

          <section className="border border-[var(--rule-strong)]">
            <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
              <h2 className="font-display text-[16px] font-bold text-[var(--foreground)]">
                社团信息
              </h2>
              <span className="mono-label">03 / Club</span>
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
              <NeumorphicSelect
                label="分组级别"
                options={groupLevelOptions}
                value={formData.groupLevel}
                onChange={(value) => handleChange('groupLevel', value)}
              />
              <NeumorphicSelect
                label="级别"
                options={levelOptions}
                value={formData.level}
                onChange={(value) => handleChange('level', value)}
              />
              <Input
                label="分组"
                placeholder="例如: C1 陈俊霖"
                value={formData.group}
                onChange={(e) => handleChange('group', e.target.value)}
                leftIcon="group"
              />
              <NeumorphicSelect
                label="职位"
                options={positionOptions}
                value={formData.position}
                onChange={(value) => handleChange('position', value)}
              />
              <Input
                label="Instagram"
                placeholder="例如: @username"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                leftIcon="photo_camera"
              />
              <div className="md:col-span-2">
                <label
                  htmlFor="student-notes"
                  className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  备注
                </label>
                <textarea
                  id="student-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="添加任何备注信息…"
                  className="w-full resize-none rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              返回列表
            </Link>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (student) {
                    setFormData({
                      studentId: student.studentId || '',
                      chineseName: student.chineseName || '',
                      englishName: student.englishName || '',
                      email: student.email || '',
                      classNameCn: student.classNameCn || '',
                      classNameEn: student.classNameEn || '',
                      classCode: student.classCode || '',
                      groupLevel: student.groupLevel || '',
                      level: student.level || '',
                      phone: student.phone || '',
                      instagram: student.instagram || '',
                      group: student.group || '',
                      position: student.position || '',
                      notes: student.notes || '',
                    });
                    setError('');
                  }
                }}
              >
                重置更改
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting || success}
              >
                保存更改
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
