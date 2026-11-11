import { NextRequest, NextResponse } from 'next/server';
import { getStudentAttendanceRecords } from '@/services/attendance.service';
import { verifyStudentRequestIdentity } from '@/lib/student-identity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const studentId = searchParams.get('studentId');

    if (!email || !studentId) {
      return NextResponse.json(
        { error: '缺少学生邮箱或学号' },
        { status: 400 }
      );
    }

    const student = await verifyStudentRequestIdentity(
      request,
      email,
      studentId
    );
    if (!student) {
      return NextResponse.json(
        { error: '学生身份验证失败' },
        { status: 401 }
      );
    }

    const records = await getStudentAttendanceRecords(student.id);
    const recordsByWeek: Record<number, unknown[]> = {};

    for (const record of records) {
      const week = Number(record.weekNumber) || 0;
      if (!recordsByWeek[week]) recordsByWeek[week] = [];
      recordsByWeek[week].push({
        $id: record.$id,
        studentName: record.studentName,
        studentEmail: record.studentEmail,
        studentId: record.studentId,
        checkInTime: record.checkInTime,
        sessionTime: record.sessionTime,
        sessionNumber: record.sessionNumber,
        weekNumber: record.weekNumber,
        status: record.status,
        notes: record.notes,
      });
    }

    return NextResponse.json({
      success: true,
      recordsByWeek,
      totalRecords: records.length,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取学生记录失败:', err);
    return NextResponse.json(
      { error: err.message || '获取记录失败' },
      { status: 500 }
    );
  }
}
