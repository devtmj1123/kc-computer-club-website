'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import Link from 'next/link';
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
export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
  });
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
        throw new Error('学号至少需要3位');
      }
      if (!formData.chineseName.trim()) {
        throw new Error('中文姓名不能为空');
      }
      if (formData.chineseName.trim().length < 2) {
        throw new Error('中文姓名至少需要2个字符');
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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <span className="material-symbols-outlined text-[#137fec] text-4xl">
              hourglass_bottom
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }
  if (!student && !isLoading) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="max-w-4xl">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-red-400 text-5xl mb-4">error</span>
            <h2 className="text-xl font-bold text-red-400 mb-2">学生不存在</h2>
            <p className="text-gray-400 mb-4">无法找到该学生的信息</p>
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-[#0d5bc4] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              返回学生列表
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Link href="/admin/students" className="hover:text-white transition-colors">
              学生管理
            </Link>
            <span>/</span>
            <span className="text-white">编辑学生信息</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">编辑学生信息</h1>
          <p className="text-gray-400">
            修改学生账户信息。当前邮箱: <code className="bg-[#283a4f] px-2 py-0.5 rounded text-[#137fec]">{formData.email}</code>
          </p>
        </div>
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <div>
              <p className="text-green-400 font-medium">学生信息更新成功！</p>
              <p className="text-green-400/70 text-sm">正在跳转到学生列表...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            <p className="text-red-400">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#137fec]">person</span>
              基本信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="学号 *"
                placeholder="例如: 12345"
                value={formData.studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                leftIcon="badge"
                required
                hint="学生的唯一识别码"
              />
              <Input
                label="邮箱 *"
                placeholder="例如: 12345@kuencheng.edu.my"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                leftIcon="email"
                required
                hint="学生用于登录系统的邮箱地址"
              />
              <Input
                label="中文姓名 *"
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
          </div>
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#137fec]">school</span>
              班级信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
          <div className="bg-[#1a2838] rounded-2xl border border-[#283a4f] p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#137fec]">groups</span>
              社团信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-white mb-2">备注</label>
                <textarea
                  className="w-full rounded-xl border border-[#283a4f] bg-[#141f2e] p-4 text-white placeholder-gray-500 focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] outline-none transition-all resize-none"
                  placeholder="添加任何备注信息..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/admin/students"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              返回列表
            </Link>
            <div className="flex gap-4">
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
                leftIcon="refresh"
              >
                重置更改
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting || success}
                leftIcon="save"
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