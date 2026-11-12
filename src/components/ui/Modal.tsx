'use client';

import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center p-4',
        'bg-[rgba(16,22,18,0.55)] backdrop-blur-sm',
        'animate-fade-in'
      )}
    >
      <div
        className={cn(
          'w-full rounded-[3px] border border-[var(--rule-strong)]',
          'bg-[var(--surface)]',
          'animate-scale-in',
          sizeClasses[size],
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-[var(--border)] p-5 sm:p-6">
            <div>
              {title && (
                <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'group flex size-8 items-center justify-center',
                  'border border-[var(--border)]',
                  'text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
                  'transition-colors'
                )}
              >
                <span className="material-symbols-outlined text-[17px] transition-transform duration-300 group-hover:rotate-90">
                  close
                </span>
              </button>
            )}
          </div>
        )}

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'info',
  loading = false,
}: ConfirmModalProps) {
  const iconMap = {
    danger: { icon: 'warning', color: 'text-[var(--error)]', bg: 'bg-[var(--error)]/10' },
    warning: { icon: 'error', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10' },
    info: { icon: 'info', color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
  };

  const { icon, color, bg } = iconMap[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div
          className={cn(
            'mx-auto size-14 rounded-full',
            'flex items-center justify-center',
            'mb-4',
            bg
          )}
        >
          <span className={cn('material-symbols-outlined text-2xl', color)}>
            {icon}
          </span>
        </div>

        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {description}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
