import { NextRequest, NextResponse } from 'next/server';
import {
  getAttendanceConfig,
  getSessionByWeekAndNumber,
  getSessionStats,
  initializeAttendanceSession,
  resolveSessionNumber,
} from '@/services/attendance.service';
import { getAdminSession, requireAdminSession } from '@/lib/admin-session';

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const sessionTime = searchParams.get('sessionTime');
    const weekNumberRaw = searchParams.get('weekNumber');
    if (!sessionTime || !weekNumberRaw) {
      return NextResponse.json(
        { error: '缺少必要参数：sessionTime, weekNumber' },
        { status: 400 }
      );
    }

    const weekNumber = Number.parseInt(weekNumberRaw, 10);
    if (!Number.isFinite(weekNumber) || weekNumber < 1) {
      return NextResponse.json(
        { error: 'weekNumber 必须是正整数' },
        { status: 400 }
      );
    }

    const config = await getAttendanceConfig();
    const sessionNumber = resolveSessionNumber(config, sessionTime);
    const session = await getSessionByWeekAndNumber(weekNumber, sessionNumber);
    const stats = session
      ? await getSessionStats(session.id)
      : { total: 0, pending: 0, present: 0, late: 0, absent: 0 };

    return NextResponse.json({
      success: true,
      sessionTime,
      sessionNumber,
      weekNumber,
      stats,
      isInitialized: stats.total > 0,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[INIT-SESSION] GET 错误:', err);
    return NextResponse.json(
      { error: err.message || '获取状态失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const adminSession = getAdminSession(request);

  try {
    const body = await request.json();
    const { sessionTime, weekNumber, sessionDuration } = body;
    if (!sessionTime || weekNumber === undefined) {
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

    const config = await getAttendanceConfig();
    const sessionNumber = resolveSessionNumber(config, String(sessionTime));
    const durationOverride =
      typeof sessionDuration === 'number' && sessionDuration > 0
        ? sessionDuration
        : undefined;

    const result = await initializeAttendanceSession({
      config,
      weekNumber: parsedWeek,
      sessionNumber,
      durationOverride,
      createdBy: adminSession?.sub,
    });

    return NextResponse.json({
      success: true,
      message:
        result.newRecordsCount > 0
          ? `点名时段初始化完成：已为 ${result.newRecordsCount} 名学生创建待点名记录`
          : '所有学生已有记录，无需重复初始化',
      summary: {
        sessionTime,
        sessionNumber,
        weekNumber: parsedWeek,
        sessionDuration:
          durationOverride ?? (sessionNumber === 1 ? config.session1Duration : config.session2Duration),
        totalStudents: result.totalStudents,
        existingRecordsCount: result.existingCount,
        newRecordsCount: result.newRecordsCount,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[INIT-SESSION] 错误:', err);
    return NextResponse.json(
      { error: err.message || '初始化失败' },
      { status: 500 }
    );
  }
}
