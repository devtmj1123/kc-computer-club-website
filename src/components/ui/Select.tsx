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
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId || undefined}
            className={cn(
              'w-full cursor-pointer rounded-2xl px-4 py-3 pr-10 text-base outline-none transition-all duration-200',
              'bg-[var(--nm-bg)] text-[var(--foreground)] shadow-[var(--nm-inset)]',
              'focus:shadow-[var(--nm-inset),0_0_0_2px_var(--primary-light),inset_0_0_0_1.5px_var(--primary)]',
              'hover:shadow-[var(--nm-inset),0_0_0_1px_var(--primary-light)]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              error && 'shadow-[var(--nm-inset),0_0_0_2px_rgba(239,68,68,0.18)]',
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
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
