import { NextRequest, NextResponse } from 'next/server';
import {
  getNoticeById,
  updateNotice,
  deleteNotice,
  UpdateNoticeInput,
} from '@/services/notice.service';
import { requireAdminSession, getAdminSession } from '@/lib/admin-session';
import { getSessionStudent } from '@/lib/student-identity';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notice = await getNoticeById(id);

    const isAdmin = requireAdminSession(request) === null;
    if (!isAdmin) {
      if (notice.status !== 'published') {
        return NextResponse.json(
          { error: '公告不存在' },
          { status: 404 }
        );
      }

      if (notice.visibility === 'internal') {
        const student = await getSessionStudent(request);
        if (!student) {
          return NextResponse.json(
            { error: '此公告仅限登录成员查看' },
            { status: 401 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      notice,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取公告失败:', err);
    return NextResponse.json(
      { error: err.message || '获取公告失败' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const session = getAdminSession(request);

  try {
    const { id } = await params;
    const body = await request.json();
    const input: UpdateNoticeInput = {
      title: body.title,
      content: body.content,
      category: body.category,
      status: body.status,
      visibility: body.visibility,
      images: body.images,
      tags: body.tags,
      lastEditorId: session?.sub,
      lastEditorName: session?.username,
    };
    const notice = await updateNotice(id, input);
    return NextResponse.json({
      success: true,
      message: '公告更新成功',
      notice,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新公告失败:', err);
    return NextResponse.json(
      { error: err.message || '更新公告失败' },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { pinned } = await request.json();
    await updateNotice(id, { pinned: !!pinned });
    return NextResponse.json({ success: true, pinned: !!pinned });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('置顶公告失败:', err);
    return NextResponse.json({ error: err.message || '操作失败' }, { status: 500 });
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await deleteNotice(id);
    return NextResponse.json({
      success: true,
      message: '公告删除成功',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除公告失败:', err);
    return NextResponse.json(
      { error: err.message || '删除公告失败' },
      { status: 500 }
    );
  }
}