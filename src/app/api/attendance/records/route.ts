import { NextRequest, NextResponse } from 'next/server';
import {
  getAttendanceConfig,
  getAttendanceSummary,
  getCurrentWeekNumber,
  getSessionRecords,
  resolveSessionNumber,
} from '@/services/attendance.service';
import { requireAdminSession } from '@/lib/admin-session';

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionTime = searchParams.get('sessionTime');
    const config = await getAttendanceConfig();
    const requestedWeek = searchParams.get('weekNumber');
    const weekNumber = requestedWeek
      ? Number.parseInt(requestedWeek, 10)
      : getCurrentWeekNumber(config);
    if (!Number.isFinite(weekNumber) || weekNumber < 1) {
      return NextResponse.json(
        { error: 'weekNumber 必须是正整数' },
        { status: 400 }
      );
    }

    const includeAll = searchParams.get('includeAll') !== 'false';

    if (sessionTime) {
      const sessionNumber = resolveSessionNumber(config, sessionTime);
      const result = await getSessionRecords(
        weekNumber,
        sessionNumber,
        config,
        includeAll
      );
      const records = result.records;

      return NextResponse.json({
        success: true,
        weekNumber,
        sessionTime,
        sessionNumber,
        totalRecords: records.length,
        presentCount: records.filter((record) => record.status === 'present')
          .length,
        lateCount: records.filter((record) => record.status === 'late').length,
        absentCount: records.filter((record) => record.status === 'absent')
          .length,
        pendingCount: records.filter((record) => record.status === 'pending')
          .length,
        totalStudents: result.totalStudents,
        records,
      });
    }

    const summary = await getAttendanceSummary(weekNumber, config, includeAll);
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取点名记录错误:', err);
    return NextResponse.json(
      { error: err.message || '获取点名记录失败' },
      { status: 500 }
    );
  }
}
