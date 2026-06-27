import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parse,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd', { locale: zhCN });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatDateTimeWithSeconds = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { locale: zhCN, addSuffix: true });
};

export const formatSmartTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `今天 ${format(dateObj, 'HH:mm')}`;
  }

  if (isYesterday(dateObj)) {
    return `昨天 ${format(dateObj, 'HH:mm')}`;
  }

  return format(dateObj, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm', { locale: zhCN });
};

export const formatMonthDay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MM-dd', { locale: zhCN });
};

export const parseDate = (
  dateString: string,
  formatString: string = 'yyyy-MM-dd'
): Date => {
  return parse(dateString, formatString, new Date());
};

export const isExpired = (deadline: Date | string): boolean => {
  const deadlineDate =
    typeof deadline === 'string' ? new Date(deadline) : deadline;
  return new Date() > deadlineDate;
};

export const getTimeRemaining = (deadline: Date | string): number => {
  const deadlineDate =
    typeof deadline === 'string' ? new Date(deadline) : deadline;
  return Math.max(0, deadlineDate.getTime() - new Date().getTime());
};

export const formatTimeRemaining = (deadline: Date | string): string => {
  const remaining = getTimeRemaining(deadline);

  if (remaining === 0) {
    return '已过期';
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `剩余 ${days} 天 ${hours} 小时`;
  }

  if (hours > 0) {
    return `剩余 ${hours} 小时 ${minutes} 分钟`;
  }

  return `剩余 ${minutes} 分钟`;
};

export const getTodayStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getTomorrowStart = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

export const getNextWeekStart = (): Date => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek;
};

export const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};
