'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastStyles: Record<ToastType, { icon: string; border: string; iconColor: string }> = {
  success: {
    icon: 'check_circle',
    border: 'border-l-[var(--primary)]',
    iconColor: 'text-[var(--primary)]',
  },
  error: {
    icon: 'error',
    border: 'border-l-[var(--error)]',
    iconColor: 'text-[var(--error)]',
  },
  warning: {
    icon: 'warning',
    border: 'border-l-[var(--warning)]',
    iconColor: 'text-[var(--warning)]',
  },
  info: {
    icon: 'info',
    border: 'border-l-[var(--primary)]',
    iconColor: 'text-[var(--primary)]',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-100 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { icon, border, iconColor } = toastStyles[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 border border-[var(--rule-strong)] border-l-2 bg-[var(--surface)] px-4 py-3.5',
        'shadow-[0_10px_30px_rgba(0,0,0,0.12)]',
        'animate-toast-in',
        border
      )}
    >
      <span className={cn('material-symbols-outlined mt-0.5 text-[17px]', iconColor)}>
        {icon}
      </span>

      <p className="flex-1 text-[12px] leading-[1.7] text-[var(--foreground)]">
        {toast.message}
      </p>

      <button
        onClick={() => onRemove(toast.id)}
        className="mt-0.5 text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
        aria-label="关闭提示"
      >
        <span className="material-symbols-outlined text-[15px]">close</span>
      </button>
    </div>
  );
}

export const toast = {
  success: (_message: string, _duration?: number) => {
    console.warn('toast.success 需要在 ToastProvider 内通过 useToast hook 使用');
  },
  error: (_message: string, _duration?: number) => {
    console.warn('toast.error 需要在 ToastProvider 内通过 useToast hook 使用');
  },
  warning: (_message: string, _duration?: number) => {
    console.warn('toast.warning 需要在 ToastProvider 内通过 useToast hook 使用');
  },
  info: (_message: string, _duration?: number) => {
    console.warn('toast.info 需要在 ToastProvider 内通过 useToast hook 使用');
  },
};
