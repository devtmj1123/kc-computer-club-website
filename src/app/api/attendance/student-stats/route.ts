import { NextRequest, NextResponse } from 'next/server';
import { getStudentAttendanceRecordsByEmail } from '@/services/attendance.service';
import { requireAdminSession } from '@/lib/admin-session';

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { error: '缺少邮箱参数' },
        { status: 400 }
      );
    }

    const records = await getStudentAttendanceRecordsByEmail(email);
    return NextResponse.json({
      success: true,
      records,
      total: records.length,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取学生出席记录失败:', err.message);
    return NextResponse.json(
      { error: err.message || '获取记录失败' },
      { status: 500 }
    );
  }
}
