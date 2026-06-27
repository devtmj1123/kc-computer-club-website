import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || '';
const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION || '';
function extractStudentIdFromEmail(email: string): string {
  const match = email.match(/^(\d+)@/);
  return match ? match[1] : '';
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await serverDatabases.getDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      id
    );
    if (!doc) {
      return NextResponse.json(
        { success: false, error: '学生不存在' },
        { status: 404 }
      );
    }
    const attendanceStats = { total: 0, present: 0, late: 0, absent: 0 };
    try {
      const possibleStudentIds: string[] = [];
      const extractedId = extractStudentIdFromEmail(doc.email);
      if (extractedId) possibleStudentIds.push(extractedId);
      if (doc.studentId && !possibleStudentIds.includes(doc.studentId)) {
        possibleStudentIds.push(doc.studentId);
      }
      if (doc.$id && !possibleStudentIds.includes(doc.$id)) {
        possibleStudentIds.push(doc.$id);
      }
      for (const studentIdToFind of possibleStudentIds) {
        try {
          const attendanceResponse = await serverDatabases.listDocuments(
            APPWRITE_DATABASE_ID,
            ATTENDANCE_COLLECTION_ID,
            [Query.equal('studentId', studentIdToFind), Query.limit(200)]
          );
          if (attendanceResponse.documents.length > 0) {
            const docs = attendanceResponse.documents as Array<{ status?: string }>;
            attendanceStats.total += docs.length;
            attendanceStats.present += docs.filter(a => a.status === 'present').length;
            attendanceStats.late += docs.filter(a => a.status === 'late').length;
            attendanceStats.absent += docs.filter(a => a.status === 'absent').length;
          }
        } catch {
        }
      }
    } catch {
    }
    const projects: Array<{ projectId: string; title: string; teamName: string; role: string; status: string }> = [];
    try {
      const projectResponse = await serverDatabases.listDocuments(
        APPWRITE_DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [Query.limit(100)]
      );
      const studentEmail = doc.email.toLowerCase().trim();
      for (const project of projectResponse.documents) {
        const leaderEmail = (project.leaderEmail || '').toLowerCase().trim();
        if (leaderEmail === studentEmail) {
          projects.push({
            projectId: project.$id,
            title: project.title,
            teamName: project.teamName,
            role: '组长',
            status: project.status,
          });
        } else if (project.members) {
          try {
            const members = typeof project.members === 'string' ? JSON.parse(project.members) : project.members;
            const member = members.find((m: { email?: string }) =>
              m.email && m.email.toLowerCase().trim() === studentEmail
            );
            if (member) {
              projects.push({
                projectId: project.$id,
                title: project.title,
                teamName: project.teamName,
                role: member.role || '成员',
                status: project.status,
              });
            }
          } catch {
          }
        }
      }
    } catch {
    }
    const student = {
      $id: doc.$id,
      studentId: doc.studentId || extractStudentIdFromEmail(doc.email),
      chineseName: doc.chineseName || doc.name || '',
      englishName: doc.englishName || '',
      email: doc.email,
      classNameCn: doc.classNameCn || doc.className || '',
      classNameEn: doc.classNameEn || '',
      classCode: doc.classCode || '',
      groupLevel: doc.groupLevel || '',
      level: doc.level || '',
      phone: doc.phone || '',
      instagram: doc.instagram || '',
      group: doc.group || '',
      position: doc.position || '',
      notes: doc.notes || '',
      role: doc.role,
      requirePasswordChange: doc.requirePasswordChange ?? true,
      createdAt: doc.createdAt || doc.$createdAt,
      attendanceStats,
      projects,
    };
    return NextResponse.json({ success: true, student });
  } catch (error) {
    const err = error as Error;
    console.error('获取学生信息失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '获取学生信息失败' },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    const allowedFields = [
      'studentId', 'chineseName', 'englishName', 'email',
      'classNameCn', 'classNameEn', 'classCode',
      'groupLevel', 'level', 'phone', 'instagram',
      'group', 'position', 'notes', 'role'
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
        if (field === 'chineseName') {
          updateData['name'] = body.chineseName;
        }
      }
    }
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: '密码至少需要 6 位' },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(body.newPassword, salt);
      updateData.requirePasswordChange = body.requirePasswordChange ?? false;
    }
    await serverDatabases.updateDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      id,
      updateData
    );
    return NextResponse.json({ success: true, message: '学生信息已更新' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || '更新失败' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await serverDatabases.deleteDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      id
    );
    return NextResponse.json({ success: true, message: '学生已删除' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || '删除失败' },
      { status: 500 }
    );
  }
}