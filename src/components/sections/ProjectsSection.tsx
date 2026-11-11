'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Project {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  contributors: number;
  repoUrl?: string;
}

interface ProjectsSectionProps {
  projects: Project[];
  className?: string;
}

export function ProjectsSection({ projects, className }: ProjectsSectionProps) {
  return (
    <section className={cn('min-w-0 bg-[var(--background)]', className)}>
      <SectionHeading
        index="03"
        title="进行中的项目"
        actionLabel="全部项目"
        actionHref="/projects"
      />

      {projects.length === 0 ? (
        <div className="flex items-center justify-between border-b border-[var(--border)] py-8">
          <p className="text-[13px] text-[var(--text-secondary)]">暂无公开项目</p>
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            No projects
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 border-l border-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <article
              key={project.id}
              className="group flex min-h-[220px] flex-col border-b border-r border-[var(--border)] p-5 transition-colors hover:bg-[var(--primary-light)] sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] tracking-[0.12em] text-[var(--primary)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                  PROJECT
                </span>
              </div>

              <Link href={`/projects/${project.id}`} className="mt-5 block">
                <h3 className="font-display text-[19px] font-semibold leading-[1.45] tracking-[-0.01em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                  {project.title}
                </h3>
              </Link>

              <p className="mt-2.5 line-clamp-2 flex-1 text-[12px] leading-[1.8] text-[var(--text-secondary)]">
                {project.description}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-3 font-mono text-[12px] tracking-[0.06em] text-[var(--text-tertiary)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  {project.contributors} 位成员
                </span>
                {project.repoUrl ? (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
                  >
                    仓库 ↗
                  </a>
                ) : (
                  <span>开发中</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
