'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { mode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-9 border border-[var(--border)] bg-transparent',
          compact ? 'w-9' : 'w-24',
          className
        )}
      />
    );
  }

  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggleMode}
      title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
      aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 border border-[var(--border)]',
        'bg-transparent text-[var(--text-secondary)] transition-colors',
        'hover:border-[var(--rule-strong)] hover:text-[var(--foreground)]',
        compact ? 'w-9' : 'px-3',
        className
      )}
    >
      <span className="material-symbols-outlined text-[16px]">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
      {!compact && (
        <span className="font-mono text-[12px] uppercase tracking-[0.1em]">
          {isDark ? '亮色' : '暗色'}
        </span>
      )}
    </button>
  );
}
