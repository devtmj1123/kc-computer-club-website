import { NextRequest, NextResponse } from 'next/server';
import { commentService, CreateCommentInput } from '@/services/comment.service';
import { verifyPublicFormToken } from '@/lib/recaptcha';
import { requireAdminSession } from '@/lib/admin-session';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyApproved = searchParams.get('onlyApproved') !== 'false';
    const contentType = searchParams.get('contentType') as 'notice' | 'activity' | null;
    const contentId = searchParams.get('contentId');

    const authError = requireAdminSession(request);
    const isAdmin = !authError;

    if (!onlyApproved && !isAdmin) {
      return NextResponse.json(
        { error: '没有权限查看待审核评论' },
        { status: 401 }
      );
    }

    let comments;
    if (contentType && contentId) {
      comments = await commentService.getCommentsByTarget(contentType, contentId, onlyApproved);
    } else {
      comments = await commentService.getAllComments(onlyApproved);
    }

    if (!isAdmin) {
      comments = comments.map((comment) => ({ ...comment, email: '' }));
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
    const contentType = body.contentType;
    const contentId = typeof body.contentId === 'string' ? body.contentId.trim() : '';
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim().slice(0, 50) : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 255) : '';
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 2000) : '';

    if (contentType !== 'notice' && contentType !== 'activity') {
      return NextResponse.json(
        { error: '无效的评论对象类型' },
        { status: 400 }
      );
    }
    if (!contentId || !nickname || !content) {
      return NextResponse.json(
        { error: '缺少必填字段: contentType, contentId, nickname, content' },
        { status: 400 }
      );
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const remoteIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const captchaOk = await verifyPublicFormToken(
      body.recaptchaToken,
      remoteIp
    );
    if (!captchaOk) {
      return NextResponse.json(
        { error: '人机验证失败，请刷新后重试' },
        { status: 400 }
      );
    }

    const input: CreateCommentInput = {
      contentType,
      contentId,
      nickname,
      email,
      content,
      // Anonymous comments are moderated before they become visible.
      status: 'pending',
    };
    const comment = await commentService.createComment(input);
    return NextResponse.json({
      success: true,
      message: '评论已提交，审核通过后会显示',
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