import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comment = await commentService.getCommentById(id);
    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取评论失败:', err);
    return NextResponse.json(
      { error: err.message || '获取评论失败' },
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
    const comment = await commentService.updateComment(id, body);
    return NextResponse.json({
      success: true,
      message: '评论更新成功',
      comment,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新评论失败:', err);
    return NextResponse.json(
      { error: err.message || '更新评论失败' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await commentService.deleteComment(id);
    return NextResponse.json({
      success: true,
      message: '评论删除成功',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除评论失败:', err);
    return NextResponse.json(
      { error: err.message || '删除评论失败' },
      { status: 500 }
    );
  }
}