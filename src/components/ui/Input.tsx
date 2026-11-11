'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useId, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: string | ReactNode;
  rightIcon?: string | ReactNode;
  onRightIconClick?: () => void;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      leftIcon,
      rightIcon,
      onRightIconClick,
      error,
      hint,
      required,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const [mounted, setMounted] = useState(false);
    const generatedId = useId();
    const inputId = id || (mounted ? generatedId : '');

    useEffect(() => {
      setMounted(true);
    }, []);

    const renderIcon = (icon: string | ReactNode, position: 'left' | 'right') => {
      if (typeof icon === 'string') {
        return (
          <span
            className={cn(
              'material-symbols-outlined text-[18px] text-[var(--text-tertiary)]',
              position === 'left' ? 'absolute left-3.5 top-1/2 -translate-y-1/2' : '',
              position === 'right' && onRightIconClick
                ? 'cursor-pointer transition-colors hover:text-[var(--foreground)]'
                : ''
            )}
            onClick={position === 'right' ? onRightIconClick : undefined}
          >
            {icon}
          </span>
        );
      }
      return (
        <span
          className={cn(
            'absolute top-1/2 -translate-y-1/2',
            position === 'left' ? 'left-3.5' : 'right-3.5'
          )}
          onClick={position === 'right' ? onRightIconClick : undefined}
        >
          {icon}
        </span>
      );
    };

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId || undefined}
            className="text-[12px] font-medium tracking-[0.01em] text-[var(--text-secondary)]"
          >
            {label}
            {required && <span className="ml-1 text-[var(--error)]">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && renderIcon(leftIcon, 'left')}

          <input
            ref={ref}
            id={inputId || undefined}
            type={type}
            className={cn(
              'w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)]',
              'min-h-[46px] px-3.5 py-3 text-[15px] font-medium text-[var(--foreground)] outline-none transition-colors',
              'placeholder:font-normal placeholder:text-[var(--input-placeholder)]',
              'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]',
              error && 'border-[var(--error)]',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {renderIcon(rightIcon, 'right')}
            </span>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1 text-[12px] tracking-[0.01em] text-[var(--error)]">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-[12px] leading-relaxed tracking-[0.01em] text-[var(--text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
