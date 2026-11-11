'use client';

import { StudentLayout } from '@/components/layout/StudentLayout';
import { ProjectChecklistComponent } from '@/components/projects/ProjectChecklist';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
  checklist?: {
    checklistId: string;
    projectId: string;
    title: string;
    items: Array<{
      id: string;
      title: string;
      description?: string;
      completed: boolean;
      completedAt?: string;
      assignee?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<string, string> = {
  web: '网页应用',
  mobile: '移动应用',
  ai: 'AI / ML',
  game: '游戏开发',
  iot: '物联网',
  security: '网络安全',
  data: '数据分析',
  other: '其他',
};

const roleLabels: Record<string, string> = {
  leader: '组长',
  member: '成员',
  tech_lead: '技术负责',
  design_lead: '设计负责',
};

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: {
    label: '待审核',
    className: 'border-[var(--warning)]/40 bg-[var(--warning-light)] text-[var(--warning)]',
  },
  approved: {
    label: '已通过',
    className: 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]',
  },
  rejected: {
    label: '已拒绝',
    className: 'border-[var(--error)]/40 bg-[var(--error-light)] text-[var(--error)]',
  },
  revision: {
    label: '需修改',
    className: 'border-[var(--warning)]/40 bg-[var(--warning-light)] text-[var(--warning)]',
  },
};

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        if (!projectId || projectId === 'undefined') {
          setError('无效的项目 ID');
          setIsLoading(false);
          return;
        }
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '获取项目失败');
        }
        setProject(data.project);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('加载项目失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId && projectId !== 'undefined') {
      fetchProject();
    } else {
      setError('无效的项目 ID');
      setIsLoading(false);
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <StudentLayout>
        <main className="flex items-center justify-center py-32">
          <Loading size="lg" text="加载项目…" />
        </main>
      </StudentLayout>
    );
  }

  if (error || !project) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[1200px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">404 · NOT FOUND</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            加载失败
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            {error || '项目不存在'}
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

  const status = statusMeta[project.status] || statusMeta.pending;
  const canEdit =
    Boolean(user?.email) &&
    (isAdmin ||
      user?.email?.toLowerCase() === project.leaderEmail?.toLowerCase() ||
      (project.members || []).some(
        (member) => member.email?.toLowerCase() === user?.email?.toLowerCase()
      ));

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <Link href="/projects" className="transition-colors hover:text-[var(--foreground)]">
            项目
          </Link>
          <span>/</span>
          <span className="truncate text-[var(--foreground)]">{project.title}</span>
        </nav>

        <header className="border-b border-[var(--rule-strong)] pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-[var(--primary)]/40 bg-[var(--primary-light)] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
              {categoryLabels[project.category] || project.category}
            </span>
            <span
              className={`border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.04em] text-[var(--foreground)]">
                {project.title}
              </h1>
              <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                {project.teamName} · 更新于 {formatDate(project.updatedAt || project.createdAt)}
              </p>
            </div>

            {canEdit && (
              <Link
                href={`/projects/${project.projectId}/edit`}
                className="inline-flex w-fit items-center gap-3 border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                编辑项目
              </Link>
            )}
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div className="min-w-0">
            {project.adminFeedback && (
              <section
                className={`mb-10 border p-5 ${
                  project.status === 'revision'
                    ? 'border-[var(--warning)]/40 bg-[var(--warning-light)]'
                    : project.status === 'rejected'
                      ? 'border-[var(--error)]/40 bg-[var(--error-light)]'
                      : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      project.status === 'revision'
                        ? 'text-[var(--warning)]'
                        : project.status === 'rejected'
                          ? 'text-[var(--error)]'
                          : 'text-[var(--primary)]'
                    }`}
                  >
                    {project.status === 'revision'
                      ? 'edit_note'
                      : project.status === 'rejected'
                        ? 'cancel'
                        : 'feedback'}
                  </span>
                  <h2 className="font-display text-[18px] font-bold text-[var(--foreground)]">
                    {project.status === 'revision'
                      ? '需要修改 · 管理员反馈'
                      : project.status === 'rejected'
                        ? '已拒绝 · 管理员反馈'
                        : '管理员反馈'}
                  </h2>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-[1.9] text-[var(--text-secondary)]">
                  {project.adminFeedback}
                </p>
              </section>
            )}

            <section>
              <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                  01
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                  项目简介
                </h2>
                <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
              </div>
              <p className="mt-6 whitespace-pre-wrap text-[14px] leading-[1.95] text-[var(--text-secondary)]">
                {project.description || '暂无项目简介。'}
              </p>
            </section>

            {project.objectives && (
              <section className="mt-10">
                <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    02
                  </span>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    项目目标
                  </h2>
                  <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                </div>
                <p className="mt-6 whitespace-pre-wrap text-[14px] leading-[1.95] text-[var(--text-secondary)]">
                  {project.objectives}
                </p>
              </section>
            )}

            {(project.timeline || project.resources) && (
              <section className="mt-10">
                <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    03
                  </span>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    计划与资源
                  </h2>
                  <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                </div>
                <dl className="mt-2">
                  {project.timeline && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-[var(--border)] py-4">
                      <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                        时间线
                      </dt>
                      <dd className="whitespace-pre-wrap text-[13px] leading-[1.9] text-[var(--text-secondary)]">
                        {project.timeline}
                      </dd>
                    </div>
                  )}
                  {project.resources && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-[var(--border)] py-4">
                      <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                        所需资源
                      </dt>
                      <dd className="whitespace-pre-wrap text-[13px] leading-[1.9] text-[var(--text-secondary)]">
                        {project.resources}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {project.projectLink && (
              <section className="mt-10">
                <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    LINK
                  </span>
                  <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    项目链接
                  </h2>
                  <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                </div>
                <a
                  href={project.projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  访问项目
                </a>
              </section>
            )}

            {project.status === 'approved' && (
              <section className="mt-10">
                <ProjectChecklistComponent
                  projectId={project.projectId}
                  checklist={project.checklist}
                  isReadOnly={!canEdit}
                  projectMembers={project.members}
                  leaderEmail={project.leaderEmail}
                />
              </section>
            )}

            <div className="mt-10 border-t border-[var(--border)] pt-6">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 border-b border-transparent pb-0.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                返回项目列表
              </Link>
            </div>
          </div>

          <aside className="lg:sticky lg:top-[98px] lg:h-fit">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>TEAM / 团队</span>
                <span className="text-[var(--primary)]">
                  {String(project.members.length).padStart(2, '0')}
                </span>
              </div>

              <div className="border-b border-[var(--border)] px-4 py-4">
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                  团队名称
                </p>
                <p className="mt-1.5 font-display text-[17px] font-semibold text-[var(--foreground)]">
                  {project.teamName}
                </p>
              </div>

              {project.members.map((member, idx) => (
                <div
                  key={`${member.email}-${idx}`}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center bg-[var(--primary)] font-mono text-[12px] text-[var(--primary-contrast)]">
                    {member.name?.charAt(0) || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
                      {member.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[12px] tracking-[0.02em] text-[var(--text-tertiary)]">
                      {member.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${
                      member.role === 'leader'
                        ? 'border-[var(--primary)]/40 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    {roleLabels[member.role] || member.role}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between px-4 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                <span>创建</span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>

            <Link
              href="/projects"
              className="group mt-5 block border border-[var(--rule-strong)] p-4 transition-colors hover:bg-[var(--primary-light)]"
            >
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
                PROJECTS / 项目
              </span>
              <span className="mt-3 block font-display text-[17px] font-semibold leading-[1.4] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                浏览全部公开项目 →
              </span>
            </Link>
          </aside>
        </div>
      </main>
    </StudentLayout>
  );
}
