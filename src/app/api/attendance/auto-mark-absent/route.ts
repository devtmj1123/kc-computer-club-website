import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const sessionTime = searchParams.get('sessionTime') || '15:20';
    const weekNumber = parseInt(searchParams.get('weekNumber') || '1', 10);
    const trigger = searchParams.get('trigger') || '手动触发';
    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    ).replace(/\/+$/, '');
    const markAbsentResponse = await fetch(`${baseUrl}/api/attendance/mark-absent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        sessionTime,
        weekNumber,
      }),
    });
    const markAbsentData = await markAbsentResponse.json();
    console.log(`[AUTO-MARK-ABSENT] 触发条件: ${trigger}, 时段: ${sessionTime}, 周数: ${weekNumber}`);
    console.log('[AUTO-MARK-ABSENT] 标记完成:', markAbsentData);
    return NextResponse.json({
      success: markAbsentResponse.ok && markAbsentData.success !== false,
      trigger,
      result: markAbsentData,
    });
  } catch (error) {
    const err = error as Error & { message?: string };
    console.error('[AUTO-MARK-ABSENT] 错误:', err);
    return NextResponse.json(
      { error: err.message || '自动标记缺席失败' },
      { status: 500 }
    );
  }
}
