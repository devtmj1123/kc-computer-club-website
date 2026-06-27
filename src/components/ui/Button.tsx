'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
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
      glow = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { breathingEffectEnabled } = useTheme();

    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-bold leading-normal tracking-[0.015em]
      rounded-2xl transition-all duration-300
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
      bg-[var(--nm-bg)] text-[var(--foreground)] shadow-[var(--nm-raised-sm)]
    `;

    const variantStyles = {
      primary: `
        bg-primary hover:bg-primary/90
        text-[#111814]
        focus:ring-primary
        ${glow && breathingEffectEnabled ? 'animate-rgb-breathing shadow-[0_0_20px_var(--primary-glow)] hover:animate-none hover:shadow-[0_0_30px_var(--primary-glow)]' : 'hover:shadow-[0_0_30px_var(--primary-glow)]'}
      `,
      secondary: `
        hover:bg-[var(--surface-hover)]
        text-[var(--btn-text)]
        focus:ring-[var(--primary)]
      `,
      ghost: `
        shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)]
        text-[var(--text-secondary)] hover:text-[var(--foreground)]
        focus:ring-primary
      `,
      danger: `
        bg-[var(--error)] hover:bg-[#dc2626]
        text-white
        focus:ring-[var(--error)]
      `,
      outline: `
        bg-[var(--nm-bg)] hover:bg-[var(--primary-light)]
        text-[var(--primary)]
        focus:ring-primary
      `,
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs sm:h-8 sm:px-2 md:px-2',
      md: 'h-10 px-4 text-sm sm:h-9 sm:px-3 md:h-10 md:px-4',
      lg: 'h-12 px-6 text-base sm:h-10 sm:px-4 md:h-12 md:px-6',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
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

        {!isLoading && leftIcon && (
          typeof leftIcon === 'string' ? (
            <span className="material-symbols-outlined text-[18px] shrink-0">{leftIcon}</span>
          ) : (
            <span className="shrink-0">{leftIcon}</span>
          )
        )}

        <span className="truncate">{children}</span>

        {rightIcon && (
          typeof rightIcon === 'string' ? (
            <span className="material-symbols-outlined text-[18px] shrink-0">{rightIcon}</span>
          ) : (
            <span className="shrink-0">{rightIcon}</span>
          )
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
