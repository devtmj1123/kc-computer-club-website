import { NextRequest, NextResponse } from 'next/server';
import {
  AttendanceError,
  createOrUpdateManualRecord,
  getAttendanceConfig,
  resolveSessionNumber,
  resolveStudentProfile,
  updateRecordStatus,
} from '@/services/attendance.service';
import { requireAdminSession } from '@/lib/admin-session';

const ALLOWED_STATUSES = new Set(['present', 'absent', 'late']);

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      studentId,
      studentName,
      studentEmail,
      sessionTime,
      sessionNumber,
      weekNumber,
      status,
      notes,
    } = body;

    if ((!studentId && !studentEmail) || !weekNumber || !status) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: '状态必须是 present（出席）, absent（缺席）或 late（迟到）' },
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
    const resolvedSessionNumber =
      sessionNumber === 1 || sessionNumber === 2
        ? sessionNumber
        : sessionTime
          ? resolveSessionNumber(config, String(sessionTime))
          : 1;

    const profile = await resolveStudentProfile(
      String(studentId || studentEmail || '')
    );

    const record = await createOrUpdateManualRecord({
      config,
      sessionNumber: resolvedSessionNumber,
      weekNumber: parsedWeek,
      profile,
      status,
      notes:
        typeof notes === 'string' && notes.trim()
          ? notes.trim()
          : status === 'late'
            ? 'Admin 标记为迟到'
            : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `点名记录已保存，状态为${
        status === 'present' ? '出席' : status === 'late' ? '迟到' : '缺席'
      }`,
      record: {
        id: record.$id,
        studentName: record.studentName || studentName || '',
        status: record.status,
        notes: record.notes,
        sessionTime: record.sessionTime,
        sessionNumber: record.sessionNumber,
        weekNumber: record.weekNumber,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AttendanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    const err = error as Error & { message?: string };
    console.error('[CREATE-RECORD] 错误:', err);
    return NextResponse.json(
      { error: err.message || '创建记录失败' },
      { status: 500 }
    );
  }
}

function parsePendingRecordId(
  recordId: string
): { profileId: string; sessionNumber: 1 | 2; weekNumber: number } | null {
  const match = /^pending_([0-9a-f-]{36})_([12])_(\d+)$/i.exec(recordId);
  if (!match) return null;
  return {
    profileId: match[1],
    sessionNumber: match[2] === '2' ? 2 : 1,
    weekNumber: Number.parseInt(match[3], 10),
  };
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { recordId, status, notes, studentName, studentEmail } = body;
    if (!recordId || !status) {
      return NextResponse.json(
        { error: '缺少必要参数：recordId, status' },
        { status: 400 }
      );
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: '状态必须是 present（出席）, absent（缺席）或 late（迟到）' },
        { status: 400 }
      );
    }

    const pending = parsePendingRecordId(String(recordId));
    if (pending) {
      const config = await getAttendanceConfig();
      const profile = await resolveStudentProfile(pending.profileId);
      const record = await createOrUpdateManualRecord({
        config,
        sessionNumber: pending.sessionNumber,
        weekNumber: pending.weekNumber,
        profile,
        status,
        notes:
          typeof notes === 'string' && notes.trim()
            ? notes.trim()
            : status === 'late'
              ? 'Admin 标记为迟到'
              : undefined,
      });

      return NextResponse.json({
        success: true,
        message: `点名状态已更新为${
          status === 'present' ? '出席' : status === 'late' ? '迟到' : '缺席'
        }`,
        record: {
          id: record.$id,
          studentName: record.studentName || studentName || '',
          status: record.status,
          notes: record.notes,
          sessionTime: record.sessionTime,
          sessionNumber: record.sessionNumber,
          weekNumber: record.weekNumber,
        },
      });
    }

    const record = await updateRecordStatus({
      recordId: String(recordId),
      status,
      notes:
        typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `点名状态已更新为${
        status === 'present' ? '出席' : status === 'late' ? '迟到' : '缺席'
      }`,
      record: {
        id: record.$id,
        studentName: record.studentName || studentName || '',
        status: record.status,
        notes: record.notes,
        sessionTime: record.sessionTime,
        sessionNumber: record.sessionNumber,
        weekNumber: record.weekNumber,
        studentEmail: record.studentEmail || studentEmail || '',
      },
    });
  } catch (error: unknown) {
    if (error instanceof AttendanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    const err = error as Error & { message?: string };
    console.error('[UPDATE-STATUS] 错误:', err);
    return NextResponse.json(
      { error: err.message || '更新状态失败' },
      { status: 500 }
    );
  }
}
