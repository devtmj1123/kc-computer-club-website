'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ClubMark } from '@/components/ui/ClubMark';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface HeaderProps {
  navItems?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '公告', href: '/notices' },
  { label: '活动', href: '/activities' },
  { label: '项目', href: '/projects' },
  { label: '关于', href: '/about' },
];

const moreItems = [
  { href: '/attendance', label: '签到', sublabel: '标记考勤' },
  { href: '/projects/submit', label: '项目提交', sublabel: '提案新项目' },
  { href: '/tutorial', label: '开发者教程', sublabel: '了解项目结构' },
];

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ navItems = defaultNavItems, className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isStudent, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-[var(--rule-strong)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-md',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1360px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <ClubMark size={36} priority />
          <span className="hidden flex-col gap-1 sm:flex">
            <span className="font-display text-[15px] font-bold leading-none tracking-[0.02em] text-[var(--foreground)]">
              坤成中学电脑学会
            </span>
            <span className="font-mono text-[12px] leading-none tracking-[0.18em] text-[var(--text-tertiary)]">
              KUEN CHENG COMPUTER CLUB
            </span>
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const active = item.active ?? isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full items-center border-b-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'border-[var(--primary)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="group relative flex h-full items-center">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
            >
              更多
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            <div className="invisible absolute right-0 top-[60px] z-50 w-60 border border-[var(--border)] bg-[var(--surface)] p-1.5 opacity-0 shadow-[var(--shadow-md)] transition-all duration-150 group-hover:visible group-hover:opacity-100">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <span className="text-[13px] font-medium text-[var(--foreground)]">
                    {item.label}
                  </span>
                  <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
                    {item.sublabel}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden font-mono text-[12px] tracking-[0.14em] text-[var(--text-tertiary)] xl:block">
            2026 / 学年
          </span>
          <ThemeToggle compact className="hidden sm:inline-flex" />

          {isStudent && user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-2 py-2 text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
              >
                <span className="material-symbols-outlined text-[17px]">person</span>
                {user.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--rule-strong)] hover:text-[var(--foreground)]"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="group hidden items-center gap-2 border border-[var(--rule-strong)] px-4 py-2 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] md:inline-flex"
            >
              成员登录
              <span className="text-[13px] text-[var(--primary)] transition-transform duration-200 group-hover:translate-x-0.5">↗</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 px-2 py-2 text-[12px] font-medium text-[var(--primary)] md:inline-flex"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              后台
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center border border-[var(--border)] text-[var(--foreground)] lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="打开菜单"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] lg:hidden">
          <nav className="mx-auto flex w-full max-w-[1360px] flex-col px-4 py-4 sm:px-6">
            {navItems.map((item, index) => {
              const active = item.active ?? isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between border-b border-[var(--border)] py-3 text-[14px]',
                    active ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[12px] tracking-[0.12em] text-[var(--text-tertiary)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-[13px] text-[var(--text-tertiary)]">↗</span>
                </Link>
              );
            })}

            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between border-b border-[var(--border)] py-3 text-[13px] text-[var(--text-secondary)]"
              >
                <span>{item.label}</span>
                <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
                  {item.sublabel}
                </span>
              </Link>
            ))}

            <div className="mt-4 flex items-center justify-between">
              <ThemeToggle />
              {isStudent && user ? (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)]"
                >
                  退出登录
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 bg-[var(--primary)] px-4 py-2 text-[12px] font-semibold text-[var(--primary-contrast)]"
                >
                  成员登录 ↗
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
