import { NextRequest, NextResponse } from 'next/server';
import { setAdminSessionCookie } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '已成功退出登录',
    });

    response.cookies.set('kc_admin_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Admin logout error:', err);
    return NextResponse.json(
      { error: err.message || '退出登录失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}