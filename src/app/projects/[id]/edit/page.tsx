'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
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
    setLookupLoading((prev) => ({ ...prev, [memberIndex]: true }));
    try {
      const response = await fetch('/api/users/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (data.exists) {
        setTeamMembers((prev) => {
          const updated = [...prev];
          if (updated[memberIndex]) {
            updated[memberIndex] = {
              ...updated[memberIndex],
              name:
                updated[memberIndex].name.trim() ||
                email.split('@')[0] ||
                updated[memberIndex].name,
            };
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('查找用户失败:', err);
    } finally {
      setLookupLoading((prev) => ({ ...prev, [memberIndex]: false }));
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
      if (!id) {
        setIsLoading(false);
        return;
      }
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
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
  }, [id, user]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
    setTeamMembers([...teamMembers, { userId: '', name: '', email: '', role: 'member' }]);
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
      if (!formData.teamName.trim()) throw new Error('请输入组名');
      if (!formData.projectName.trim()) throw new Error('请输入项目名称');
      if (!formData.category) throw new Error('请选择项目类别');
      if (!formData.description.trim()) throw new Error('请输入项目描述');
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        if (!member.name.trim()) throw new Error(`请输入第 ${i + 1} 位组员的姓名`);
        if (!member.email.trim()) throw new Error(`请输入第 ${i + 1} 位组员的邮箱`);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
          throw new Error(`第 ${i + 1} 位组员的邮箱格式不正确`);
        }
      }
      const emails = teamMembers.map((m) => m.email.toLowerCase());
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) throw new Error('组员邮箱不能重复');

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
          userEmail: user?.email || '',
          userId: user?.id || '',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');
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
        <main className="flex items-center justify-center py-32">
          <Loading size="lg" text="加载项目…" />
        </main>
      </StudentLayout>
    );
  }

  if (error && !project) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[1000px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">ERROR · 加载失败</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            加载失败
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            {error}
          </p>
          <Link
            href="/projects"
            className="mt-8 inline-flex items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="text-[13px] leading-none">←</span>
            返回项目列表
          </Link>
        </main>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/projects" className="transition-colors hover:text-[var(--foreground)]">
            项目
          </Link>
          <span>/</span>
          <Link
            href={`/projects/${id}`}
            className="max-w-[240px] truncate transition-colors hover:text-[var(--foreground)]"
          >
            {project?.title || '项目'}
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">编辑</span>
        </nav>

        <header className="border-b border-[var(--rule-strong)] pb-8">
          <div className="eyebrow">EDIT PROJECT · 编辑项目</div>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--foreground)]">
            更新项目信息。
          </h1>
          <p className="mt-4 max-w-2xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            修改项目内容与团队成员后保存。若项目已通过审核，修改后可能需要重新审核。
          </p>
        </header>

        {project?.adminFeedback && (
          <div className="mt-6 flex items-start gap-3 border border-[var(--warning)]/40 bg-[var(--warning-light)] px-4 py-3">
            <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--warning)]">
              feedback
            </span>
            <div>
              <p className="text-[12px] font-semibold text-[var(--warning)]">管理员反馈</p>
              <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {project.adminFeedback}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 border border-[var(--primary)]/40 bg-[var(--primary-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
              check_circle
            </span>
            <p className="text-[12px] text-[var(--primary)]">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
            <span className="material-symbols-outlined mt-0.5 text-[16px] text-[var(--error)]">
              error
            </span>
            <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 border border-[var(--rule-strong)]">
          <section>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                01 / 团队信息
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                TEAM
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <Input
                label="组名"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                required
                placeholder="输入你的团队名称"
              />
            </div>
          </section>

          <section className="border-t border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                02 / 项目信息
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                PROJECT
              </span>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <Input
                label="项目名称"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                required
                placeholder="输入项目名称"
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="category"
                  className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  项目类别 <span className="text-[var(--error)]">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                >
                  <option value="">选择项目类别</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="border-t border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                03 / 项目详情
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                DETAILS
              </span>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="description"
                  className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  项目描述 <span className="text-[var(--error)]">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="详细描述项目想法、功能和预期成果"
                  className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="objectives"
                  className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  项目目标
                </label>
                <textarea
                  id="objectives"
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="列出项目的主要目标和里程碑"
                  className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="预计时间线"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="例如：2 个月"
                />
                <Input
                  label="所需资源"
                  name="resources"
                  value={formData.resources}
                  onChange={handleInputChange}
                  placeholder="例如：服务器、API 等"
                />
              </div>

              <Input
                label="项目链接（可选）"
                type="url"
                name="projectLink"
                value={formData.projectLink}
                onChange={handleInputChange}
                placeholder="例如：GitHub 仓库链接"
              />
            </div>
          </section>

          <section className="border-t border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                04 / 团队成员
              </span>
              <button
                type="button"
                onClick={addTeamMember}
                className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                添加成员
              </button>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              {teamMembers.map((member, index) => (
                <div key={index} className="border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center bg-[var(--primary)] font-mono text-[12px] text-[var(--primary-contrast)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                          姓名
                        </span>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                          placeholder="姓名"
                          required
                          disabled={index === 0}
                          className="h-10 rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[12px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-secondary)]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                          邮箱
                        </span>
                        <div className="relative">
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                            placeholder="邮箱（自动填充姓名）"
                            required
                            disabled={index === 0}
                            className="h-10 w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 pr-8 text-[12px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-secondary)]"
                          />
                          {lookupLoading[index] && (
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-[14px] text-[var(--primary)]">
                              sync
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                          角色
                        </span>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleMemberChange(index, 'role', e.target.value as TeamMember['role'])
                          }
                          disabled={index === 0}
                          className="h-10 rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[12px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-secondary)]"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="p-1.5 text-[var(--text-tertiary)] transition-colors hover:text-[var(--error)]"
                        title="移除成员"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <p className="flex items-start gap-1.5 font-mono text-[12px] leading-relaxed tracking-[0.02em] text-[var(--text-tertiary)]">
                <span className="material-symbols-outlined text-[13px]">info</span>
                组员数量不限制，组长信息不可修改。
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t border-[var(--rule-strong)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              <span className="text-[var(--error)]">*</span> 为必填项
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/projects/${id}`}
                className="inline-flex items-center justify-center border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] px-5 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[15px]">
                      hourglass_bottom
                    </span>
                    保存中…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">save</span>
                    保存更改
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </StudentLayout>
  );
}
