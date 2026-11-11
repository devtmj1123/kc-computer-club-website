import { NextRequest, NextResponse } from 'next/server';
import {
  getAllNotices,
  createNotice,
  CreateNoticeInput,
} from '@/services/notice.service';
import { requireAdminSession, getAdminSession } from '@/lib/admin-session';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAdminRequest = !requireAdminSession(request);
    const onlyPublished = isAdminRequest ? searchParams.get('onlyPublished') === 'true' : true;
    const visibility = isAdminRequest
      ? ((searchParams.get('visibility') as 'public' | 'all') || 'all')
      : 'public';
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
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const session = getAdminSession(request);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, content, category, author, status, images, tags, visibility } = body;
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: '缺少必填字段：title, content, category' },
        { status: 400 }
      );
    }
    const input: CreateNoticeInput = {
      title,
      content,
      category,
      authorId: session.sub,
      author: typeof author === 'string' && author.trim() ? author : session.username,
      status: status || 'draft',
      images,
      tags,
      visibility: visibility || 'public',
    };
    const notice = await createNotice(input);
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