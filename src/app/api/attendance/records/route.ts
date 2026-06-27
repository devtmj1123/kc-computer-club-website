import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionTime = searchParams.get('sessionTime') as '15:20' | '16:35' | null;
    const weekNumber = searchParams.get('weekNumber')
      ? parseInt(searchParams.get('weekNumber') as string)
      : getCurrentWeekNumber();
    const includeAll = searchParams.get('includeAll') !== 'false'; 
    const requestedSessionTime = sessionTime;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const usersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || 'users';
    if (!databaseId) {
      return NextResponse.json(
        { error: '服务器配置不完整' },
        { status: 500 }
      );
    }
    const ATTENDANCE_COLLECTION_ID = 'attendance';
    const CLUB_SETTINGS_COLLECTION_ID = 'clubSettings';
    const ATTENDANCE_CONFIG_DOC_ID = 'attendance_config';
    let session1Time = '15:20';
    let session2Time = '16:35';
    let configError: string | null = null;
    try {
      const settingsDoc = await serverDatabases.getDocument(
        databaseId,
        CLUB_SETTINGS_COLLECTION_ID,
        ATTENDANCE_CONFIG_DOC_ID
      );
      console.log('[RECORDS] 读取到配置文档');
      if (settingsDoc.attendanceSession1Start) {
        const s1 = JSON.parse(String(settingsDoc.attendanceSession1Start));
        session1Time = `${s1.hour}:${String(s1.minute).padStart(2, '0')}`;
        console.log('[RECORDS] session1Time from config:', session1Time);
      }
      if (settingsDoc.attendanceSession2Start) {
        const s2 = JSON.parse(String(settingsDoc.attendanceSession2Start));
        session2Time = `${s2.hour}:${String(s2.minute).padStart(2, '0')}`;
        console.log('[RECORDS] session2Time from config:', session2Time);
      }
    } catch (err) {
      const error = err as Error;
      configError = error.message || String(err);
      console.warn('[RECORDS] 获取时段配置失败，使用默认值:', configError);
    }
    const extractStudentIdFromEmail = (email: string): string => {
      const match = email?.match(/^(\d+)@/);
      return match ? match[1] : email?.split('@')[0] || '';
    };
    let allStudents: Array<{ $id: string; studentId: string; studentName: string; studentEmail: string }> = [];
    if (includeAll) {
      try {
        const usersResponse = await serverDatabases.listDocuments(
          databaseId,
          usersCollectionId,
          [Query.equal('role', 'student'), Query.limit(500)]
        );
        allStudents = usersResponse.documents.map((doc: Record<string, unknown>) => {
          const email = String(doc.email || '');
          const studentId = doc.studentId 
            ? String(doc.studentId)
            : extractStudentIdFromEmail(email);
          return {
            $id: String(doc.$id),
            studentId,
            studentName: String(doc.chineseName || doc.name || email),
            studentEmail: email,
          };
        });
      } catch (err) {
        console.warn('获取学生列表失败:', err);
      }
    }
    if (sessionTime) {
      const queries = [Query.equal('sessionTime', sessionTime)];
      if (weekNumber !== undefined) {
        queries.push(Query.equal('weekNumber', weekNumber));
      }
      const response = await serverDatabases.listDocuments(
        databaseId,
        ATTENDANCE_COLLECTION_ID,
        queries as unknown as string[]
      );
      const records = response.documents.sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) => 
          new Date(String(b.checkInTime)).getTime() - new Date(String(a.checkInTime)).getTime()
      );
      const allRecords: Record<string, unknown>[] = [...records];
      if (includeAll && allStudents.length > 0) {
        const recordedUniqueKeys = new Set(
          records.map((r: Record<string, unknown>) => {
            if (r.uniqueKey) return String(r.uniqueKey);
            return `${String(r.studentId)}_${sessionTime}_${weekNumber}`;
          })
        );
        for (const student of allStudents) {
          const expectedUniqueKey = `${student.studentId}_${sessionTime}_${weekNumber}`;
          if (!recordedUniqueKeys.has(expectedUniqueKey)) {
            allRecords.push({
              $id: `pending_${student.studentId}_${sessionTime}_week${weekNumber}`,
              studentId: student.studentId,
              studentName: student.studentName,
              studentEmail: student.studentEmail,
              checkInTime: null,
              sessionTime: sessionTime,
              weekNumber: weekNumber,
              status: 'pending', 
              notes: '',
              isPending: true,
              uniqueKey: expectedUniqueKey,
            });
          }
        }
      }
      const statusOrder = { present: 0, late: 1, pending: 2, absent: 3 };
      allRecords.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const statusA = statusOrder[String(a.status) as keyof typeof statusOrder] ?? 4;
        const statusB = statusOrder[String(b.status) as keyof typeof statusOrder] ?? 4;
        return statusA - statusB;
      });
      return NextResponse.json({
        success: true,
        weekNumber,
        sessionTime,
        totalRecords: allRecords.length,
        presentCount: records.filter((r: Record<string, unknown>) => r.status === 'present').length,
        lateCount: records.filter((r: Record<string, unknown>) => r.status === 'late').length,
        absentCount: records.filter((r: Record<string, unknown>) => r.status === 'absent').length,
        pendingCount: allRecords.filter((r: Record<string, unknown>) => r.status === 'pending').length,
        totalStudents: allStudents.length,
        records: allRecords,
      });
    } else {
      const queries = [Query.equal('weekNumber', weekNumber), Query.limit(500)];
      const response = await serverDatabases.listDocuments(
        databaseId,
        ATTENDANCE_COLLECTION_ID,
        queries as unknown as string[]
      );
      const records = response.documents;
      console.log('[RECORDS] ==== 详细调试信息 ====');
      console.log('[RECORDS] 获取到记录数:', records.length);
      console.log('[RECORDS] session1Time:', session1Time, 'session2Time:', session2Time);
      if (records.length > 0) {
        const sampleRecord = records[0];
        console.log('[RECORDS] 示例记录:', {
          $id: sampleRecord.$id,
          sessionTime: sampleRecord.sessionTime,
          status: sampleRecord.status,
          uniqueKey: sampleRecord.uniqueKey,
        });
      }
      const presentRecords = records.filter((r: Record<string, unknown>) => r.status === 'present');
      console.log('[RECORDS] present 状态记录数:', presentRecords.length);
      if (presentRecords.length > 0) {
        console.log('[RECORDS] present 记录详情:', presentRecords.map((r: Record<string, unknown>) => ({
          $id: r.$id,
          studentId: r.studentId,
          sessionTime: r.sessionTime,
          uniqueKey: r.uniqueKey,
          status: r.status,
        })));
      }
      const isSession1 = (r: Record<string, unknown>): boolean => {
        const st = String(r.sessionTime || '');
        const uk = String(r.uniqueKey || r.$id || '');
        if (uk.includes('_1_')) {
          return true;
        }
        if (st === session1Time || st.replace(/-/g, ':') === session1Time || st === 'session1') {
          return true;
        }
        const stMatch = st.match(/^(\d+):(\d+)$/);
        if (stMatch) {
          const recordHour = parseInt(stMatch[1]);
          const recordMinute = parseInt(stMatch[2]);
          const s1Match = session1Time.match(/^(\d+):(\d+)$/);
          if (s1Match) {
            const configHour = parseInt(s1Match[1]);
            const configMinute = parseInt(s1Match[2]);
            const recordMinutes = recordHour * 60 + recordMinute;
            const configMinutes = configHour * 60 + configMinute;
            if (Math.abs(recordMinutes - configMinutes) <= 30) {
              return true;
            }
          }
        }
        return false;
      };
      const isSession2 = (r: Record<string, unknown>): boolean => {
        const st = String(r.sessionTime || '');
        const uk = String(r.uniqueKey || r.$id || '');
        const studentId = String(r.studentId || '');
        if (r.status === 'present') {
          console.log('[RECORDS] 检查 present 记录是否为 session2:', {
            studentId,
            uk,
            st,
            'uk.includes(_2_)': uk.includes('_2_'),
            'st === session2Time': st === session2Time,
          });
        }
        if (uk.includes('_2_')) {
          if (r.status === 'present') {
            console.log('[RECORDS] present 记录匹配 session2 (通过 uniqueKey)');
          }
          return true;
        }
        if (st === session2Time || st.replace(/-/g, ':') === session2Time || st === 'session2') {
          return true;
        }
        const stMatch = st.match(/^(\d+):(\d+)$/);
        if (stMatch) {
          const recordHour = parseInt(stMatch[1]);
          const recordMinute = parseInt(stMatch[2]);
          const s2Match = session2Time.match(/^(\d+):(\d+)$/);
          if (s2Match) {
            const configHour = parseInt(s2Match[1]);
            const configMinute = parseInt(s2Match[2]);
            const recordMinutes = recordHour * 60 + recordMinute;
            const configMinutes = configHour * 60 + configMinute;
            if (Math.abs(recordMinutes - configMinutes) <= 30) {
              if (r.status === 'present') {
                console.log('[RECORDS] present 记录匹配 session2 (通过时间容差)');
              }
              return true;
            }
          }
        }
        return false;
      };
      const session1Records = records.filter((r: Record<string, unknown>) => isSession1(r));
      const session2Records = records.filter((r: Record<string, unknown>) => isSession2(r));
      console.log('[RECORDS] 过滤结果 - session1:', session1Records.length, 'session2:', session2Records.length);
      if (session1Records.length > 0) {
        console.log('[RECORDS] session1 示例:', { sessionTime: session1Records[0].sessionTime, uniqueKey: session1Records[0].uniqueKey });
      }
      if (session2Records.length > 0) {
        console.log('[RECORDS] session2 示例:', { sessionTime: session2Records[0].sessionTime, uniqueKey: session2Records[0].uniqueKey });
      }
      const addPendingStudents = (sessionRecords: Record<string, unknown>[], sessionNumber: 1 | 2, sessionTimeValue: string): Record<string, unknown>[] => {
        if (!includeAll || allStudents.length === 0) {
          return sessionRecords;
        }
        const recordedStudentIds = new Set(
          sessionRecords.map((r) => String(r.studentId))
        );
        const allRecordsWithPending = [...sessionRecords];
        for (const student of allStudents) {
          if (!recordedStudentIds.has(student.studentId)) {
            const expectedId = `${student.studentId}_${sessionNumber}_${weekNumber}`;
            allRecordsWithPending.push({
              $id: expectedId,
              studentId: student.studentId,
              studentName: student.studentName,
              studentEmail: student.studentEmail,
              checkInTime: null,
              sessionTime: sessionTimeValue,
              weekNumber: weekNumber,
              status: 'pending',
              notes: '',
              uniqueKey: expectedId,
              isPending: true,  
            });
          }
        }
        return allRecordsWithPending;
      };
      const session1 = addPendingStudents(session1Records, 1, session1Time);
      const session2 = addPendingStudents(session2Records, 2, session2Time);
      const getStatusCounts = (sessionRecords: Record<string, unknown>[]) => ({
        present: sessionRecords.filter(r => r.status === 'present').length,
        late: sessionRecords.filter(r => r.status === 'late').length,
        absent: sessionRecords.filter(r => r.status === 'absent').length,
        pending: sessionRecords.filter(r => r.status === 'pending').length,
      });
      const sortByStatus = (records: Record<string, unknown>[]): Record<string, unknown>[] => {
        const statusOrder = { present: 0, late: 1, pending: 2, absent: 3 };
        return [...records].sort((a, b) => {
          const statusA = statusOrder[String(a.status) as keyof typeof statusOrder] ?? 4;
          const statusB = statusOrder[String(b.status) as keyof typeof statusOrder] ?? 4;
          return statusA - statusB;
        });
      };
      const summary = {
        weekNumber,
        totalStudents: allStudents.length,
        session1: {
          total: session1.length,
          ...getStatusCounts(session1),
          students: sortByStatus(session1),
        },
        session2: {
          total: session2.length,
          ...getStatusCounts(session2),
          students: sortByStatus(session2),
        },
        _debug: {
          configuredSession1Time: session1Time,
          configuredSession2Time: session2Time,
          configError: configError,
          rawRecordsCount: records.length,
          presentRecordsCount: presentRecords.length,
          session1RecordsCount: session1Records.length,
          session2RecordsCount: session2Records.length,
          presentRecordDetails: presentRecords.length > 0 ? {
            studentId: presentRecords[0].studentId,
            sessionTime: presentRecords[0].sessionTime,
            status: presentRecords[0].status,
            uniqueKey: presentRecords[0].uniqueKey,
          } : null,
        },
      };
      return NextResponse.json({
        success: true,
        summary,
      });
    }
  } catch (error: unknown) {
    const err = error as Error & { message?: string; code?: number };
    console.error('获取点名记录错误:', err);
    return NextResponse.json(
      { error: err.message || '获取点名记录失败', code: err.code || 500 },
      { status: 500 }
    );
  }
}
function getCurrentWeekNumber(): number {
  const now = new Date();
  const year = now.getFullYear();
  let schoolYearStart: Date;
  if (now.getMonth() >= 8) {
    schoolYearStart = new Date(year, 8, 1);
  } else {
    schoolYearStart = new Date(year - 1, 8, 1);
  }
  const timeDiff = now.getTime() - schoolYearStart.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7) + 1;
}