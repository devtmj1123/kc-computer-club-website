'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SecureCache } from '@/lib/cache';

interface Project {
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  createdAt: string;
  updatedAt?: string;
  leadName: string;
  members: any[];
  image?: string;
}

export function ActiveProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveProjects();
  }, []);

  const loadActiveProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cachedProjects = SecureCache.get<Project[]>('active_projects', {
        ttl: 5 * 60 * 1000,
        storage: 'localStorage',
      });

      if (cachedProjects) {
        setProjects(cachedProjects);
        return;
      }

      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error(`API 返回状态码 ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.projects)) {
        const activeProjects = data.projects
          .filter((p: Record<string, unknown>) => {
            const projectId = p.projectId as string;
            return projectId && projectId !== 'undefined';
          })
          .slice(0, 6)
          .map((p: Record<string, unknown>) => ({
            projectId: p.projectId as string,
            title: p.title as string,
            description: ((p.description as string) || '暂无描述').substring(0, 100) as string,
            status: (p.status as 'pending' | 'approved' | 'rejected' | 'revision') || 'pending',
            createdAt: p.createdAt ? new Date(p.createdAt as string).toLocaleDateString('zh-CN') : '待定',
            updatedAt: p.updatedAt ? new Date(p.updatedAt as string).toLocaleDateString('zh-CN') : undefined,
            leadName: (p.leaderEmail || p.leadName || '待确定') as string,
            members: (p.members as any[]) || [],
            image: p.image as string,
          }));

        setProjects(activeProjects);

        SecureCache.set('active_projects', activeProjects, {
          ttl: 5 * 60 * 1000,
          storage: 'localStorage',
        });
      } else {
        console.warn('API 返回格式异常:', data);
        setProjects([]);
      }
    } catch (err) {
      console.error('加载活跃项目失败:', err);
      setError('加载项目失败，请稍后重试');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'revision':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      case 'revision':
        return '需修改';
      default:
        return '未知';
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--foreground)] mb-1">
            活跃项目 🚀
          </h2>
          <p className="text-[var(--text-secondary)]">
            查看目前正在进行的项目
          </p>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 text-primary shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] transition-all font-medium"
        >
          <span>查看全部</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">
                hourglass_bottom
              </span>
            </div>
            <p className="text-[var(--text-secondary)]">加载项目中...</p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-2xl bg-red-500/10 p-4 text-red-400 text-center mb-4 shadow-[var(--nm-inset-sm)]">
          {error}
          <button
            onClick={loadActiveProjects}
            className="ml-2 underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <div className="rounded-[28px] bg-[var(--nm-bg)] p-12 text-center shadow-[var(--nm-raised)]">
          <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] mb-4 block">
            folder_open
          </span>
          <p className="text-[var(--text-secondary)] mb-4">
            暂无活跃项目
          </p>
          <Link
            href="/projects/submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-black shadow-[0_10px_28px_var(--primary-glow),var(--nm-raised-sm)] hover:bg-primary-hover transition-all font-medium"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            提交新项目
          </Link>
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.projectId}
              href={`/projects/${project.projectId}`}
              className="group"
            >
              <div className="h-full rounded-[28px] bg-[var(--nm-bg)] overflow-hidden shadow-[var(--nm-raised)] hover:shadow-[var(--nm-raised-lg)] transition-all duration-300">
                {project.image ? (
                  <div className="h-40 bg-cover bg-center overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-primary/22 to-primary/8 flex items-center justify-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
                    <span className="material-symbols-outlined text-6xl text-primary/40">
                      folder
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-primary transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    <span
                      className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>{project.leadName}</span>
                    {project.members && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {project.members.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
