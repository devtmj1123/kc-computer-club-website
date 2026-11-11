'use client';

import { StudentLayout } from '@/components/layout/StudentLayout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  projectId: string;
  teamName: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  members: ProjectMember[];
  leaderId: string;
  leaderEmail: string;
  projectLink?: string;
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects || []);
        } else {
          setError(data.error || '加载项目失败');
        }
      } catch (err) {
        console.error('加载项目失败:', err);
        setError('加载项目失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term) ||
      project.teamName.toLowerCase().includes(term)
    );
  });

  const userHasProject = user
    ? projects.some((project) =>
        (project.members || []).some(
          (member) => member.email?.toLowerCase() === user.email?.toLowerCase()
        )
      )
    : false;

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">项目</span>
        </nav>

        <header className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">STUDENT PROJECTS · 项目展示</div>
            <h1 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              把想法，
              <br />
              <span className="text-[var(--primary)]">做成项目。</span>
            </h1>
            <p className="mt-5 max-w-xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
              这里展示已通过审核的学生项目。浏览团队作品，或提交你自己的项目提案。
            </p>
          </div>

          {userHasProject ? (
            <span className="inline-flex w-fit cursor-not-allowed items-center gap-2 border border-[var(--border)] px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              已有项目
            </span>
          ) : (
            <Link
              href="/projects/submit"
              className="inline-flex w-fit items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              <span className="text-[14px] leading-none">+</span>
              提交项目
            </Link>
          )}
        </header>

        <div className="flex flex-col gap-3 border-b border-[var(--border)] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <Input
              placeholder="搜索项目名称、团队或描述…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon="search"
            />
          </div>
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {String(filteredProjects.length).padStart(2, '0')} 个项目
          </span>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[16px] text-[var(--error)]">error</span>
            <p className="text-[12px] text-[var(--error)]">{error}</p>
          </div>
        )}

        {isLoading || authLoading ? (
          <div className="flex items-center justify-center py-24">
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Loading projects…
            </span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon="folder_open"
            title={searchTerm ? '没有找到匹配的项目' : '暂无公开项目'}
            description={
              searchTerm
                ? '试试更换关键词，或清空搜索条件。'
                : '项目通过审核后会展示在这里。'
            }
            className="mt-10"
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 border-l border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <article
                key={project.projectId}
                className="group flex min-h-[280px] flex-col border-b border-r border-[var(--border)] p-5 transition-colors hover:bg-[var(--primary-light)] sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-[0.12em] text-[var(--primary)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    {formatDate(project.updatedAt || project.createdAt)}
                  </span>
                </div>

                <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  {project.teamName}
                </p>

                <Link href={`/projects/${project.projectId}`} className="mt-1.5 block">
                  <h2 className="font-display text-[20px] font-semibold leading-[1.4] tracking-[-0.015em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                    {project.title}
                  </h2>
                </Link>

                <p className="mt-2.5 line-clamp-2 flex-1 text-[12px] leading-[1.8] text-[var(--text-secondary)]">
                  {project.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="border border-[var(--border)] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                    {categoryLabels[project.category] || project.category}
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                    {project.members?.length || 0} 名成员
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-1.5">
                    {(project.members || []).slice(0, 4).map((member, memberIndex) => (
                      <span
                        key={`${member.email}-${memberIndex}`}
                        className="flex size-6 items-center justify-center bg-[var(--primary)] font-mono text-[12px] text-[var(--primary-contrast)]"
                        title={member.name}
                      >
                        {member.name?.charAt(0) || '?'}
                      </span>
                    ))}
                    {(project.members?.length || 0) > 4 && (
                      <span className="flex size-6 items-center justify-center border border-[var(--border)] font-mono text-[12px] text-[var(--text-secondary)]">
                        +{(project.members?.length || 0) - 4}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[12px] tracking-[0.04em]">
                    {project.projectLink && (
                      <a
                        href={project.projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
                      >
                        仓库 ↗
                      </a>
                    )}
                    <Link
                      href={`/projects/${project.projectId}`}
                      className="text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
                    >
                      查看 →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
