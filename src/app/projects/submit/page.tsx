'use client';

import { useState, useEffect } from 'react';
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
        const response = await fetch(
          `/api/projects?checkUser=${encodeURIComponent(user.email)}&checkUserId=${encodeURIComponent(user.id)}`
        );
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const [memberValidation, setMemberValidation] = useState<
    Record<number, { valid: boolean; message?: string; loading?: boolean }>
  >({});
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
          name: newMembers[index].name.trim() || email.split('@')[0] || newMembers[index].name,
        };
        setTeamMembers(newMembers);
        setMemberValidation((prev) => ({
          ...prev,
          [index]: { valid: true, message: '邮箱已验证' },
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
    setTeamMembers([...teamMembers, { userId: '', name: '', email: '', role: 'member' }]);
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
        if (i > 0) {
          const validation = memberValidation[i];
          if (!validation?.valid) {
            throw new Error(
              `第 ${i + 1} 位组员 (${member.email}) 未在系统中注册，请先让他们注册账号`
            );
          }
        }
      }
      const emails = teamMembers.map((m) => m.email.toLowerCase());
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) throw new Error('组员邮箱不能重复');

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
      if (!response.ok) throw new Error(data.error || '提交失败');
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
        <main className="flex items-center justify-center py-32">
          <Loading size="lg" text="正在检查项目状态…" />
        </main>
      </StudentLayout>
    );
  }

  if (existingProject && existingProject.isLeader) {
    return (
      <StudentLayout>
        <main className="mx-auto w-full max-w-[800px] px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">PROJECT EXISTS · 已提交项目</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            您已有一个项目
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            您是 <span className="font-semibold text-[var(--foreground)]">{existingProject.teamName}</span>{' '}
            的组长。每个组只能提交一个项目，你可以编辑现有项目。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/projects/${existingProject.projectId}`}
              className="inline-flex items-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              <span className="material-symbols-outlined text-[15px]">visibility</span>
              查看项目
            </Link>
            <Link
              href={`/projects/${existingProject.projectId}/edit`}
              className="inline-flex items-center gap-2 border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              编辑项目
            </Link>
          </div>
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
          <span className="text-[var(--foreground)]">提交项目</span>
        </nav>

        <header className="border-b border-[var(--rule-strong)] pb-8">
          <div className="eyebrow">PROJECT PROPOSAL · 项目提案</div>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--foreground)]">
            提交你的项目计划。
          </h1>
          <p className="mt-4 max-w-2xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            每个团队只能提交一个项目。填写完整信息后提交，管理员审核通过后会展示在项目页面。
          </p>
        </header>

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
                      {index === 0 ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              姓名
                            </span>
                            <input
                              type="text"
                              value={member.name}
                              disabled
                              className="h-10 rounded-[3px] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-[12px] text-[var(--text-secondary)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              邮箱
                            </span>
                            <input
                              type="email"
                              value={member.email}
                              disabled
                              className="h-10 rounded-[3px] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-[12px] text-[var(--text-secondary)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              角色
                            </span>
                            <input
                              type="text"
                              value="组长（你）"
                              disabled
                              className="h-10 rounded-[3px] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-[12px] text-[var(--text-secondary)]"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              邮箱
                            </span>
                            <div className="relative">
                              <input
                                type="email"
                                value={member.email}
                                onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                                placeholder="输入邮箱（自动验证）"
                                required
                                className={`h-10 w-full rounded-[3px] border bg-[var(--input-bg)] px-3 pr-9 text-[12px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] ${
                                  memberValidation[index]?.valid
                                    ? 'border-[var(--primary)]'
                                    : memberValidation[index]?.message &&
                                        !memberValidation[index]?.loading
                                      ? 'border-[var(--error)]'
                                      : 'border-[var(--input-border)]'
                                }`}
                              />
                              {memberValidation[index]?.loading && (
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[15px] text-[var(--text-tertiary)]">
                                  hourglass_empty
                                </span>
                              )}
                              {memberValidation[index]?.valid &&
                                !memberValidation[index]?.loading && (
                                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-[var(--primary)]">
                                    check_circle
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              姓名
                            </span>
                            <input
                              type="text"
                              value={member.name}
                              placeholder="姓名（自动填充）"
                              disabled
                              className="h-10 rounded-[3px] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-[12px] text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              角色
                            </span>
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleMemberChange(
                                  index,
                                  'role',
                                  e.target.value as TeamMember['role']
                                )
                              }
                              className="h-10 rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[12px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                            >
                              {roleOptions
                                .filter((r) => r.value !== 'leader')
                                .map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </>
                      )}
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

                  {index > 0 && memberValidation[index]?.message && (
                    <p
                      className={`mt-3 pl-10 font-mono text-[12px] tracking-[0.02em] ${
                        memberValidation[index]?.valid
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--error)]'
                      }`}
                    >
                      {memberValidation[index].message}
                    </p>
                  )}
                </div>
              ))}

              <p className="flex items-start gap-1.5 font-mono text-[12px] leading-relaxed tracking-[0.02em] text-[var(--text-tertiary)]">
                <span className="material-symbols-outlined text-[13px]">info</span>
                组员必须已在系统中注册账号。输入邮箱后系统会自动验证。
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t border-[var(--rule-strong)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              <span className="text-[var(--error)]">*</span> 为必填项
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] px-5 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[15px]">
                      hourglass_bottom
                    </span>
                    提交中…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    提交计划
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
