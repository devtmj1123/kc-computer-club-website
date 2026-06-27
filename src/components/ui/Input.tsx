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
              'material-symbols-outlined text-[20px] text-[#9dabb9]',
              position === 'left' ? 'absolute left-4 top-1/2 -translate-y-1/2' : '',
              position === 'right' && onRightIconClick
                ? 'cursor-pointer hover:text-white transition-colors'
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
            position === 'left' ? 'left-4' : 'right-4'
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
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && renderIcon(leftIcon, 'left')}

          <input
            ref={ref}
            id={inputId || undefined}
            type={type}
            className={cn(
              'w-full rounded-2xl px-4 py-3 text-base outline-none transition-all duration-200',
              'bg-[var(--nm-bg)] text-[var(--foreground)] placeholder:text-[var(--input-placeholder)]',
              'shadow-[var(--nm-inset)] focus:shadow-[var(--nm-inset),0_0_0_2px_var(--primary-light)]',
              error && 'shadow-[var(--nm-inset),0_0_0_2px_rgba(239,68,68,0.18)]',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              {renderIcon(rightIcon, 'right')}
            </span>
          )}
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

Input.displayName = 'Input';

export { Input };
