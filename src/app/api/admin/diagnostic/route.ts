import { NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || '';
export async function GET() {
  try {
    const studentsResponse = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('role', 'student'), Query.limit(500)]
    );
    const attendanceResponse = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [Query.limit(500)]
    );
    const allUsersResponse = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.limit(500)]
    );
    const students = studentsResponse.documents;
    const attendanceRecords = attendanceResponse.documents;
    const allUsers = allUsersResponse.documents;
    return NextResponse.json({
      success: true,
      diagnostic: {
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalAttendanceRecords: attendanceRecords.length,
        studentList: students.map((s) => ({
          $id: s.$id,
          studentId: s.studentId || 'N/A',
          chineseName: s.chineseName || s.name || 'N/A',
          email: s.email || 'N/A',
          role: s.role || 'N/A',
        })),
        userRoles: allUsers.reduce((acc: Record<string, number>, u) => {
          const role = (u.role as string) || 'unknown';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {}),
        sampleAttendanceRecords: attendanceRecords.slice(0, 5).map((r) => ({
          $id: r.$id,
          studentId: r.studentId || 'N/A',
          studentName: r.studentName || 'N/A',
          sessionTime: r.sessionTime || 'N/A',
          status: r.status || 'N/A',
          weekNumber: r.weekNumber || 'N/A',
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