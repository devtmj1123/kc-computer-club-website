import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;
    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: '评论内容不能为空' },
        { status: 400 }
      );
    }
    const result = await commentService.editComment(id, content.trim());
    return NextResponse.json({
      success: true,
      comment: result,
    });
  } catch (error) {
    console.error('更新评论失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}