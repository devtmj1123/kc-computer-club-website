import { NextResponse } from 'next/server';
const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    if (!token) {
      return NextResponse.json(
        { error: '缺少重置令牌' },
        { status: 400 }
      );
    }
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const tokenData = JSON.parse(decoded);
      const { userId, email, timestamp } = tokenData;
      if (!userId || !email || !timestamp) {
        throw new Error('Invalid token format');
      }
      const currentTime = Date.now();
      const tokenAge = currentTime - timestamp;
      if (tokenAge > RESET_TOKEN_EXPIRY) {
        return NextResponse.json(
          { error: '重置链接已过期。请重新申请。' },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        userId,
        email,
        remainingTime: RESET_TOKEN_EXPIRY - tokenAge,
      });
    } catch (err) {
      console.error('令牌解析失败:', err);
      return NextResponse.json(
        { error: '无效的重置链接' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('验证令牌 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}