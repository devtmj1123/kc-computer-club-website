'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface NeumorphicSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface NeumorphicSelectProps {
  options: NeumorphicSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function NeumorphicSelect({
  options,
  value,
  onChange,
  placeholder = '请选择...',
  label,
  error,
  className,
  disabled = false,
}: NeumorphicSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = options.find((opt) => opt.value === value);
    setSelectedLabel(selected ? selected.label : '');
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>
      {label && (
        <label className="text-[12px] font-medium tracking-[0.01em] text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-[3px] border bg-[var(--input-bg)]',
            'min-h-[46px] px-3.5 py-2.5 text-left text-[15px] font-medium outline-none transition-colors',
            isOpen ? 'border-[var(--primary)]' : 'border-[var(--input-border)]',
            'hover:border-[var(--rule-strong)]',
            disabled && 'cursor-not-allowed opacity-60',
            selectedLabel ? 'text-[var(--foreground)]' : 'text-[var(--text-tertiary)]'
          )}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <span
            className={cn(
              'material-symbols-outlined text-[16px] text-[var(--text-tertiary)] transition-transform',
              isOpen && 'rotate-180'
            )}
          >
            expand_more
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-[var(--surface)] shadow-[var(--shadow-md)] animate-slide-down">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-3.5 py-2.5 text-left text-[14px] transition-colors',
                    option.value === value
                      ? 'bg-[var(--primary-light)] font-semibold text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
                    option.disabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-[12px] tracking-[0.01em] text-[var(--error)]">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
