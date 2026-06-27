import { NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ATTENDANCE_COLLECTION_ID = 'attendance';
export async function GET() {
  try {
    const attendanceResponse = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [Query.limit(500)]
    );
    const records = attendanceResponse.documents;
    const present = records.filter(r => r.status === 'present');
    const late = records.filter(r => r.status === 'late');
    const absent = records.filter(r => r.status === 'absent');
    const pending = records.filter(r => r.status === 'pending');
    const bySessionTime: Record<string, number> = {};
    records.forEach(r => {
      const st = String(r.sessionTime);
      bySessionTime[st] = (bySessionTime[st] || 0) + 1;
    });
    return NextResponse.json({
      success: true,
      diagnostic: {
        totalRecords: records.length,
        byStatus: {
          present: present.length,
          late: late.length,
          absent: absent.length,
          pending: pending.length,
        },
        bySessionTime,
        presentRecords: present.map(r => ({
          $id: r.$id,
          studentId: r.studentId,
          studentName: r.studentName,
          sessionTime: r.sessionTime,
          weekNumber: r.weekNumber,
          status: r.status,
          checkInTime: r.checkInTime,
          uniqueKey: r.uniqueKey,
        })),
        allRecordsSample: records.slice(0, 10).map(r => ({
          $id: r.$id,
          studentId: r.studentId,
          sessionTime: r.sessionTime,
          weekNumber: r.weekNumber,
          status: r.status,
          uniqueKey: r.uniqueKey,
        })),
      },
    });
  } catch (error) {
    console.error('诊断失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '诊断失败',
      },
      { status: 500 }
    );
  }
}