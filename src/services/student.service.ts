import { databases } from './appwrite';
import { ID, Query } from 'appwrite';
import bcrypt from 'bcryptjs';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || '';
const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION || '';

export interface StudentFullInfo {
  $id: string;
  studentId: string;
  chineseName: string;
  englishName: string;
  email: string;
  classNameCn: string;
  classNameEn: string;
  classCode: string;
  groupLevel: string;
  level: string;
  phone: string;
  instagram: string;
  group: string;
  position: string;
  notes: string;
  role: string;
  createdAt: string;
  attendanceStats: {
    total: number;
    present: number;
    late: number;
    absent: number;
  };
  projects: Array<{
    projectId: string;
    title: string;
    teamName: string;
    role: string;
    status: string;
  }>;
}

export interface ImportStudentData {
  studentId: string;
  chineseName: string;
  englishName: string;
  classNameCn: string;
  classNameEn: string;
  classCode: string;
  groupLevel: string;
  level: string;
  phone: string;
  instagram: string;
  group: string;
  position: string;
  notes: string;
  password?: string;
}

export const DEFAULT_STUDENT_PASSWORD = '11111111';

export function extractStudentIdFromEmail(email: string): string {
  const match = email.match(/^(\d+)@/);
  return match ? match[1] : '';
}

export function generateEmailFromStudentId(studentId: string): string {
  return `${studentId}@kuencheng.edu.my`;
}

export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const patterns: Record<string, string[]> = {
    studentId: ['学号', 'student id', 'id', '编号'],
    chineseName: ['中文姓名', '中文名', '姓名', 'chinese name', '名字'],
    englishName: ['英文姓名', '英文名', 'english name', 'name'],
    classNameCn: ['班级(中文)', '班级（中文）', '班级中文', 'class cn', '班级'],
    classNameEn: ['班级(英文)', '班级（英文）', '班级英文', 'class en', 'class'],
    classCode: ['班级代号', 'class code', '代号'],
    groupLevel: ['高级组/初级组', '学点&服务', '学点', '组别', 'group level'],
    level: ['级别', '课程&课室', '课程', 'level'],
    phone: ['电话号码', '电话', 'phone', '手机', '联系电话'],
    instagram: ['instagram', 'ig', 'ins', 'instagram (如有)', 'instagram(如有)'],
    group: ['分组', 'group', '小组'],
    position: ['职位', 'position', '职务', '岗位'],
    notes: ['备注', 'notes', 'remark', '说明'],
  };

  headers.forEach((header) => {
    const lowerHeader = header.toLowerCase().trim();

    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      if (
        fieldPatterns.some(
          (p) => lowerHeader.includes(p.toLowerCase()) || lowerHeader === p.toLowerCase()
        )
      ) {
        if (!mapping[field]) {
          mapping[field] = header;
        }
        break;
      }
    }
  });

  return mapping;
}

export function validateStudentData(data: ImportStudentData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.studentId || data.studentId.trim().length < 3) {
    errors.push('学号必填且至少3位');
  }

  if (!data.chineseName || data.chineseName.trim().length < 2) {
    errors.push('中文姓名至少需要2个字符');
  }

  return { valid: errors.length === 0, errors };
}

export async function bulkImportStudents(
  students: ImportStudentData[],
  defaultPassword?: string
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ studentId: string; error: string }>;
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ studentId: string; error: string }>,
  };

  for (const student of students) {
    try {
      const validation = validateStudentData(student);
      if (!validation.valid) {
        results.failed++;
        results.errors.push({
          studentId: student.studentId || 'unknown',
          error: validation.errors.join('; '),
        });
        continue;
      }

      const email = generateEmailFromStudentId(student.studentId);

      const existing = await databases.listDocuments(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, [
        Query.equal('email', email),
      ]);

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

      await databases.createDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, ID.unique(), {
        email: email.toLowerCase().trim(),
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
      });

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

  return results;
}

