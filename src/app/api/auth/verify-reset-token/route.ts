import { NextResponse } from 'next/server';
import { verifyResetToken } from '@/lib/reset-token';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`verify-reset-token:${ip}`, 30, 15 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: '缺少重置令牌' },
        { status: 400 }
      );
    }

    const result = verifyResetToken(token);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: result.data.type,
      email: result.data.email,
      remainingTime:
        24 * 60 * 60 * 1000 - (Date.now() - result.data.timestamp),
    });
  } catch (error) {
    console.error('验证令牌 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
