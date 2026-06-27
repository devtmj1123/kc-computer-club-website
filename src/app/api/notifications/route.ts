import { NextRequest, NextResponse } from 'next/server';
const notificationsStore: Map<string, Notification[]> = new Map();
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval' | 'notice' | 'activity' | 'announcement';
  read: boolean;
  createdAt: string;
  relatedId?: string;
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少 userId 参数' },
        { status: 400 }
      );
    }
    let notifications = notificationsStore.get(userId) || [];
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notificationsStore.get(userId)?.filter((n) => !n.read).length || 0,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { success: false, error: '获取通知失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, type, relatedId } = body;
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    const notification: Notification = {
      id: Date.now().toString(),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId,
    };
    const userNotifications = notificationsStore.get(userId) || [];
    userNotifications.push(notification);
    notificationsStore.set(userId, userNotifications);
    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json(
      { success: false, error: '创建通知失败' },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationId, markAllAsRead } = body;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少 userId 参数' },
        { status: 400 }
      );
    }
    const userNotifications = notificationsStore.get(userId) || [];
    if (markAllAsRead) {
      userNotifications.forEach((n) => {
        n.read = true;
      });
    } else if (notificationId) {
      const notification = userNotifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
    notificationsStore.set(userId, userNotifications);
    return NextResponse.json({
      success: true,
      unreadCount: userNotifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('更新通知失败:', error);
    return NextResponse.json(
      { success: false, error: '更新通知失败' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationId } = body;
    if (!userId || !notificationId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    const userNotifications = notificationsStore.get(userId) || [];
    const filtered = userNotifications.filter((n) => n.id !== notificationId);
    notificationsStore.set(userId, filtered);
    return NextResponse.json({
      success: true,
      message: '通知已删除',
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { success: false, error: '删除通知失败' },
      { status: 500 }
    );
  }
}