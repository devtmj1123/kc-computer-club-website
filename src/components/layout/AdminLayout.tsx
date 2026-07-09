'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  adminName?: string;
  className?: string;
}

const navItems: NavItem[] = [
  { label: '仪表盘', href: '/admin', icon: 'dashboard' },
  { label: '公告管理', href: '/admin/notices', icon: 'campaign' },
  { label: '活动管理', href: '/admin/activities', icon: 'event' },
  { label: '报名管理', href: '/admin/signups', icon: 'how_to_reg' },
  { label: '学生管理', href: '/admin/students', icon: 'school' },
  { label: '评论管理', href: '/admin/comments', icon: 'chat' },
  { label: '考勤管理', href: '/admin/attendance', icon: 'event_available' },
  { label: '项目审核', href: '/admin/projects', icon: 'folder_check' },
  { label: '管理员管理', href: '/admin/manage', icon: 'admin_panel_settings' },
  { label: '社团信息', href: '/admin/settings', icon: 'settings' },
];

export function AdminLayout({
  children,
  adminName = 'Admin',
  className,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isLoading, isAdmin, router]);

  const displayName = user?.name || adminName;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center nm-panel p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center nm-panel p-8">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-4">lock</span>
          <p className="text-[var(--text-secondary)]">需要管理员权限</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className={cn('admin-layout flex min-h-screen bg-[var(--background)]', className)}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:fixed left-0 top-0 h-screen w-64',
          'bg-[var(--nm-bg)] shadow-[var(--nm-raised-lg)]',
          'flex flex-col',
          'z-40',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 px-6 flex items-center justify-between shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="size-8 rounded-2xl bg-[color:rgba(79,163,247,0.18)] flex items-center justify-center shadow-[var(--nm-raised-sm)]">
              <span className="material-symbols-outlined text-[var(--admin-primary)] text-lg">
                admin_panel_settings
              </span>
            </div>
            <span className="font-bold text-[var(--foreground)] text-lg">管理后台</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl',
                  'text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--admin-primary)] text-[#111814] shadow-[var(--nm-raised-sm)]'
                    : 'text-[var(--text-secondary)] hover:shadow-[var(--nm-inset-sm)] hover:text-[var(--foreground)]'
                )}
              >
                <span className="material-symbols-outlined text-lg flex items-center justify-center" style={{fontSize: '22px', lineHeight: 1}}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] mb-4">
            <div className="size-8 rounded-full bg-[color:rgba(79,163,247,0.18)] flex items-center justify-center shadow-[var(--nm-raised-sm)]">
              <span className="material-symbols-outlined text-[var(--admin-primary)] text-sm">
                person
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {displayName}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">管理员</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-all"
            leftIcon="logout"
          >
            退出登录
          </Button>

          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-all mt-1"
              leftIcon="home"
            >
              返回前台
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <header
          className={cn(
            'sticky top-0 z-30 h-16',
            'bg-[var(--nm-bg)]/85 backdrop-blur-md shadow-[var(--nm-raised-sm)]',
            'flex items-center justify-between px-4 sm:px-6'
          )}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Link href="/admin" className="hover:text-[var(--foreground)] transition-colors">
                首页
              </Link>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="text-[var(--foreground)]">
                {navItems.find((item) =>
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                )?.label || '仪表盘'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </header>

        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
