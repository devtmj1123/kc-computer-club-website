'use client';

import { forwardRef, SelectHTMLAttributes, useId, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      options,
      placeholder,
      error,
      hint,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const [mounted, setMounted] = useState(false);
    const generatedId = useId();
    const selectId = id || (mounted ? generatedId : '');

    useEffect(() => {
      setMounted(true);
    }, []);

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId || undefined}
            className="text-[13px] font-medium tracking-[0.01em] text-[var(--text-secondary)]"
          >
            {label}
            {required && <span className="text-[var(--error)] ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId || undefined}
            className={cn(
              'h-[46px] w-full cursor-pointer rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 pr-10 text-[15px] font-medium text-[var(--foreground)] outline-none transition-colors',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-[var(--error)]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none">
            expand_more
          </span>
        </div>

        {error && (
          <p className="flex items-center gap-1 text-[13px] text-[var(--error)]">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-[13px] text-[var(--text-secondary)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
