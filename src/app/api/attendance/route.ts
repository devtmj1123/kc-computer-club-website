import { NextRequest, NextResponse } from 'next/server';
import {
  AttendanceConfig,
  AttendanceError,
  checkInStudent,
  clearAttendanceCodes,
  ensureAttendanceSession,
  formatTimeParts,
  generateAttendanceCode,
  getAttendanceConfigState,
  getCurrentAttendanceWindow,
  getCurrentWeekNumber,
  getSessionStart,
  getSessionTimeString,
  getSessionsForWeek,
  saveAttendanceConfig,
  setAttendanceCodeEnabled,
  setSessionStatus,
} from '@/services/attendance.service';
import { requireAdminSession, getAdminSession } from '@/lib/admin-session';
import { getSessionStudent } from '@/lib/student-identity';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const ADMIN_ACTIONS = new Set(['update-config', 'generate-code', 'clear-code']);

function sessionRangeLabel(config: AttendanceConfig, sessionNumber: 1 | 2): string {
  const start = getSessionStart(config, sessionNumber);
  const duration =
    sessionNumber === 1 ? config.session1Duration : config.session2Duration;
  const endTotal = start.hour * 60 + start.minute + duration;
  return `${getSessionTimeString(config, sessionNumber)}-${formatTimeParts({
    hour: Math.floor(endTotal / 60),
    minute: endTotal % 60,
  })}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const { config, codeEnabled } = await getAttendanceConfigState();
    const weekNumber = getCurrentWeekNumber(config);
    const sessions = await getSessionsForWeek(weekNumber);
    const session1 = sessions.find((session) => session.session_number === 1);
    const session2 = sessions.find((session) => session.session_number === 2);
    const attendanceCode1 = session1?.checkin_code || null;
    const attendanceCode2 = session2?.checkin_code || null;
    const hasCode =
      (session1?.code_enabled === true && Boolean(attendanceCode1)) ||
      (session2?.code_enabled === true && Boolean(attendanceCode2));

    if (action === 'debug-status') {
      const authError = requireAdminSession(request);
      if (authError) return authError;

      return NextResponse.json({
        debugMode: false,
        config: { ...config, weekNumber },
        weekNumber,
        attendanceCode1,
        attendanceCode2,
        attendanceCodesWeek: weekNumber,
        codeEnabled,
      });
    }

    const now = new Date();
    const isAttendanceDay = now.getDay() === config.dayOfWeek;
    const currentWindow = getCurrentAttendanceWindow(config);

    return NextResponse.json({
      isAttendanceOpen: isAttendanceDay,
      session: currentWindow
        ? {
            sessionTime: currentWindow.startTime,
            sessionNumber: currentWindow.sessionNumber,
            minutesRemaining: currentWindow.minutesRemaining,
            isActive: true,
          }
        : null,
      message: isAttendanceDay
        ? currentWindow
          ? `现在正是时段${currentWindow.sessionNumber}（${currentWindow.startTime}-${currentWindow.endTime}），请输入验证码签到`
          : `今天是点名日（每${DAY_NAMES[config.dayOfWeek]}），点名时段为 ${sessionRangeLabel(
              config,
              1
            )} 和 ${sessionRangeLabel(config, 2)}`
        : `今天不是点名日。点名日为每${DAY_NAMES[config.dayOfWeek]}`,
      weekNumber,
      debugMode: false,
      config,
      codeEnabled,
      hasCode,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取点名状态失败:', err);
    return NextResponse.json(
      { error: err.message || '获取点名状态失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (ADMIN_ACTIONS.has(body.action)) {
      const authError = requireAdminSession(request);
      if (authError) return authError;
      const session = getAdminSession(request);
      const { config } = await getAttendanceConfigState();
      const weekNumber = getCurrentWeekNumber(config);

      if (body.action === 'update-config') {
        const updated = await saveAttendanceConfig(body.config || {}, session?.sub);

        // Keep the current week's unclosed sessions aligned with the new
        // schedule. Codes and statuses are preserved.
        const existing = await getSessionsForWeek(weekNumber);
        for (const row of existing) {
          if (row.status === 'closed') continue;
          await ensureAttendanceSession({
            config: updated,
            weekNumber,
            sessionNumber: row.session_number,
          });
        }

        return NextResponse.json({
          success: true,
          config: updated,
          message: '点名配置已更新',
        });
      }

      if (body.action === 'generate-code') {
        const newCode1 = generateAttendanceCode();
        const newCode2 = generateAttendanceCode();
        const now = Date.now();
        const session1 = await ensureAttendanceSession({
          config,
          weekNumber,
          sessionNumber: 1,
          checkinCode: newCode1,
          codeEnabled: true,
          createdBy: session?.sub,
        });
        const session2 = await ensureAttendanceSession({
          config,
          weekNumber,
          sessionNumber: 2,
          checkinCode: newCode2,
          codeEnabled: true,
          createdBy: session?.sub,
        });
        await setAttendanceCodeEnabled(true, session?.sub);

        const isWithin = (row: { starts_at: string; ends_at: string }) =>
          now >= new Date(row.starts_at).getTime() &&
          now <= new Date(row.ends_at).getTime();
        await setSessionStatus(session1.id, isWithin(session1) ? 'open' : 'scheduled');
        await setSessionStatus(session2.id, isWithin(session2) ? 'open' : 'scheduled');

        return NextResponse.json({
          success: true,
          attendanceCode1: newCode1,
          attendanceCode2: newCode2,
          codeEnabled: true,
          message: `验证码已生成 — 时段1: ${newCode1}，时段2: ${newCode2}`,
        });
      }

      // clear-code
      const clearedCount = await clearAttendanceCodes(weekNumber, session?.sub);

      return NextResponse.json({
        success: true,
        codeEnabled: false,
        attendanceCode1: null,
        attendanceCode2: null,
        message: `验证码已清除（共 ${clearedCount} 个时段）`,
      });
    }

    // Student check-in. The route stays accessible without an admin session,
    // but the caller must be a logged-in student: the signed HMAC cookie is
    // the identity source, so a request cannot check in someone else.
    const student = await getSessionStudent(request);
    if (!student) {
      return NextResponse.json(
        { error: '请先登录学生账号', requireLogin: true },
        { status: 401 }
      );
    }

    const state = await getAttendanceConfigState();
    const result = await checkInStudent({
      profile: {
        id: student.id,
        email: student.email,
        student_no: student.studentId || null,
        chinese_name: student.name || null,
        english_name: null,
      },
      verificationCode:
        typeof body.verificationCode === 'string'
          ? body.verificationCode.trim()
          : '',
      config: state.config,
      codeEnabled: state.codeEnabled,
    });

    return NextResponse.json({
      success: true,
      message: '点名成功！',
      alreadyCheckedIn: result.alreadyCheckedIn,
      record: {
        id: result.record.$id,
        studentName: result.record.studentName,
        sessionTime: result.record.sessionTime,
        sessionNumber: result.record.sessionNumber,
        checkInTime: result.record.checkInTime,
        status: result.record.status,
        weekNumber: result.record.weekNumber,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AttendanceError) {
      return NextResponse.json(
        { error: error.message, requireCode: error.requireCode },
        { status: error.status }
      );
    }
    const err = error as Error & { message?: string };
    console.error('点名失败:', err);
    return NextResponse.json(
      { error: err.message || '点名失败，请稍后重试' },
      { status: 500 }
    );
  }
}
