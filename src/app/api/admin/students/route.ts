import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, ID, Query } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || '';
const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION || '';
const DEFAULT_STUDENT_PASSWORD = '11111111';
export async function GET() {
  try {
    const [studentsResult, attendanceResult, projectsResult] = await Promise.allSettled([
      serverDatabases.listDocuments(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, [
        Query.equal('role', 'student'),
        Query.limit(500),
      ]),
      serverDatabases.listDocuments(APPWRITE_DATABASE_ID, ATTENDANCE_COLLECTION_ID, [
        Query.limit(5000),
      ]),
      serverDatabases.listDocuments(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, [
        Query.limit(500),
      ]),
    ]);
    if (studentsResult.status === 'rejected') {
      throw new Error(`获取学生列表失败: ${studentsResult.reason}`);
    }
    const response = studentsResult.value;
    const allAttendance =
      attendanceResult.status === 'fulfilled'
        ? (attendanceResult.value.documents as Array<{ studentId?: string; status?: string }>)
        : [];
    if (attendanceResult.status === 'rejected') {
      console.warn('获取出勤记录失败，将使用空数据', attendanceResult.reason);
    }
    const allProjects =
      projectsResult.status === 'fulfilled'
        ? (projectsResult.value.documents as unknown as Array<{
            $id: string;
            title: string;
            teamName: string;
            status: string;
            leaderEmail?: string;
            members?: string | Array<{ email?: string; role?: string }>;
          }>)
        : [];
    if (projectsResult.status === 'rejected') {
      console.warn('获取项目记录失败，将使用空数据', projectsResult.reason);
    }
    const attendanceByStudent = new Map<
      string,
      { total: number; present: number; late: number; absent: number }
    >();
    for (const record of allAttendance) {
      const studentId = record.studentId || '';
      if (!studentId) continue;
      if (!attendanceByStudent.has(studentId)) {
        attendanceByStudent.set(studentId, { total: 0, present: 0, late: 0, absent: 0 });
      }
      const stats = attendanceByStudent.get(studentId)!;
      stats.total++;
      if (record.status === 'present') stats.present++;
      else if (record.status === 'late') stats.late++;
      else if (record.status === 'absent') stats.absent++;
    }
    const projectsByEmail = new Map<
      string,
      Array<{ projectId: string; title: string; teamName: string; role: string; status: string }>
    >();
    for (const project of allProjects) {
      const leaderEmail = (project.leaderEmail || '').toLowerCase().trim();
      if (leaderEmail) {
        if (!projectsByEmail.has(leaderEmail)) {
          projectsByEmail.set(leaderEmail, []);
        }
        projectsByEmail.get(leaderEmail)!.push({
          projectId: project.$id,
          title: project.title,
          teamName: project.teamName,
          role: '组长',
          status: project.status,
        });
      }
      if (project.members) {
        try {
          const members =
            typeof project.members === 'string' ? JSON.parse(project.members) : project.members;
          for (const member of members) {
            const memberEmail = (member.email || '').toLowerCase().trim();
            if (memberEmail && memberEmail !== leaderEmail) {
              if (!projectsByEmail.has(memberEmail)) {
                projectsByEmail.set(memberEmail, []);
              }
              projectsByEmail.get(memberEmail)!.push({
                projectId: project.$id,
                title: project.title,
                teamName: project.teamName,
                role: member.role || '成员',
                status: project.status,
              });
            }
          }
        } catch {
        }
      }
    }
    const students = response.documents.map((doc) => {
      const studentId = doc.studentId || extractStudentIdFromEmail(doc.email);
      const email = (doc.email || '').toLowerCase().trim();
      const attendanceStats = attendanceByStudent.get(studentId) ||
        attendanceByStudent.get(doc.$id) ||
        attendanceByStudent.get(extractStudentIdFromEmail(doc.email)) || {
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
        };
      const projects = projectsByEmail.get(email) || [];
      return {
        $id: doc.$id,
        studentId,
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
    });
    return NextResponse.json({ success: true, students });
  } catch (error) {
    const err = error as Error;
    console.error('获取学生列表失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '获取学生列表失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students, defaultPassword } = body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: '请提供学生数据' }, { status: 400 });
    }
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ studentId: string; error: string }>,
    };
    for (const student of students) {
      try {
        if (!student.studentId || student.studentId.trim().length < 3) {
          results.failed++;
          results.errors.push({
            studentId: student.studentId || 'unknown',
            error: '学号必填且至少3位',
          });
          continue;
        }
        if (!student.chineseName || student.chineseName.trim().length < 2) {
          results.failed++;
          results.errors.push({ studentId: student.studentId, error: '中文姓名至少需要2个字符' });
          continue;
        }
        const email = `${student.studentId}@kuencheng.edu.my`.toLowerCase().trim();
        const existing = await serverDatabases.listDocuments(
          APPWRITE_DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('email', email)]
        );
        if (existing.documents.length > 0) {
          results.failed++;
          results.errors.push({ studentId: student.studentId, error: '该学号已注册' });
          continue;
        }
        const now = new Date().toISOString();
        const studentIdTrimmed = student.studentId.trim();
        const password = student.password || defaultPassword || studentIdTrimmed;
        const passwordHash = await bcrypt.hash(password, 10);
        const requirePasswordChange =
          password === studentIdTrimmed || password === DEFAULT_STUDENT_PASSWORD;
        await serverDatabases.createDocument(
          APPWRITE_DATABASE_ID,
          USERS_COLLECTION_ID,
          ID.unique(),
          {
            email: email,
            name: student.chineseName.trim(),
            studentId: student.studentId.trim(),
            chineseName: student.chineseName.trim(),
            englishName: (student.englishName || '').trim(),
            classNameCn: (student.classNameCn || '').trim(),
            classNameEn: (student.classNameEn || '').trim(),
            classCode: (student.classCode || '').trim(),
            groupLevel: (student.groupLevel || '').trim(),
            level: (student.level || '').trim(),
            phone: (student.phone || '').trim(),
            instagram: (student.instagram || '').trim(),
            group: (student.group || '').trim(),
            position: (student.position || '').trim(),
            notes: (student.notes || '').trim(),
            role: 'student',
            passwordHash: passwordHash,
            requirePasswordChange: requirePasswordChange,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          }
        );
        results.success++;
      } catch (error) {
        results.failed++;
        const err = error as Error;
        results.errors.push({
          studentId: student.studentId || 'unknown',
          error: err.message || '未知错误',
        });
      }
    }
    return NextResponse.json({
      success: true,
      message: `成功导入 ${results.success} 名学生，失败 ${results.failed} 名`,
      imported: results.success,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || '批量导入失败' },
      { status: 500 }
    );
  }
}
export async function DELETE() {
  try {
    const response = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('role', 'student'), Query.limit(500)]
    );
    let deleted = 0;
    let failed = 0;
    for (const doc of response.documents) {
      try {
        await serverDatabases.deleteDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, doc.$id);
        deleted++;
      } catch {
        failed++;
      }
    }
    return NextResponse.json({
      success: true,
      message: `已删除 ${deleted} 名学生，失败 ${failed} 名`,
      deleted,
      failed,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || '删除失败' }, { status: 500 });
  }
}
function extractStudentIdFromEmail(email: string): string {
  const match = email.match(/^(\d+)@/);
  return match ? match[1] : '';
}