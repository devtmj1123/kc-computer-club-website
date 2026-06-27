'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BreathingToggleCompact } from '@/components/ui/BreathingToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: string;
}

interface HeaderProps {
  navItems?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '关于我们', href: '/about' },
  { label: '公告', href: '/notices' },
  { label: '活动', href: '/activities' },
];

function NavLinkItem({ item }: { item: NavItem }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: '0.875rem',
        fontWeight: 500,
        background: 'var(--nm-bg)',
        boxShadow: hovered ? 'var(--nm-raised-sm)' : 'none',
        color: item.active
          ? 'var(--primary)'
          : hovered
            ? 'var(--foreground)'
            : 'var(--text-secondary)',
        transition: 'box-shadow 0.2s ease, color 0.2s ease',
        textDecoration: 'none',
      }}
    >
      {item.label}
    </Link>
  );
}

function DropdownItem({
  href,
  icon,
  label,
  sublabel,
}: {
  href: string;
  icon: string;
  label: string;
  sublabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        fontSize: '0.875rem',
        background: hovered ? 'rgba(19, 236, 128, 0.08)' : 'transparent',
        color: hovered ? 'var(--primary)' : 'var(--text-secondary)',
        transition: 'background 0.15s ease, color 0.15s ease',
        textDecoration: 'none',
      }}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <div>
        <div style={{ fontWeight: 500, color: hovered ? 'var(--primary)' : 'var(--foreground)' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sublabel}</div>
      </div>
    </Link>
  );
}

export function Header({ navItems = defaultNavItems, className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreHovered, setMoreHovered] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
  const router = useRouter();
  const { user, isStudent, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <header
      className={cn('sticky top-0 z-50 w-full', className)}
      style={{
        background: 'var(--nm-bg)',
        boxShadow: '0 4px 16px var(--nm-shadow-dark)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-300 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center"
            style={{
              background: 'var(--nm-bg)',
              boxShadow: 'var(--nm-raised-sm)',
              borderRadius: 12,
            }}
          >
            <span className="font-black text-lg" style={{ color: 'var(--primary)' }}>
              KC
            </span>
          </div>
          <h2
            className="text-lg font-bold tracking-tight hidden sm:block"
            style={{ color: 'var(--foreground)' }}
          >
            电脑学会
          </h2>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLinkItem key={item.href} item={item} />
          ))}

          <div className="relative group">
            <button
              onMouseEnter={() => setMoreHovered(true)}
              onMouseLeave={() => setMoreHovered(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'var(--nm-bg)',
                boxShadow: moreHovered ? 'var(--nm-raised-sm)' : 'none',
                color: moreHovered ? 'var(--foreground)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease, color 0.2s ease',
              }}
            >
              <span>更多</span>
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </button>

            <div
              className="absolute right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-raised-lg)',
                borderRadius: 16,
                border: 'none',
                overflow: 'hidden',
              }}
            >
              <div className="py-2">
                <DropdownItem
                  href="/attendance"
                  icon="event_available"
                  label="签到"
                  sublabel="标记考勤"
                />
                <DropdownItem href="/chat" icon="chat" label="群聊" sublabel="加入讨论" />
                <DropdownItem
                  href="/projects/submit"
                  icon="lightbulb"
                  label="项目提交"
                  sublabel="提案新项目"
                />

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                <DropdownItem
                  href="/projects"
                  icon="folder"
                  label="所有项目"
                  sublabel="浏览项目列表"
                />
                <DropdownItem
                  href="/tutorial"
                  icon="school"
                  label="开发者教程"
                  sublabel="了解项目结构"
                />
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle compact className="hidden md:flex" />
          <BreathingToggleCompact />

          {isStudent && user ? (
            <div className="hidden md:flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/profile"
                onMouseEnter={() => setUserHovered(true)}
                onMouseLeave={() => setUserHovered(false)}
                title="查看个人资料"
                className="cursor-pointer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.875rem',
                  color: userHovered ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'color 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  background: logoutHovered ? 'var(--error)' : 'var(--nm-bg)',
                  boxShadow: 'var(--nm-raised-sm)',
                  color: logoutHovered ? '#fff' : 'var(--error)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>退出</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              onMouseEnter={() => setLoginHovered(true)}
              onMouseLeave={() => setLoginHovered(false)}
              className="hidden md:flex items-center justify-center gap-2"
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 700,
                background: loginHovered ? 'var(--primary)' : 'var(--nm-bg)',
                boxShadow: 'var(--nm-raised-sm)',
                color: loginHovered ? '#111814' : 'var(--primary)',
                transition: 'box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease',
                textDecoration: 'none',
              }}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>登录</span>
            </Link>
          )}

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              background: 'var(--nm-bg)',
              boxShadow: 'var(--nm-raised-sm)',
              borderRadius: 10,
              color: 'var(--foreground)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            background: 'var(--nm-bg)',
            boxShadow: 'inset 0 4px 12px var(--nm-shadow-dark)',
          }}
        >
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: item.active ? 'rgba(19, 236, 128, 0.08)' : 'transparent',
                  boxShadow: item.active ? 'var(--nm-inset-sm)' : 'none',
                  color: item.active ? 'var(--primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            <p
              style={{
                padding: '4px 16px 8px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              更多功能
            </p>

            {[
              { href: '/attendance', icon: 'event_available', label: '签到', sub: '标记考勤' },
              { href: '/chat', icon: 'chat', label: '群聊', sub: '加入讨论' },
              { href: '/projects/submit', icon: 'lightbulb', label: '项目提交', sub: '提案新项目' },
              { href: '/projects', icon: 'folder', label: '所有项目', sub: '浏览项目列表' },
              { href: '/tutorial', icon: 'school', label: '开发者教程', sub: '了解项目结构' },
            ].map(({ href, icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: 'var(--primary)' }}
                >
                  {icon}
                </span>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sub}</div>
                </div>
              </Link>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

            {isStudent && user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: 'rgba(19, 236, 128, 0.08)',
                    boxShadow: 'var(--nm-inset-sm)',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  个人资料
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: 'var(--nm-bg)',
                    boxShadow: 'var(--nm-raised-sm)',
                    color: 'var(--error)',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  退出
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'rgba(19, 236, 128, 0.08)',
                  boxShadow: 'var(--nm-inset-sm)',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                登录
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
