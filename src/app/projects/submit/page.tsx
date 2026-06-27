'use client';
import { useState, useEffect } from 'react';
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
interface ExistingProject {
  projectId: string;
  title: string;
  teamName: string;
  isLeader: boolean;
}
export default function ProjectSubmitPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [existingProject, setExistingProject] = useState<ExistingProject | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  const roleOptions = [
    { value: 'leader', label: '组长' },
    { value: 'member', label: '成员' },
    { value: 'tech_lead', label: '技术负责' },
    { value: 'design_lead', label: '设计负责' },
  ];
  useEffect(() => {
    const checkUserProject = async () => {
      if (authLoading) return;
      if (!user) {
        router.push('/auth/login?redirect=/projects/submit');
        return;
      }
      try {
        const response = await fetch(`/api/projects?checkUser=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        if (data.success && data.hasProject) {
          setExistingProject({
            projectId: data.project.projectId,
            title: data.project.title,
            teamName: data.project.teamName,
            isLeader: data.isLeader,
          });
          if (!data.isLeader) {
            router.push(`/projects/${data.project.projectId}`);
            return;
          }
        } else {
          setTeamMembers([
            {
              userId: user.id,
              name: user.name,
              email: user.email,
              role: 'leader',
            },
          ]);
        }
      } catch (err) {
        console.error('检查用户项目失败:', err);
      } finally {
        setIsChecking(false);
      }
    };
    checkUserProject();
  }, [user, authLoading, router]);
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };
  const [memberValidation, setMemberValidation] = useState<Record<number, { valid: boolean; message?: string; loading?: boolean }>>({});
  const [debounceTimers, setDebounceTimers] = useState<Record<number, NodeJS.Timeout>>({});
  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setTeamMembers(newMembers);
    setError(null);
    if (field === 'email') {
      setMemberValidation((prev) => ({
        ...prev,
        [index]: { valid: false, message: undefined, loading: false },
      }));
      if (debounceTimers[index]) {
        clearTimeout(debounceTimers[index]);
      }
      if (!value.trim()) return;
      const timer = setTimeout(() => {
        validateMemberEmail(index, value);
      }, 800);
      setDebounceTimers((prev) => ({
        ...prev,
        [index]: timer,
      }));
    }
  };
  const validateMemberEmail = async (index: number, email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMemberValidation((prev) => ({
        ...prev,
        [index]: { valid: false, message: '请输入有效的邮箱格式' },
      }));
      return false;
    }
    setMemberValidation((prev) => ({
      ...prev,
      [index]: { valid: false, loading: true },
    }));
    try {
      const response = await fetch('/api/users/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.exists) {
        const newMembers = [...teamMembers];
        newMembers[index] = {
          ...newMembers[index],
          userId: data.user.id,
          name: data.user.name,
        };
        setTeamMembers(newMembers);
        setMemberValidation((prev) => ({
          ...prev,
          [index]: { valid: true, message: `已验证: ${data.user.name}` },
        }));
        return true;
      } else {
        setMemberValidation((prev) => ({
          ...prev,
          [index]: { valid: false, message: '该邮箱未在系统中注册' },
        }));
        return false;
      }
    } catch {
      setMemberValidation((prev) => ({
        ...prev,
        [index]: { valid: false, message: '验证失败，请重试' },
      }));
      return false;
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
    setIsSubmitting(true);
    setError(null);
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
        if (i > 0) {
          const validation = memberValidation[i];
          if (!validation?.valid) {
            throw new Error(`第 ${i + 1} 位组员 (${member.email}) 未在系统中注册，请先让他们注册账号`);
          }
        }
      }
      const emails = teamMembers.map(m => m.email.toLowerCase());
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        throw new Error('组员邮箱不能重复');
      }
      const response = await fetch('/api/projects', {
        method: 'POST',
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
          leaderId: user?.id || '',
          leaderEmail: user?.email || '',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '提交失败');
      }
      router.push(`/projects/${data.project.projectId}?submitted=true`);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (authLoading || isChecking) {
    return (
      <StudentLayout>
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">hourglass_empty</span>
            <p className="text-[var(--text-secondary)]">正在检查项目状态...</p>
          </div>
        </main>
      </StudentLayout>
    );
  }
  if (existingProject && existingProject.isLeader) {
    return (
      <StudentLayout>
        <main className="flex-1 p-4 py-8 lg:p-10">
          <div className="max-w-xl mx-auto">
            <div className="bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-amber-400">info</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                您已有一个项目
              </h1>
              <p className="text-[var(--text-secondary)] mb-6">
                您是 <span className="font-bold text-primary">{existingProject.teamName}</span> 的组长。
                <br />
                每个组只能提交一个项目，您可以编辑现有项目。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/projects/${existingProject.projectId}`}
                  className="h-12 px-6 flex items-center justify-center gap-2 rounded-xl bg-primary hover:opacity-90 text-[#102219] font-bold transition-colors"
                >
                  <span className="material-symbols-outlined">visibility</span>
                  查看项目
                </Link>
                <Link
                  href={`/projects/${existingProject.projectId}/edit`}
                  className="h-12 px-6 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                  编辑项目
                </Link>
              </div>
            </div>
          </div>
        </main>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <main className="flex-1 p-4 py-8 lg:p-10">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-linear-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-primary">lightbulb</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">新项目提案</h1>
                  <p className="text-sm text-[var(--text-secondary)]">填写以下信息提交您的项目计划</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  团队信息
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    组名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    required
                    placeholder="输入您的团队名称"
                    className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  项目信息
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      项目名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      required
                      placeholder="输入项目名称"
                      className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      项目类别 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary"
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
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">article</span>
                  项目详情
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    项目描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="详细描述您的项目想法、功能和预期成果"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    项目目标
                  </label>
                  <textarea
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="列出项目的主要目标和里程碑"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      预计时间线
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      placeholder="例如：2 个月"
                      className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      所需资源
                    </label>
                    <input
                      type="text"
                      name="resources"
                      value={formData.resources}
                      onChange={handleInputChange}
                      placeholder="例如：服务器、API 等"
                      className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    项目链接（可选）
                  </label>
                  <input
                    type="url"
                    name="projectLink"
                    value={formData.projectLink}
                    onChange={handleInputChange}
                    placeholder="例如：GitHub 仓库链接"
                    className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">group</span>
                    团队成员
                  </h3>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    添加成员
                  </button>
                </div>
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] space-y-3"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid gap-3 sm:grid-cols-3">
                          {index === 0 ? (
                            <>
                              <input
                                type="text"
                                value={member.name}
                                disabled
                                className="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] opacity-70 cursor-not-allowed"
                              />
                              <input
                                type="email"
                                value={member.email}
                                disabled
                                className="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] opacity-70 cursor-not-allowed"
                              />
                              <select
                                value={member.role}
                                disabled
                                className="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] opacity-70 cursor-not-allowed"
                              >
                                {roleOptions.map((role) => (
                                  <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={member.email}
                                  onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                                  placeholder="输入邮箱（自动验证）"
                                  required
                                  className={`h-10 px-3 rounded-lg bg-[var(--surface)] border text-sm text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary w-full ${
                                    memberValidation[index]?.valid
                                      ? 'border-primary'
                                      : memberValidation[index]?.message && !memberValidation[index]?.loading
                                      ? 'border-red-500'
                                      : 'border-[var(--border)]'
                                  }`}
                                />
                                {memberValidation[index]?.loading && (
                                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-lg animate-spin">hourglass_empty</span>
                                )}
                                {memberValidation[index]?.valid && !memberValidation[index]?.loading && (
                                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-lg">check_circle</span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={member.name}
                                placeholder="姓名（自动填充）"
                                disabled
                                className="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-secondary)] opacity-70"
                              />
                              <select
                                value={member.role}
                                onChange={(e) => handleMemberChange(index, 'role', e.target.value as TeamMember['role'])}
                                className="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                {roleOptions.filter(r => r.value !== 'leader').map((role) => (
                                  <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                              </select>
                            </>
                          )}
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
                          <div className="px-3 py-1 rounded-full bg-primary/20 text-xs font-medium text-primary">
                            组长（您）
                          </div>
                        )}
                      </div>
                      {index > 0 && memberValidation[index] && (
                        <div className="flex items-center gap-3 pl-13">
                          {memberValidation[index]?.loading ? (
                            <span className="text-xs flex items-center gap-1 text-[var(--text-secondary)]">
                              <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
                              正在验证...
                            </span>
                          ) : memberValidation[index]?.message ? (
                            <span className={`text-xs flex items-center gap-1 ${
                              memberValidation[index]?.valid ? 'text-primary' : 'text-red-400'
                            }`}>
                              <span className="material-symbols-outlined text-sm">
                                {memberValidation[index]?.valid ? 'check_circle' : 'error'}
                              </span>
                              {memberValidation[index].message}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                  组员必须已在系统中注册账号。输入邮箱后系统会自动验证。
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="text-red-500">*</span> 为必填项
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/projects"
                    className="h-12 px-6 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    取消
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-8 flex items-center justify-center gap-2 rounded-xl bg-primary hover:opacity-90 text-[#102219] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">hourglass_bottom</span>
                        提交中...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        提交计划
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