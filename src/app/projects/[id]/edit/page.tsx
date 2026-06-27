'use client';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'leader' | 'member' | 'tech_lead' | 'design_lead';
}
interface Project {
  projectId: string;
  teamName: string;
  title: string;
  description: string;
  category: string;
  objectives?: string;
  timeline?: string;
  resources?: string;
  projectLink?: string;
  members: TeamMember[];
  leaderId: string;
  leaderEmail: string;
  status: string;
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}
export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teamName: '',
    projectName: '',
    category: '',
    description: '',
    objectives: '',
    timeline: '',
    resources: '',
    projectLink: '',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [lookupLoading, setLookupLoading] = useState<Record<number, boolean>>({});
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({});
  const lookupUserByEmail = useCallback(async (email: string, memberIndex: number) => {
    if (!email || !email.includes('@')) return;
    setLookupLoading(prev => ({ ...prev, [memberIndex]: true }));
    try {
      const response = await fetch('/api/users/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (data.exists && data.user) {
        setTeamMembers(prev => {
          const updated = [...prev];
          if (updated[memberIndex]) {
            updated[memberIndex] = {
              ...updated[memberIndex],
              name: data.user.name,
              userId: data.user.id,
            };
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('查找用户失败:', err);
    } finally {
      setLookupLoading(prev => ({ ...prev, [memberIndex]: false }));
    }
  }, []);
  const categories = [
    { value: 'web', label: '网页应用开发' },
    { value: 'mobile', label: '移动应用开发' },
    { value: 'ai', label: '人工智能/机器学习' },
    { value: 'game', label: '游戏开发' },
    { value: 'iot', label: '物联网' },
    { value: 'security', label: '网络安全' },
    { value: 'data', label: '数据分析' },
    { value: 'other', label: '其他' },
  ];
  const roleOptions = [
    { value: 'leader', label: '组长' },
    { value: 'member', label: '成员' },
    { value: 'tech_lead', label: '技术负责' },
    { value: 'design_lead', label: '设计负责' },
  ];
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '加载项目失败');
        }
        const proj = data.project;
        setProject(proj);
        setFormData({
          teamName: proj.teamName || '',
          projectName: proj.title || '',
          category: proj.category || '',
          description: proj.description || '',
          objectives: proj.objectives || '',
          timeline: proj.timeline || '',
          resources: proj.resources || '',
          projectLink: proj.projectLink || '',
        });
        setTeamMembers(proj.members || []);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchProject();
    }
  }, [id]);
  useEffect(() => {
    if (!authLoading && !isLoading) {
      if (!user) {
        router.push('/auth/login?redirect=' + encodeURIComponent(`/projects/${id}/edit`));
        return;
      }
      if (project && project.leaderEmail.toLowerCase() !== user.email.toLowerCase()) {
        router.push(`/projects/${id}`);
        return;
      }
    }
  }, [user, authLoading, isLoading, project, id, router]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };
  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setTeamMembers(newMembers);
    setError(null);
    if (field === 'email' && value.includes('@')) {
      if (debounceTimers.current[index]) {
        clearTimeout(debounceTimers.current[index]);
      }
      debounceTimers.current[index] = setTimeout(() => {
        lookupUserByEmail(value, index);
      }, 500);
    }
  };
  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { userId: '', name: '', email: '', role: 'member' },
    ]);
  };
  const removeTeamMember = (index: number) => {
    if (index === 0) return; 
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (!formData.teamName.trim()) {
        throw new Error('请输入组名');
      }
      if (!formData.projectName.trim()) {
        throw new Error('请输入项目名称');
      }
      if (!formData.category) {
        throw new Error('请选择项目类别');
      }
      if (!formData.description.trim()) {
        throw new Error('请输入项目描述');
      }
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        if (!member.name.trim()) {
          throw new Error(`请输入第 ${i + 1} 位组员的姓名`);
        }
        if (!member.email.trim()) {
          throw new Error(`请输入第 ${i + 1} 位组员的邮箱`);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
          throw new Error(`第 ${i + 1} 位组员的邮箱格式不正确`);
        }
      }
      const emails = teamMembers.map(m => m.email.toLowerCase());
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        throw new Error('组员邮箱不能重复');
      }
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: formData.teamName.trim(),
          title: formData.projectName.trim(),
          description: formData.description.trim(),
          category: formData.category,
          objectives: formData.objectives.trim(),
          timeline: formData.timeline.trim(),
          resources: formData.resources.trim(),
          projectLink: formData.projectLink.trim(),
          members: teamMembers,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }
      setSuccessMessage('项目已更新成功！');
      setTimeout(() => {
        router.push(`/projects/${id}`);
      }, 1500);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };
  if (authLoading || isLoading) {
    return (
      <StudentLayout>
        <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl animate-spin" style={{ color: 'var(--primary)' }}>hourglass_empty</span>
            <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
          </div>
        </main>
      </StudentLayout>
    );
  }
  if (error && !project) {
    return (
      <StudentLayout>
        <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
          <div className="max-w-md text-center">
            <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>加载失败</h1>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">{error}</p>
            <Link href="/projects" style={{ color: 'var(--primary)' }} className="hover:underline">
              返回项目列表
            </Link>
          </div>
        </main>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <main className="flex-1 p-4 py-8 lg:p-10" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="max-w-3xl mx-auto">
          {project?.adminFeedback && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-400">feedback</span>
                <div>
                  <p className="font-bold text-amber-400 mb-1">管理员反馈</p>
                  <p className="text-amber-400/80">{project.adminFeedback}</p>
                </div>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--success, #13ec80) / 10', borderColor: 'var(--success, #13ec80) / 30', borderWidth: '1px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--success, #13ec80)' }}>check_circle</span>
              <p style={{ color: 'var(--success, #13ec80)' }}>{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="rounded-2xl shadow-xl border overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--border)', backgroundImage: 'linear-gradient(to right, var(--primary) / 10%, transparent)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary) / 20' }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--primary)' }}>edit</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>编辑项目</h1>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>修改项目信息后点击保存</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111814] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#13ec80]">groups</span>
                  团队信息
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                    组名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    required
                    placeholder="输入您的团队名称"
                    className="w-full h-12 px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111814] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#13ec80]">description</span>
                  项目信息
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                      项目名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      required
                      placeholder="输入项目名称"
                      className="w-full h-12 px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                      项目类别 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                    >
                      <option value="">选择项目类别</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111814] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#13ec80]">article</span>
                  项目详情
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                    项目描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="详细描述您的项目想法、功能和预期成果"
                    className="w-full px-4 py-3 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                    项目目标
                  </label>
                  <textarea
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="列出项目的主要目标和里程碑"
                    className="w-full px-4 py-3 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80] resize-none"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                      预计时间线
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      placeholder="例如：2 个月"
                      className="w-full h-12 px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                      所需资源
                    </label>
                    <input
                      type="text"
                      name="resources"
                      value={formData.resources}
                      onChange={handleInputChange}
                      placeholder="例如：服务器、API 等"
                      className="w-full h-12 px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111814] dark:text-white mb-2">
                    项目链接（可选）
                  </label>
                  <input
                    type="url"
                    name="projectLink"
                    value={formData.projectLink}
                    onChange={handleInputChange}
                    placeholder="例如：GitHub 仓库链接"
                    className="w-full h-12 px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#111814] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#13ec80]">group</span>
                    团队成员
                  </h3>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="flex items-center gap-1 text-sm font-medium text-[#13ec80] hover:text-[#0fd673] transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    添加成员
                  </button>
                </div>
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#f0f4f2] dark:bg-[#102219] border border-[#e5e8e7] dark:border-[#2a3c34]"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#13ec80]/20 flex items-center justify-center text-[#13ec80] font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 grid gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                          placeholder="姓名"
                          required
                          disabled={index === 0}
                          className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a2c24] border border-[#e5e8e7] dark:border-[#2a3c34] text-sm text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80] disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <div className="relative">
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                            placeholder="邮箱（输入后自动填充姓名）"
                            required
                            className="w-full h-10 px-3 pr-8 rounded-lg bg-white dark:bg-[#1a2c24] border border-[#e5e8e7] dark:border-[#2a3c34] text-sm text-[#111814] dark:text-white placeholder:text-[#618975] focus:outline-none focus:ring-2 focus:ring-[#13ec80]"
                          />
                          {lookupLoading[index] && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#13ec80] text-sm animate-spin">sync</span>
                          )}
                        </div>
                        <select
                          value={member.role}
                          onChange={(e) => handleMemberChange(index, 'role', e.target.value as TeamMember['role'])}
                          disabled={index === 0}
                          className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a2c24] border border-[#e5e8e7] dark:border-[#2a3c34] text-sm text-[#111814] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#13ec80] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                      {index === 0 && (
                        <div className="px-3 py-1 rounded-full bg-[#13ec80]/20 text-xs font-medium text-[#13ec80]">
                          组长
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#618975]">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                  组员数量不限制。组长信息不可修改。
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-[#e5e8e7] dark:border-[#2a3c34] bg-[#f6f8f7] dark:bg-[#102219]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-[#618975]">
                  <span className="text-red-500">*</span> 为必填项
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${id}`}
                    className="h-12 px-6 flex items-center justify-center rounded-xl border border-[#e5e8e7] dark:border-[#2a3c34] text-[#111814] dark:text-white font-medium hover:bg-[#f0f4f2] dark:hover:bg-[#1a2c24] transition-colors"
                  >
                    取消
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 px-8 flex items-center justify-center gap-2 rounded-xl bg-[#13ec80] hover:bg-[#0fd673] text-[#102219] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">hourglass_bottom</span>
                        保存中...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        保存更改
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </StudentLayout>
  );
}