import { NextRequest, NextResponse } from 'next/server';
import { commentService, CreateCommentInput } from '@/services/comment.service';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyApproved = searchParams.get('onlyApproved') === 'true';
    const contentType = searchParams.get('contentType') as 'notice' | 'activity' | null;
    const contentId = searchParams.get('contentId');
    let comments;
    if (contentType && contentId) {
      comments = await commentService.getCommentsByTarget(contentType, contentId, onlyApproved);
    } else {
      comments = await commentService.getAllComments(onlyApproved);
    }
    return NextResponse.json({
      success: true,
      total: comments.length,
      comments,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取评论列表失败:', err);
    return NextResponse.json(
      { error: err.message || '获取评论列表失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, contentId, nickname, email, content } = body;
    if (!contentType || !contentId || !nickname || !content) {
      return NextResponse.json(
        { error: '缺少必填字段: contentType, contentId, nickname, content' },
        { status: 400 }
      );
    }
    const input: CreateCommentInput = {
      contentType,
      contentId,
      nickname,
      email,
      content,
      status: 'approved', 
    };
    const comment = await commentService.createComment(input);
    return NextResponse.json({
      success: true,
      message: '评论发布成功',
      comment,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建评论失败:', err);
    return NextResponse.json(
      { error: err.message || '创建评论失败' },
      { status: 500 }
    );
  }
}