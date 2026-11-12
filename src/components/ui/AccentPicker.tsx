'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface AccentPickerProps {
  compact?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

export function AccentPicker({
  compact = false,
  align = 'right',
  className,
}: AccentPickerProps) {
  const { accent, setAccent, accents, mode } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="更改强调色"
        aria-haspopup="menu"
        aria-expanded={open}
        title="更改强调色"
        className={cn(
          'group relative inline-flex h-9 items-center justify-center gap-2 border border-[var(--border)]',
          'bg-transparent text-[var(--text-secondary)] transition-colors',
          'hover:border-[var(--primary)] hover:text-[var(--primary)]',
          compact ? 'w-9 p-0' : 'px-3'
        )}
      >
        <span className="material-symbols-outlined text-[17px] transition-transform duration-300 group-hover:-rotate-12">
          palette
        </span>
        {!compact && (
          <span className="font-mono text-[12px] uppercase tracking-[0.1em]">
            色调
          </span>
        )}
        {compact ? (
          <span
            className="absolute bottom-1 right-1 size-[5px] border border-[var(--rule-strong)]"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-hidden="true"
          />
        ) : (
          <span
            className="size-2 shrink-0 border border-[var(--rule-strong)] transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="强调色"
          className={cn(
            'animate-slide-down absolute top-full z-50 mt-2 w-56 origin-top border border-[var(--rule-strong)] bg-[var(--surface)] p-2 shadow-[var(--shadow-lg)]',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <div className="px-1.5 pb-2 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            ACCENT / 色调
          </div>
          <div className="grid grid-cols-3 gap-1">
            {accents.map((preset) => {
              const selected = preset.id === accent;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    setAccent(preset.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'group/swatch flex flex-col items-center gap-1.5 border px-1 py-2 transition-colors',
                    selected
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  <span
                    className="size-4 border border-[var(--rule-strong)] transition-transform duration-200 group-hover/swatch:scale-125"
                    style={{
                      backgroundColor:
                        mode === 'light'
                          ? preset.swatch.light
                          : preset.swatch.dark,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-[12px] leading-none',
                      selected
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
