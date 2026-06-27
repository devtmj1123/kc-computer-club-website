'use client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
export default function ProjectsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'revision'>('all');
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
    const matchSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       project.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400';
      case 'approved':
        return 'bg-[#13ec80]/10 text-[#13ec80]';
      case 'rejected':
        return 'bg-red-500/10 text-red-400';
      case 'revision':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
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
        return status;
    }
  };
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'web': '网页应用',
      'mobile': '移动应用',
      'ai': 'AI/ML',
      'game': '游戏开发',
      'iot': '物联网',
      'security': '网络安全',
      'data': '数据分析',
      'other': '其他',
    };
    return categoryMap[category] || category;
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };
  const userHasProject = user ? projects.some(p => 
    p.members.some(m => m.email.toLowerCase() === user.email.toLowerCase())
  ) : false;
  if (isLoading || authLoading) {
    return (
      <StudentLayout>
        <main className="grow py-8 px-4 md:px-10 lg:px-20">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-[#13ec80] animate-spin">hourglass_empty</span>
              <p className="text-[var(--text-secondary)]">加载中...</p>
            </div>
          </div>
        </main>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <main className="grow py-8 px-4 md:px-10 lg:px-20" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: 'var(--foreground)' }}>项目</h1>
              <p style={{ color: 'var(--text-secondary)' }}>浏览和管理社团的所有项目</p>
            </div>
            <Link href="/projects/submit">
              <button 
                disabled={userHasProject}
                className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-bold transition-all`}
                style={{
                  backgroundColor: userHasProject ? 'var(--button-disabled-bg)' : 'var(--primary)',
                  color: userHasProject ? 'var(--text-secondary)' : 'var(--primary-foreground)',
                  cursor: userHasProject ? 'not-allowed' : 'pointer',
                  opacity: userHasProject ? 0.5 : 1,
                }}
              >
                <span className="material-symbols-outlined">add</span>
                {userHasProject ? '已有项目' : '新建项目'}
              </button>
            </Link>
          </div>
          <div className="mb-8 space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                placeholder="搜索项目名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border pl-12 pr-4 py-3 outline-none transition-all focus:ring-1"
                style={{
                  borderColor: 'var(--card-border)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--foreground)',
                  '--tw-ring-color': 'var(--primary)',
                } as React.CSSProperties}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待审核' },
                { value: 'approved', label: '已批准' },
                { value: 'revision', label: '需修改' },
                { value: 'rejected', label: '已拒绝' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value as 'all' | 'pending' | 'approved' | 'rejected' | 'revision')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all`}
                  style={{
                    backgroundColor: filterStatus === option.value ? 'var(--primary)' : 'var(--button-secondary-bg)',
                    color: filterStatus === option.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.projectId}
                  onClick={() => router.push(`/projects/${project.projectId}`)}
                  className="h-full rounded-2xl p-6 border transition-all cursor-pointer group"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(19, 236, 128, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--card-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(project.updatedAt)}</span>
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--primary)' }}>{project.teamName}</p>
                  <h3 className="text-lg font-bold mb-2 transition-colors group-hover:text-primary" style={{ color: 'var(--foreground)' }}>
                    {project.title}
                  </h3>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium mb-4" style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--text-secondary)' }}>
                    {getCategoryLabel(project.category)}
                  </span>
                  {project.projectLink && (
                    <div className="mb-4">
                      <a
                        href={project.projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--primary)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-sm">link</span>
                        查看仓库
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2"
                          style={{ background: 'linear-gradient(135deg, var(--primary), #4f46e5)', borderColor: 'var(--background)' }}
                          title={member.name}
                        >
                          {member.name.charAt(0)}
                        </div>
                      ))}
                      {project.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ backgroundColor: 'var(--tag-bg)', borderColor: 'var(--background)', color: 'var(--foreground)' }}>
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{project.members.length} 名成员</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600 mb-4 block">
                  folder_open
                </span>
                <p className="text-gray-700 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' ? '没有找到匹配的项目' : '暂无项目，快来创建第一个项目吧！'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </StudentLayout>
  );
}