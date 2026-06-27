import { NextRequest, NextResponse } from 'next/server';
import {
  getAllNotices,
  createNotice,
  CreateNoticeInput,
} from '@/services/notice.service';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyPublished = searchParams.get('onlyPublished') === 'true';
    const visibility = (searchParams.get('visibility') as 'public' | 'all') || 'all';
    const notices = await getAllNotices(onlyPublished, visibility);
    return NextResponse.json({
      success: true,
      total: notices.length,
      notices,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取公告列表失败:', err);
    return NextResponse.json(
      { error: err.message || '获取公告列表失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, authorId, author, status, images, tags, visibility } = body;
    if (!title || !content || !category || !authorId || !author) {
      return NextResponse.json(
        { error: '缺少必填字段：title, content, category, authorId, author' },
        { status: 400 }
      );
    }
    const input: CreateNoticeInput = {
      title,
      content,
      category,
      authorId,
      author,
      status: status || 'draft',
      images,
      tags,
      visibility: visibility || 'public',
    };
    const notice = await createNotice(input);
    if (status === 'published') {
      try {
        const userIds = ['user1', 'user2', 'user3']; 
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        for (const userId of userIds) {
          await fetch(`${appUrl}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              title: `新公告：${title}`,
              message: content.substring(0, 100) + '...',
              type: 'notice',
              relatedId: notice.$id,
            }),
          }).catch((err) => console.error('发送通知失败:', err));
        }
      } catch (err) {
        console.error('发送通知时出错:', err);
      }
    }
    return NextResponse.json({
      success: true,
      message: '公告创建成功',
      notice,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建公告失败:', err);
    return NextResponse.json(
      { error: err.message || '创建公告失败' },
      { status: 500 }
    );
  }
}