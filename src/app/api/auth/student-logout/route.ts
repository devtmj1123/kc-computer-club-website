import { NextRequest, NextResponse } from 'next/server';
import { clearStudentSessionCookie } from '@/lib/student-session';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '已成功退出登录',
    });

    return clearStudentSessionCookie(response);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Student logout error:', err);
    return NextResponse.json(
      { error: err.message || '退出登录失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
