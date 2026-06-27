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
    const { sessionTime, weekNumber, sessionDuration = 5 } = body;
    if (!sessionTime || weekNumber === undefined) {
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
    const sessionNumber = parseInt(sessionTime.split(':')[0]) < 16 ? 1 : 2;
    console.log(`[INIT-SESSION] 初始化点名时段: 周${weekNumber} 时段${sessionNumber} (${sessionTime})`);
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
    console.log(`[INIT-SESSION] 获取学生列表: ${studentList.length} 名学生`);
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
    const existingStudentIds = new Set(sessionRecords.map((doc) => String(doc.studentId)));
    console.log(`[INIT-SESSION] 周${weekNumber}时段${sessionNumber}已有记录: ${existingStudentIds.size} 条`);
    const studentsToAdd = studentList.filter((student) => !existingStudentIds.has(student.studentId));
    console.log(`[INIT-SESSION] 需要初始化的学生: ${studentsToAdd.length} 名`);
    if (studentsToAdd.length === 0) {
      return NextResponse.json({
        success: true,
        message: '所有学生已有记录，无需重复初始化',
        summary: {
          sessionTime,
          weekNumber,
          sessionDuration,
          totalStudents: studentList.length,
          existingRecordsCount: existingStudentIds.size,
          newRecordsCount: 0,
        },
      });
    }
    const createdRecords = [];
    const now = new Date().toISOString();
    for (const student of studentsToAdd) {
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
            status: 'pending', 
            notes: '等待点名',
            createdAt: now,
            uniqueKey,
          }
        );
        createdRecords.push(record);
      } catch (err) {
        const error = err as Error & { code?: number };
        if (error.code === 409) {
          console.log(`[INIT-SESSION] 学生 ${student.studentName} 已有记录，跳过`);
        } else {
          console.warn(`[INIT-SESSION] 创建记录失败 ${student.studentName}:`, err);
        }
      }
    }
    console.log(`[INIT-SESSION] 成功初始化 ${createdRecords.length} 条记录`);
    return NextResponse.json({
      success: true,
      message: `点名时段初始化完成：已为 ${createdRecords.length} 名学生创建待点名记录`,
      summary: {
        sessionTime,
        weekNumber,
        sessionDuration,
        totalStudents: studentList.length,
        existingRecordsCount: existingStudentIds.size,
        newRecordsCount: createdRecords.length,
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionTime = searchParams.get('sessionTime');
    const weekNumber = searchParams.get('weekNumber');
    if (!sessionTime || !weekNumber) {
      return NextResponse.json(
        { error: '缺少必要参数：sessionTime, weekNumber' },
        { status: 400 }
      );
    }
    const sessionNumber = parseInt(sessionTime.split(':')[0]) < 16 ? 1 : 2;
    const allRecords = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [
        Query.equal('weekNumber', parseInt(weekNumber)),
        Query.limit(500),
      ]
    );
    const records = allRecords.documents.filter((doc) => {
      const st = String(doc.sessionTime || '');
      const uk = String(doc.uniqueKey || doc.$id || '');
      return st === sessionTime || 
             uk.includes(`_${sessionNumber}_`) || 
             st === `session${sessionNumber}`;
    });
    const stats = {
      total: records.length,
      pending: 0,
      present: 0,
      late: 0,
      absent: 0,
    };
    for (const doc of records) {
      const status = doc.status as keyof typeof stats;
      if (status in stats && status !== 'total') {
        stats[status]++;
      }
    }
    return NextResponse.json({
      success: true,
      sessionTime,
      sessionNumber,
      weekNumber: parseInt(weekNumber),
      stats,
      isInitialized: records.length > 0,
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