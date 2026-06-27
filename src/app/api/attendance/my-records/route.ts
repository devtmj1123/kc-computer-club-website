import { Client, Databases, Query } from 'node-appwrite';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentEmail = searchParams.get('email');
    if (!studentEmail) {
      return Response.json(
        { error: '缺少学生邮箱' },
        { status: 400 }
      );
    }
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');
    const databases = new Databases(client);
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const ATTENDANCE_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || 'attendance';
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_COLLECTION,
      [
        Query.equal('studentEmail', studentEmail),
        Query.orderDesc('checkInTime'),
      ]
    );
    const recordsByWeek: Record<number, any[]> = {};
    response.documents.forEach((doc: any) => {
      const week = doc.weekNumber || 0;
      if (!recordsByWeek[week]) {
        recordsByWeek[week] = [];
      }
      recordsByWeek[week].push(doc);
    });
    return Response.json({
      success: true,
      studentEmail,
      recordsByWeek,
      totalRecords: response.documents.length,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取学生记录失败:', err);
    return Response.json(
      { error: err.message || '获取记录失败' },
      { status: 500 }
    );
  }
}