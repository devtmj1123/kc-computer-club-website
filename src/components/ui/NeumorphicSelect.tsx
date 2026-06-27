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
        <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-base outline-none transition-all duration-200',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
          style={{
            background: 'var(--nm-bg)',
            boxShadow: isOpen ? 'var(--nm-inset)' : 'var(--nm-inset)',
            borderRadius: 18,
            color: selectedLabel ? 'var(--foreground)' : 'var(--text-tertiary)',
            border: isOpen ? '1.5px solid var(--primary)' : '1.5px solid transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <span
            className="material-symbols-outlined transition-transform duration-200"
            style={{
              color: 'var(--text-secondary)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            expand_more
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 overflow-hidden"
            style={{
              background: 'var(--nm-bg)',
              boxShadow: 'var(--nm-raised-lg)',
              borderRadius: 18,
              border: 'none',
              animation: 'slide-down 0.2s ease-out',
            }}
          >
            <div className="py-2 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-base transition-all duration-150',
                    option.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                  style={{
                    color:
                      option.value === value
                        ? 'var(--primary)'
                        : option.disabled
                          ? 'var(--text-tertiary)'
                          : 'var(--foreground)',
                    background:
                      option.value === value
                        ? 'var(--primary-light)'
                        : 'transparent',
                    fontWeight: option.value === value ? 600 : 400,
                    cursor: option.disabled ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!option.disabled && option.value !== value) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (option.value !== value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}>
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