export async function getAllStudents(): Promise<StudentFullInfo[]> {
  try {
    const response = await databases.listDocuments(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal('role', 'student'),
      Query.limit(500),
    ]);

    const [attendanceResponse, projectResponse] = await Promise.all([
      databases.listDocuments(APPWRITE_DATABASE_ID, ATTENDANCE_COLLECTION_ID, [Query.limit(5000)]),
      databases.listDocuments(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, [Query.limit(500)]),
    ]).catch((err) => {
      console.warn('批量获取出勤或项目记录失败，将回退使用空数据:', err);
      return [{ documents: [] }, { documents: [] }] as any;
    });

    const allAttendance = attendanceResponse.documents;
    const allProjects = projectResponse.documents;

    const attendanceByStudent = new Map<
      string,
      { total: number; present: number; late: number; absent: number }
    >();
    for (const record of allAttendance) {
      const sId = record.studentId || '';
      if (!sId) continue;

      if (!attendanceByStudent.has(sId)) {
        attendanceByStudent.set(sId, { total: 0, present: 0, late: 0, absent: 0 });
      }
      const stats = attendanceByStudent.get(sId)!;
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
          if (Array.isArray(members)) {
            for (const member of members) {
              const mEmail = (member.email || '').toLowerCase().trim();
              if (mEmail) {
                if (!projectsByEmail.has(mEmail)) {
                  projectsByEmail.set(mEmail, []);
                }
                projectsByEmail.get(mEmail)!.push({
                  projectId: project.$id,
                  title: project.title,
                  teamName: project.teamName,
                  role: member.role || '成员',
                  status: project.status,
                });
              }
            }
          }
        } catch {
        }
      }
    }

    const students: StudentFullInfo[] = response.documents.map((doc) => {
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
        createdAt: doc.createdAt || doc.$createdAt,
        attendanceStats,
        projects,
      };
    });

    return students;
  } catch (error) {
    console.error('获取学生列表失败:', error);
    throw error;
  }
}

export async function getStudentById(studentId: string): Promise<StudentFullInfo | null> {
  try {
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, studentId);

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

      await Promise.all(
        possibleStudentIds.map(async (studentIdToFind) => {
          try {
            const attendanceResponse = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              ATTENDANCE_COLLECTION_ID,
              [Query.equal('studentId', studentIdToFind), Query.limit(200)]
            );

            if (attendanceResponse.documents.length > 0) {
              attendanceStats.total += attendanceResponse.documents.length;
              attendanceStats.present += attendanceResponse.documents.filter(
                (a) => a.status === 'present'
              ).length;
              attendanceStats.late += attendanceResponse.documents.filter(
                (a) => a.status === 'late'
              ).length;
              attendanceStats.absent += attendanceResponse.documents.filter(
                (a) => a.status === 'absent'
              ).length;
            }
          } catch (queryError) {
            console.warn(`查询 studentId=${studentIdToFind} 失败:`, queryError);
          }
        })
      );
    } catch (e) {
      console.warn('获取出勤记录失败:', e);
    }

    const projects: StudentFullInfo['projects'] = [];
    try {
      const projectResponse = await databases.listDocuments(
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
            const members =
              typeof project.members === 'string' ? JSON.parse(project.members) : project.members;
            const member = members.find(
              (m: { email?: string }) => m.email && m.email.toLowerCase().trim() === studentEmail
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
          } catch (e) {
          }
        }
      }
    } catch (e) {
      console.warn('获取项目记录失败:', e);
    }

    return {
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
      createdAt: doc.createdAt || doc.$createdAt,
      attendanceStats,
      projects,
    };
  } catch (error) {
    console.error('获取学生详情失败:', error);
    return null;
  }
}

export async function deleteStudent(studentId: string): Promise<void> {
  try {
    await databases.deleteDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, studentId);
  } catch (error) {
    console.error('删除学生失败:', error);
    throw error;
  }
}

export async function deleteAllStudents(): Promise<{ deleted: number; failed: number }> {
  try {
    const response = await databases.listDocuments(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal('role', 'student'),
      Query.limit(500),
    ]);

    let deleted = 0;
    let failed = 0;

    for (const doc of response.documents) {
      try {
        await databases.deleteDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, doc.$id);
        deleted++;
      } catch (e) {
        failed++;
        console.error('删除学生失败:', doc.$id, e);
      }
    }

    return { deleted, failed };
  } catch (error) {
    console.error('批量删除学生失败:', error);
    throw error;
  }
}

export async function updateStudent(
  docId: string,
  data: Partial<Omit<StudentFullInfo, '$id' | 'attendanceStats' | 'projects' | 'createdAt'>>
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = [
      'studentId',
      'chineseName',
      'englishName',
      'email',
      'classNameCn',
      'classNameEn',
      'classCode',
      'groupLevel',
      'level',
      'phone',
      'instagram',
      'group',
      'position',
      'notes',
      'role',
    ];

    for (const field of allowedFields) {
      if (data[field as keyof typeof data] !== undefined) {
        updateData[field] = data[field as keyof typeof data];
        if (field === 'chineseName') {
          updateData['name'] = data.chineseName;
        }
      }
    }

    await databases.updateDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, docId, updateData);
  } catch (error) {
    console.error('更新学生信息失败:', error);
    throw error;
  }
}
