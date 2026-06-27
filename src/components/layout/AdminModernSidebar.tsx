'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  submenu?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  {
    label: 'Attendance',
    href: '/admin/attendance',
    icon: 'assignment_turned_in',
    submenu: [
      { label: 'Attendance Dashboard', href: '/admin/attendance' },
      { label: 'Members', href: '/admin/members' },
    ],
  },
  { label: 'Activities', href: '/admin/activities', icon: 'calendar_month' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' },
];

interface AdminModernSidebarProps {
  sidebarOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function AdminModernSidebar({
  sidebarOpen,
  onToggle,
}: AdminModernSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleMenuClick = (item: NavItem) => {
    if (item.submenu) {
      setExpandedMenu(expandedMenu === item.href ? null : item.href);
    } else {
      onToggle(false);
      router.push(item.href);
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => onToggle(false)}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } shrink-0 flex flex-col justify-between border-r border-white/10 bg-surface-darker h-full transition-all duration-300 fixed left-0 top-0 z-40 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white font-bold text-xl">
                admin_panel_settings
              </span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white text-base font-bold leading-none tracking-tight">
                  CompClub
                </h1>
                <p className="text-white/50 text-xs font-normal mt-1">Admin Portal</p>
              </div>
            )}
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isItemActive = isActive(item.href);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenu === item.href;

              return (
                <div key={item.href}>
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${
                      isItemActive
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined group-hover:text-blue-400 transition-colors shrink-0">
                      {item.icon}
                    </span>
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        {hasSubmenu && (
                          <span
                            className={`material-symbols-outlined text-sm transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  {hasSubmenu && isExpanded && sidebarOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-4">
                      {item.submenu?.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => onToggle(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            pathname === subitem.href
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-white/50 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-white/50 truncate">Lead Admin</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-2 px-3 py-2 text-xs text-white/60 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors text-left"
            >
              <span className="material-symbols-outlined text-sm align-middle mr-2">logout</span>
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
