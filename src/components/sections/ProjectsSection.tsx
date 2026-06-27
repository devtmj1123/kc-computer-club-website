'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">rocket_launch</span>
          活跃项目
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="size-9 rounded-full bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] flex items-center justify-center text-[var(--foreground)] transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <button
            onClick={() => scroll('right')}
            className="size-9 rounded-full bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] flex items-center justify-center text-[var(--foreground)] transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar snap-x"
      >
        {projects.map((project) => (
          <div
            key={project.id}
            className="min-w-70 md:min-w-80 bg-[var(--nm-bg)] rounded-[28px] overflow-hidden shadow-[var(--nm-raised)] snap-start hover:shadow-[var(--nm-raised-lg)] transition-all group"
          >
            <div
              className="h-40 w-full bg-cover bg-center bg-primary/10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]"
              style={{
                backgroundImage: project.coverImage
                  ? `url('${project.coverImage}')`
                  : 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%)',
              }}
            >
              {!project.coverImage && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/30">
                    code
                  </span>
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="font-bold text-[var(--foreground)] text-lg mb-1 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(project.contributors, 3) }).map(
                    (_, i) => (
                      <div
                        key={i}
                          className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shadow-[var(--nm-raised-sm)]"
                      >
                        <span className="material-symbols-outlined text-primary text-sm">
                          person
                        </span>
                      </div>
                    )
                  )}
                  {project.contributors > 3 && (
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[10px] text-[var(--foreground)] font-bold shadow-[var(--nm-raised-sm)]">
                      +{project.contributors - 3}
                    </div>
                  )}
                </div>

                {project.repoUrl ? (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    查看仓库
                  </a>
                ) : (
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    开发中
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
