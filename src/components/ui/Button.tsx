'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  /** @deprecated kept for backwards compatibility; ignored. */
  glow?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      glow: _glow,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'group inline-flex items-center justify-center gap-2 rounded-none font-sans font-medium leading-none tracking-[0.015em] ' +
      'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
      'focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ' +
      'focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-[var(--primary)] text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)]',
      secondary:
        'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
      ghost:
        'border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
      danger:
        'bg-[var(--error)] text-[var(--error-contrast)] hover:brightness-90',
      outline:
        'border border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary-light)]',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-[12px]',
      md: 'h-10 px-4 text-[13px]',
      lg: 'h-12 px-6 text-[14px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!isLoading &&
          leftIcon &&
          (typeof leftIcon === 'string' ? (
            <span className="material-symbols-outlined shrink-0 text-[18px]">
              {leftIcon}
            </span>
          ) : (
            <span className="shrink-0">{leftIcon}</span>
          ))}

        <span className="truncate">{children}</span>

        {rightIcon &&
          (typeof rightIcon === 'string' ? (
            <span className="material-symbols-outlined shrink-0 text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">
              {rightIcon}
            </span>
          ) : (
            <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
              {rightIcon}
            </span>
          ))}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
