'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
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
  const { mode, setMode, resolvedMode, colors, presetColors, applyPreset } = useTheme();
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

  const modeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: '浅色', icon: 'light_mode' },
    { value: 'dark', label: '深色', icon: 'dark_mode' },
    { value: 'system', label: '跟随系统', icon: 'settings_brightness' },
  ];

  const currentModeIcon = mode === 'system'
    ? 'settings_brightness'
    : resolvedMode === 'dark'
      ? 'dark_mode'
      : 'light_mode';

  if (!mounted) {
    return (
      <div className={cn(
        'p-2 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)]',
        compact ? 'w-9 h-9' : 'w-24 h-9',
        className
      )} />
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => {
          const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
          setMode(nextMode);
        }}
        className={cn(
          'p-2 rounded-2xl transition-all',
          'bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] text-[var(--foreground)]',
          className
        )}
        title={`当前: ${modeOptions.find(m => m.value === mode)?.label}`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {currentModeIcon}
        </span>
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
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
          {currentModeIcon}
        </span>
        <span className="hidden sm:inline">主题</span>
        <span className="material-symbols-outlined text-[16px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-64 z-50',
          'bg-[var(--nm-bg)] rounded-[28px] shadow-[var(--nm-raised-lg)]',
          'overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200'
        )}>
          <div className="p-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
            <p className="text-xs text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wider px-1">
              外观模式
            </p>
            <div className="flex gap-1">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMode(option.value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl transition-all',
                    mode === option.value
                      ? 'bg-primary/18 text-primary shadow-[var(--nm-inset-sm)]'
                      : 'hover:shadow-[var(--nm-inset-sm)] text-[var(--text-secondary)]'
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {option.icon}
                  </span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

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
