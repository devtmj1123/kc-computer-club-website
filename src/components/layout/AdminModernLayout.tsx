'use client';

import React, { useState } from 'react';
import { AdminModernSidebar } from './AdminModernSidebar';

interface AdminModernLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AdminModernLayout({
  children,
  title = 'Dashboard',
  description,
  action,
}: AdminModernLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background-dark text-white">
      <AdminModernSidebar sidebarOpen={sidebarOpen} onToggle={setSidebarOpen} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="shrink-0 px-8 py-6 border-b border-white/5 bg-background-dark">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/70 hover:text-white lg:hidden"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
                {description && <p className="text-white/60 text-sm mt-1">{description}</p>}
              </div>
            </div>
            {action && (
              <button
                onClick={action.onClick}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 flex flex-col gap-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
