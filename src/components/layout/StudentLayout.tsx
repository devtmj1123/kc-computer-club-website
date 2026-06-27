'use client';

import { cn } from '@/lib/utils';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useClub } from '@/contexts/ClubContext';
import { ClubLogo } from '@/components/ui/ClubLogo';
import Link from 'next/link';

interface StudentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function StudentLayout({
  children,
  className,
}: StudentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { clubInfo } = useClub();

  return (
    <div className={cn('student-layout min-h-screen bg-[var(--background)]', className)}>
      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
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
              className="md:hidden size-10 flex items-center justify-center rounded-2xl shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] transition-all text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              title="打开菜单"
            >
              <span className="material-symbols-outlined text-lg">
                {sidebarOpen ? 'close' : 'menu'}
              </span>
            </button>

            <Link href="/" className="md:hidden flex items-center gap-2">
              <ClubLogo />
              <span className="text-sm font-bold text-[var(--foreground)]">
                电脑学会
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle compact />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
