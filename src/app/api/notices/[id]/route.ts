import { NextRequest, NextResponse } from 'next/server';
import {
  getNoticeById,
  updateNotice,
  deleteNotice,
  UpdateNoticeInput,
} from '@/services/notice.service';
import { serverDatabases } from '@/services/appwrite-server';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notice = await getNoticeById(id);
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
  try {
    const { id } = await params;
    const body = await request.json();
    const input: UpdateNoticeInput = {
      title: body.title,
      content: body.content,
      category: body.category,
      status: body.status,
      images: body.images,
      tags: body.tags,
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
  try {
    const { id } = await params;
    const { pinned } = await request.json();
    const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const coll = process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION || '';
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
    const apiKey = process.env.APPWRITE_API_KEY || '';
    const doUpdate = () =>
      serverDatabases.updateDocument(db, coll, id, { pinned: !!pinned });
    try {
      await doUpdate();
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code === 400) {
        try {
          await fetch(
            `${endpoint}/databases/${db}/collections/${coll}/attributes/boolean`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': projectId,
                'X-Appwrite-Key': apiKey,
              },
              body: JSON.stringify({ key: 'pinned', required: false, default: false }),
              signal: AbortSignal.timeout(8000),
            }
          );
        } catch {  }
        await new Promise(r => setTimeout(r, 5000));
        await doUpdate();
      } else {
        throw e;
      }
    }
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