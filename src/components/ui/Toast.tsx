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

const toastStyles: Record<ToastType, { icon: string; bg: string; border: string }> = {
  success: {
    icon: 'check_circle',
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    border: 'border-green-500/30',
  },
  error: {
    icon: 'error',
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    border: 'border-red-500/30',
  },
  warning: {
    icon: 'warning',
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    border: 'border-yellow-500/30',
  },
  info: {
    icon: 'info',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
  },
};

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
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
    <div
      className={cn(
        'fixed bottom-4 right-4 z-100',
        'flex flex-col gap-2',
        'max-w-sm w-full'
      )}
    >
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
  const { icon, bg, border } = toastStyles[toast.type];
  const iconColor = iconColors[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4',
        'rounded-xl border',
        'shadow-lg shadow-black/10',
        'backdrop-blur-xl',
        'animate-in slide-in-from-right-full duration-300',
        'bg-white dark:bg-[#1c3128]',
        bg,
        border
      )}
    >
      <span className={cn('material-symbols-outlined', iconColor)}>
        {icon}
      </span>

      <p className="flex-1 text-sm text-gray-900 dark:text-white">
        {toast.message}
      </p>

      <button
        onClick={() => onRemove(toast.id)}
        className={cn(
          'text-gray-400 hover:text-gray-600',
          'dark:text-gray-500 dark:hover:text-gray-300',
          'transition-colors'
        )}
      >
        <span className="material-symbols-outlined text-base">close</span>
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
