import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || 'attendance';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || 'users';
function extractStudentIdFromEmail(email: string): string {
  const match = email?.match(/^(\d+)@/);
  return match ? match[1] : email?.split('@')[0] || '';
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionTime, weekNumber, markAs = 'absent' } = body;
    if (!sessionTime || !weekNumber) {
      return NextResponse.json(
        { error: '缺少必要参数：sessionTime, weekNumber' },
        { status: 400 }
      );
    }
    if (!/^\d{1,2}:\d{2}$/.test(sessionTime)) {
      return NextResponse.json(
        { error: 'sessionTime 格式必须是 HH:MM（如 15:20 或 21:00）' },
        { status: 400 }
      );
    }
    const sessionNumber = sessionTime.startsWith('15') || sessionTime.startsWith('14') || parseInt(sessionTime.split(':')[0]) < 16 ? 1 : 2;
    const status = markAs === 'absent' ? 'absent' : 'late';
    const statusLabel = status === 'late' ? '迟到' : '缺席';
    const allUsers = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('role', 'student'), Query.limit(500)]
    );
    const studentList = allUsers.documents.map((doc) => {
      const email = String(doc.email || '');
      const studentId = doc.studentId 
        ? String(doc.studentId) 
        : extractStudentIdFromEmail(email);
      return {
        $id: doc.$id,
        studentId,
        studentName: String(doc.chineseName || doc.name || email),
        studentEmail: email,
      };
    });
    console.log(`[MARK-ABSENT] 获取学生列表: ${studentList.length} 名学生`);
    const existingRecords = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [
        Query.equal('weekNumber', weekNumber),
        Query.limit(500),
      ]
    );
    const sessionRecords = existingRecords.documents.filter((doc) => {
      const st = String(doc.sessionTime || '');
      const uk = String(doc.uniqueKey || doc.$id || '');
      return st === sessionTime || 
             uk.includes(`_${sessionNumber}_`) || 
             st === `session${sessionNumber}`;
    });
    console.log(`[MARK-ABSENT] 周${weekNumber}时段${sessionNumber}已有记录: ${sessionRecords.length} 条`);
    const pendingRecords = sessionRecords.filter((doc) => doc.status === 'pending');
    const updatedRecords = [];
    const now = new Date().toISOString();
    console.log(`[MARK-ABSENT] 待处理的 pending 记录: ${pendingRecords.length} 条`);
    for (const record of pendingRecords) {
      try {
        await serverDatabases.updateDocument(
          APPWRITE_DATABASE_ID,
          ATTENDANCE_COLLECTION_ID,
          record.$id,
          {
            status: status,
            checkInTime: now, 
            notes: `系统自动标记（点名时间结束 - ${statusLabel}）`,
          }
        );
        updatedRecords.push(record);
      } catch (err) {
        console.warn(`[MARK-ABSENT] 更新记录失败 ${record.$id}:`, err);
      }
    }
    console.log(`[MARK-ABSENT] 已更新 ${updatedRecords.length} 条 pending 记录为 ${status}`);
    const existingStudentIds = new Set(sessionRecords.map((doc) => String(doc.studentId)));
    const missingStudents = studentList.filter((student) => !existingStudentIds.has(student.studentId));
    console.log(`[MARK-ABSENT] 无任何记录的学生: ${missingStudents.length} 名`);
    const createdRecords = [];
    for (const student of missingStudents) {
      const uniqueKey = `${student.studentId}_${sessionNumber}_${weekNumber}`;
      try {
        const record = await serverDatabases.createDocument(
          APPWRITE_DATABASE_ID,
          ATTENDANCE_COLLECTION_ID,
          uniqueKey,  
          {
            studentId: student.studentId,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
            checkInTime: now,
            sessionTime,
            weekNumber,
            status: status,
            notes: `系统自动标记（超时未点名 - ${statusLabel}）`,
            createdAt: now,
            uniqueKey,
          }
        );
        createdRecords.push(record);
      } catch (err) {
        const error = err as Error & { code?: number };
        if (error.code === 409) {
          console.log(`[MARK-ABSENT] 学生 ${student.studentName} 已有记录，跳过`);
        } else {
          console.warn(`[MARK-ABSENT] 创建${statusLabel}记录失败 ${student.studentName}:`, err);
        }
      }
    }
    console.log(`[MARK-ABSENT] 创建 ${createdRecords.length} 条新的缺席记录`);
    return NextResponse.json({
      success: true,
      message: `自动标记完成：${updatedRecords.length} 名学生从待点名更新为${statusLabel}，${createdRecords.length} 名学生新创建${statusLabel}记录`,
      summary: {
        sessionTime,
        sessionNumber,
        weekNumber,
        totalStudents: studentList.length,
        existingRecordsCount: sessionRecords.length,
        pendingUpdatedCount: updatedRecords.length,
        createdRecordsCount: createdRecords.length,
        markedAs: status,
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