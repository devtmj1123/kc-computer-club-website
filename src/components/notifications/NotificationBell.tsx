'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import type { Notification } from '@/app/api/notifications/route';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <span className="material-symbols-outlined">check_circle</span>;
      case 'notice':
        return <span className="material-symbols-outlined">info</span>;
      case 'activity':
        return <span className="material-symbols-outlined">event</span>;
      case 'announcement':
        return <span className="material-symbols-outlined">campaign</span>;
      default:
        return <span className="material-symbols-outlined">notifications</span>;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval':
        return 'border-l-[#13ec80]';
      case 'notice':
        return 'border-l-[#0ea5e9]';
      case 'activity':
        return 'border-l-[#f97316]';
      case 'announcement':
        return 'border-l-[#ec4899]';
      default:
        return 'border-l-[#6b7280]';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] hover:shadow-[var(--nm-inset)] transition-all flex items-center justify-center"
        title="通知"
      >
        <span className="material-symbols-outlined text-primary">notifications</span>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-[#102219] transform translate-x-1 -translate-y-1 bg-primary rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[var(--nm-bg)] rounded-[28px] shadow-[var(--nm-raised-lg)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
            <h3 className="font-semibold text-[var(--foreground)]">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  setIsOpen(false);
                }}
                className="text-xs text-primary hover:opacity-80 transition-colors"
              >
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'bg-[var(--surface-hover)]' : 'bg-[var(--nm-bg)]'
                    } hover:bg-[var(--surface-hover)] cursor-pointer transition-colors flex items-center gap-3 group`}
                >
                  <div className="shrink-0 text-primary h-6 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-[var(--foreground)] text-sm truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] opacity-70 mt-2">
                      {formatTime(new Date(notification.createdAt))}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-400 transition-all shrink-0"
                    title="删除"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
                <span className="material-symbols-outlined block text-3xl mb-2 opacity-50">
                  notifications_none
                </span>
                暂无通知
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button className="w-full text-center text-xs text-primary hover:opacity-80 transition-colors py-2">
                查看全部通知
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString('zh-CN');
}
