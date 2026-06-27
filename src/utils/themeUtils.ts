export const THEME_COLORS = {
  primary: '#13ec80',
  primaryHover: '#0fd673',
  primaryLight: 'rgba(19, 236, 128, 0.1)',
  primaryGlow: 'rgba(19, 236, 128, 0.3)',

  admin: '#137fec',
  adminHover: '#0f5fcc',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  light: {
    background: '#f8faf9',
    surface: '#ffffff',
    text: '#111814',
    textSecondary: '#618975',
    border: '#e2e8e5',
  },

  dark: {
    background: '#0d1812',
    surface: '#162a21',
    text: '#ffffff',
    textSecondary: '#9db9ab',
    border: '#283930',
  },
};

export function getBgClass(isDark: boolean): string {
  return isDark ? 'bg-[#0d1812]' : 'bg-[#f8faf9]';
}

export function getTextClass(isDark: boolean, type: 'primary' | 'secondary' = 'primary'): string {
  if (type === 'secondary') {
    return isDark ? 'text-[#9db9ab]' : 'text-[#618975]';
  }
  return isDark ? 'text-white' : 'text-black';
}

export function getCardClass(isDark: boolean, hover = true): string {
  const baseClasses = isDark
    ? 'bg-[#162a21] border-[#283930]'
    : 'bg-white border-[#e2e8e5]';
  const hoverClass = hover ? (isDark ? 'hover:bg-[#1c3328]' : 'hover:bg-[#f1f5f3]') : '';
  return `${baseClasses} ${hoverClass} border rounded-lg transition-colors`;
}

export function getButtonClass(
  variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary',
  isDark: boolean = false,
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };

  const variantClasses = {
    primary: 'bg-[#13ec80] text-black hover:bg-[#0fd673] font-semibold',
    secondary: isDark
      ? 'bg-[#283930] text-white hover:bg-[#3a4a42] border border-[#3a4a42]'
      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200',
    danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
    success: 'bg-[#10b981] text-white hover:bg-[#059669]',
  };

  return `${sizeClasses[size]} ${variantClasses[variant]} rounded-lg transition-colors cursor-pointer`;
}

export function getInputClass(isDark: boolean): string {
  return isDark
    ? 'bg-[#102219] border-[#283930] text-white placeholder-[#7a9084] focus:border-[#13ec80] focus:ring-2 focus:ring-opacity-20 focus:ring-[#13ec80]'
    : 'bg-white border-[#d1d9d5] text-black placeholder-[#94a8a1] focus:border-[#13ec80] focus:ring-2 focus:ring-opacity-20 focus:ring-[#13ec80]';
}

export function getBadgeClass(
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  isDark: boolean = false
): string {
  const typeClasses = {
    success: isDark
      ? 'bg-[#10b981]/20 text-[#10b981]'
      : 'bg-[#10b981]/10 text-[#059669]',
    warning: isDark
      ? 'bg-[#f59e0b]/20 text-[#fbbf24]'
      : 'bg-[#f59e0b]/10 text-[#d97706]',
    error: isDark
      ? 'bg-[#ef4444]/20 text-[#fca5a5]'
      : 'bg-[#ef4444]/10 text-[#dc2626]',
    info: isDark
      ? 'bg-[#3b82f6]/20 text-[#93c5fd]'
      : 'bg-[#3b82f6]/10 text-[#1d4ed8]',
  };

  return `${typeClasses[type]} px-2.5 py-1 rounded-full text-sm font-medium`;
}

export function getThemeStyles(isDark: boolean) {
  return {
    container: {
      backgroundColor: isDark ? '#0d1812' : '#f8faf9',
      color: isDark ? '#ffffff' : '#111814',
      minHeight: '100vh',
    },
    card: {
      backgroundColor: isDark ? '#162a21' : '#ffffff',
      borderColor: isDark ? '#283930' : '#e2e8e5',
    },
    text: {
      primary: isDark ? '#ffffff' : '#111814',
      secondary: isDark ? '#9db9ab' : '#618975',
    },
    border: {
      color: isDark ? '#283930' : '#e2e8e5',
    },
  };
}

export const THEME_CLASSES = {
  container: {
    light: 'bg-[#f8faf9] text-black min-h-screen',
    dark: 'bg-[#0d1812] text-white min-h-screen',
  },
  card: {
    light: 'bg-white border border-[#e2e8e5] rounded-lg p-4 hover:border-[#13ec80] transition-colors',
    dark: 'bg-[#162a21] border border-[#283930] rounded-lg p-4 hover:border-[#13ec80] transition-colors',
  },
  button: {
    primary: 'bg-[#13ec80] text-black hover:bg-[#0fd673] px-4 py-2 rounded-lg font-semibold transition-colors',
    secondary:
      'bg-gray-100 dark:bg-[#283930] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3a4a42] px-4 py-2 rounded-lg transition-colors',
  },
  text: {
    primary: 'text-[#111814] dark:text-white',
    secondary: 'text-[#618975] dark:text-[#9db9ab]',
  },
};
