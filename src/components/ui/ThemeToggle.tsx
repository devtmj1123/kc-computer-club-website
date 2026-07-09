'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  showColorPicker?: boolean;
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({
  showColorPicker = true,
  compact = false,
  className
}: ThemeToggleProps) {
  const { mode, setMode, colors, presetColors, applyPreset } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className={cn(
        'p-2 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)]',
        compact ? 'w-9 h-9' : 'w-24 h-9',
        className
      )} />
    );
  }

  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={toggleMode}
          className={cn(
            'p-2 rounded-2xl transition-all',
            'bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] text-[var(--foreground)]',
            className
          )}
          title={mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {mode === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-2xl transition-all',
            'bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] text-[var(--foreground)]',
            className
          )}
          title="主题颜色"
        >
          <span className="material-symbols-outlined text-[20px]">
            palette
          </span>
        </button>
        {isOpen && (
          <div className={cn(
            'absolute right-4 top-14 w-64 z-50',
            'bg-[var(--nm-bg)] rounded-[28px] shadow-[var(--nm-raised-lg)]',
            'overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200'
          )}>
            {showColorPicker && (
              <div className="p-3">
                <p className="text-xs text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wider px-1">
                  主题颜色
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => applyPreset(preset.color)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all',
                        'hover:shadow-[var(--nm-inset-sm)]',
                        colors.primary === preset.color && 'ring-2 ring-offset-2 ring-offset-[var(--nm-bg)]'
                      )}
                      style={{
                        '--tw-ring-color': preset.color
                      } as React.CSSProperties}
                      title={preset.name}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-inner"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-[10px] text-[var(--text-secondary)] truncate w-full text-center">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleMode}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-2xl transition-all',
            'bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] text-[var(--foreground)]',
            'text-sm font-medium'
          )}
          title={mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {mode === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="hidden sm:inline">{mode === 'dark' ? '亮色' : '暗色'}</span>
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-2xl transition-all',
            'bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] text-[var(--foreground)]',
            'text-sm font-medium',
            isOpen && 'ring-2 ring-primary/50'
          )}
        >
          <span className="material-symbols-outlined text-[20px]">
            palette
          </span>
          <span className="hidden sm:inline">主题颜色</span>
          <span className="material-symbols-outlined text-[16px]">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-64 z-50',
          'bg-[var(--nm-bg)] rounded-[28px] shadow-[var(--nm-raised-lg)]',
          'overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200'
        )}>
          {showColorPicker && (
            <div className="p-3">
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wider px-1">
                主题颜色
              </p>
              <div className="grid grid-cols-4 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => applyPreset(preset.color)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all',
                      'hover:shadow-[var(--nm-inset-sm)]',
                      colors.primary === preset.color && 'ring-2 ring-offset-2 ring-offset-[var(--nm-bg)]'
                    )}
                    style={{
                      '--tw-ring-color': preset.color
                    } as React.CSSProperties}
                    title={preset.name}
                  >
                    <div
                      className="w-6 h-6 rounded-full shadow-inner"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-[10px] text-[var(--text-secondary)] truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
