import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionTime = searchParams.get('sessionTime') || '15:20';
    const weekNumber = parseInt(searchParams.get('weekNumber') || '1', 10);
    const trigger = searchParams.get('trigger') || '手动触发';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const markAbsentResponse = await fetch(`${baseUrl}/api/attendance/mark-absent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionTime,
        weekNumber,
      }),
    });
    const markAbsentData = await markAbsentResponse.json();
    console.log(`[AUTO-MARK-ABSENT] 触发条件: ${trigger}, 时段: ${sessionTime}, 周数: ${weekNumber}`);
    console.log('[AUTO-MARK-ABSENT] 标记完成:', markAbsentData);
    return NextResponse.json({
      success: true,
      trigger,
      result: markAbsentData,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[AUTO-MARK-ABSENT] 错误:', err);
    return NextResponse.json(
      { error: err.message || '自动标记缺席失败' },
      { status: 500 }
    );
  }
}