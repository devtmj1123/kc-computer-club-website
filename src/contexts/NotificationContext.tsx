'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/app/api/notifications/route';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: 'approval' | 'notice' | 'activity' | 'announcement', relatedId?: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`);
      if (!response.ok) {
        console.log('通知 API 不可用');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const addNotification = useCallback(async (title: string, message: string, type: 'approval' | 'notice' | 'activity' | 'announcement', relatedId?: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title,
          message,
          type,
          relatedId,
        }),
      });
      if (!response.ok) {
        console.log('通知 API 不可用');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setNotifications([data.notification, ...notifications]);
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('添加通知失败:', error);
    }
  }, [user?.id, notifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          notificationId,
        }),
      });
      if (!response.ok) {
        console.log('通知 API 不可用');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setNotifications(notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('标记通知失败:', error);
    }
  }, [user?.id, notifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          markAllAsRead: true,
        }),
      });
      if (!response.ok) {
        console.log('通知 API 不可用');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('标记全部通知失败:', error);
    }
  }, [user?.id, notifications]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
