'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useClub } from '@/contexts/ClubContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  description?: string;
  badge?: number;
}

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navItems: NavItem[] = [
  { label: '首页', href: '/', icon: 'home' },
  { label: '公告', href: '/notices', icon: 'campaign' },
  { label: '活动', href: '/activities', icon: 'event' },
  { label: '签到', href: '/attendance', icon: 'event_available' },
  { label: '项目', href: '/projects', icon: 'folder' },
  { label: '项目提交', href: '/projects/submit', icon: 'lightbulb' },
  { label: '教程', href: '/tutorial', icon: 'school' },
  { label: '关于', href: '/about', icon: 'info' },
];

export function StudentSidebar({ isOpen, onClose, onCollapsedChange }: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clubInfo } = useClub();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen z-40',
          'bg-[var(--nm-bg)] shadow-[var(--nm-raised-lg)]',
          'flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div
          className={cn(
            'h-16 px-4 flex items-center justify-between',
            'shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]',
            'flex-shrink-0'
          )}
        >
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 transition-all duration-300',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[var(--nm-raised-sm)]">
              {clubInfo.logoUrl ? (
                <img
                  src={clubInfo.logoUrl}
                  alt="Club Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-primary font-black text-lg">KC</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--foreground)] truncate">
                  {clubInfo.clubName || '电脑学会'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  KC Computer Club
                </p>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCollapse(!sidebarCollapsed)}
              className="hidden md:flex size-8 items-center justify-center rounded-xl shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] transition-all text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              title={sidebarCollapsed ? '展开' : '收起'}
            >
              <span className="material-symbols-outlined text-lg">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="md:hidden size-8 flex items-center justify-center rounded-xl shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] transition-all text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <nav
          className={cn(
            'flex-1 overflow-y-auto',
            sidebarCollapsed ? 'px-2' : 'px-3',
            'py-4 space-y-1'
          )}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                  'text-sm font-medium transition-all duration-200',
                  'relative group',
                  isActive
                    ? 'bg-primary/12 text-primary shadow-[var(--nm-inset-sm)]'
                    : 'text-[var(--text-secondary)] hover:shadow-[var(--nm-inset-sm)] hover:text-[var(--foreground)]'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="material-symbols-outlined text-lg flex-shrink-0">
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50">
                    <div className="bg-[var(--nm-bg)] rounded-2xl px-3 py-2 whitespace-nowrap text-[var(--foreground)] text-sm font-medium shadow-[var(--nm-raised)]">
                      {item.label}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'p-3 flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
            'space-y-2'
          )}
        >
          {user && (
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                'bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)]',
                'transition-all group',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? '个人资料' : undefined}
            >
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-[var(--nm-raised-sm)]">
                <span className="material-symbols-outlined text-primary text-lg">
                  person
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {user.email}
                  </p>
                </div>
              )}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 whitespace-nowrap text-[var(--foreground)] text-sm font-medium shadow-lg">
                    个人资料
                  </div>
                </div>
              )}
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                'text-red-400 hover:bg-red-500/10 hover:text-red-300 shadow-[var(--nm-inset-sm)]',
                'transition-all group',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? '退出登录' : undefined}
            >
              <span className="material-symbols-outlined text-lg flex-shrink-0">
                logout
              </span>
              {!sidebarCollapsed && <span>退出登录</span>}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 whitespace-nowrap text-red-300 text-sm font-medium shadow-lg">
                    退出登录
                  </div>
                </div>
              )}
            </button>
          )}

          {!user && (
            <Link
              href="/auth/login"
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'bg-primary/10 hover:bg-primary/20 text-primary',
                'transition-colors group font-medium',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? '登录' : undefined}
            >
              <span className="material-symbols-outlined text-lg flex-shrink-0">
                login
              </span>
              {!sidebarCollapsed && <span>登录</span>}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 whitespace-nowrap text-primary text-sm font-medium shadow-lg">
                    登录
                  </div>
                </div>
              )}
            </Link>
          )}

          <Link
            href="/admin"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
              'transition-colors group font-medium',
              sidebarCollapsed && 'justify-center'
            )}
            title={sidebarCollapsed ? '管理面板' : undefined}
          >
            <span className="material-symbols-outlined text-lg flex-shrink-0">
              admin_panel_settings
            </span>
            {!sidebarCollapsed && <span>管理面板</span>}

            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 whitespace-nowrap text-blue-400 text-sm font-medium shadow-lg">
                  管理面板
                </div>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
