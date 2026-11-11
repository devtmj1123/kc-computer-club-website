import { NextRequest, NextResponse } from 'next/server';
import {
  getAttendanceConfig,
  markSessionAbsent,
  resolveSessionNumber,
} from '@/services/attendance.service';
import { getAdminSession, requireAdminSession } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const adminSession = getAdminSession(request);

  try {
    const body = await request.json();
    const { sessionTime, weekNumber, markAs = 'absent' } = body;
    if (!sessionTime || !weekNumber) {
      return NextResponse.json(
        { error: '缺少必要参数：sessionTime, weekNumber' },
        { status: 400 }
      );
    }
    if (!/^\d{1,2}:\d{2}$/.test(String(sessionTime))) {
      return NextResponse.json(
        { error: 'sessionTime 格式必须是 HH:MM（如 15:20 或 21:00）' },
        { status: 400 }
      );
    }

    const parsedWeek = Number(weekNumber);
    if (!Number.isFinite(parsedWeek) || parsedWeek < 1) {
      return NextResponse.json(
        { error: 'weekNumber 必须是正整数' },
        { status: 400 }
      );
    }

    const status = markAs === 'late' ? 'late' : 'absent';
    const statusLabel = status === 'late' ? '迟到' : '缺席';
    const config = await getAttendanceConfig();
    const sessionNumber = resolveSessionNumber(config, String(sessionTime));

    const result = await markSessionAbsent({
      config,
      weekNumber: parsedWeek,
      sessionNumber,
      markAs: status,
      createdBy: adminSession?.sub,
    });

    return NextResponse.json({
      success: true,
      message: `自动标记完成：${result.pendingUpdatedCount} 名学生从待点名更新为${statusLabel}，${result.createdRecordsCount} 名学生新创建${statusLabel}记录`,
      summary: {
        sessionTime,
        sessionNumber,
        weekNumber: parsedWeek,
        totalStudents: result.totalStudents,
        existingRecordsCount: result.existingRecordsCount,
        pendingUpdatedCount: result.pendingUpdatedCount,
        createdRecordsCount: result.createdRecordsCount,
        markedAs: result.markedAs,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[MARK-ABSENT] 错误:', err);
    return NextResponse.json(
      { error: err.message || '标记失败' },
      { status: 500 }
    );
  }
}
