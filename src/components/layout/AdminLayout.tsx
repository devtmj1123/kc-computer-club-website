'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { ClubMark } from '@/components/ui/ClubMark';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AdminShellSkeleton } from '@/components/ui/PageSkeletons';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  adminName?: string;
  className?: string;
}

const navGroups: NavGroup[] = [
  {
    label: '总览',
    items: [{ label: '仪表盘', href: '/admin', icon: 'dashboard' }],
  },
  {
    label: '内容',
    items: [
      { label: '公告管理', href: '/admin/notices', icon: 'campaign' },
      { label: '活动管理', href: '/admin/activities', icon: 'event' },
      { label: '报名管理', href: '/admin/signups', icon: 'how_to_reg' },
      { label: '评论管理', href: '/admin/comments', icon: 'chat' },
    ],
  },
  {
    label: '成员',
    items: [
      { label: '学生管理', href: '/admin/students', icon: 'school' },
      { label: '考勤管理', href: '/admin/attendance', icon: 'event_available' },
      { label: '项目审核', href: '/admin/projects', icon: 'folder_check' },
      { label: '管理员管理', href: '/admin/manage', icon: 'admin_panel_settings' },
    ],
  },
  {
    label: '系统',
    items: [{ label: '社团信息', href: '/admin/settings', icon: 'settings' }],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

export function AdminLayout({
  children,
  adminName = 'Admin',
  className,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isLoading, isAdmin } = useAuth();
  const { clubInfo } = useClub();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isLoading, isAdmin, router]);

  const displayName = user?.name || adminName;
  const activeItem = allNavItems.find((item) => isActivePath(pathname, item.href));
  const activeLabel = activeItem?.label || '仪表盘';
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  if (isLoading) {
    return <AdminShellSkeleton />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="border border-[var(--border)] bg-[var(--surface)] px-10 py-8 text-center">
          <span className="material-symbols-outlined mb-3 text-3xl text-[var(--error)]">lock</span>
          <p className="text-sm text-[var(--text-secondary)]">需要管理员权限</p>
          <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            Redirecting to login
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className={cn('admin-layout flex min-h-screen bg-transparent', className)}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-[238px] flex-col border-r border-[var(--rule-strong)]',
          'bg-[var(--surface-hover)] transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--border)] px-[22px]">
          <Link href="/admin" className="flex items-center gap-3">
            <ClubMark
              size={30}
              src={clubInfo.logoUrl}
              alt={clubInfo.aboutTitle || clubInfo.clubName}
            />
            <span className="flex flex-col gap-1">
              <span className="font-display text-[14px] font-bold leading-none text-[var(--foreground)]">
                {clubInfo.aboutTitle || clubInfo.clubName}
              </span>
              <span className="font-mono text-[10px] leading-none tracking-[0.16em] text-[var(--text-tertiary)]">
                ADMIN CONSOLE
              </span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)] lg:hidden"
            aria-label="关闭菜单"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto pb-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-6 pb-2 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {group.label}
              </div>
              <div className="flex flex-col gap-px px-2.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 border-l-2 px-3 py-[9px] text-[12px] transition-colors',
                        active
                          ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] font-semibold text-[var(--foreground)]'
                          : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                      )}
                    >
                      <span
                        className={cn(
                          'material-symbols-outlined text-[17px] leading-none',
                          active ? 'text-[var(--primary)]' : 'opacity-70'
                        )}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-[30px] shrink-0 items-center justify-center bg-[var(--primary)] font-mono text-[12px] text-[var(--primary-contrast)]">
              {displayName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
                {displayName}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                ADMIN · ONLINE
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--error)]"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              退出
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="material-symbols-outlined text-[14px]">home</span>
              返回前台
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[238px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-4 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)] lg:hidden"
              aria-label="打开菜单"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            <div className="flex min-w-0 items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              <Link href="/admin" className="transition-colors hover:text-[var(--foreground)]">
                管理后台
              </Link>
              <span aria-hidden="true" className="text-[var(--text-tertiary)]">/</span>
              <span className="truncate font-semibold text-[var(--foreground)]">
                {activeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] sm:block">
              {today}
            </span>
            <ThemeToggle compact />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
