import { getSupabaseAdminClient } from '@/lib/supabase/admin';

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
  requirePasswordChange: boolean;
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

interface ProfileRow {
  id: string;
  email: string;
  student_no: string | null;
  chinese_name: string | null;
  english_name: string | null;
  class_name_cn: string | null;
  class_name_en: string | null;
  class_code: string | null;
  group_level: string | null;
  level: string | null;
  phone: string | null;
  instagram: string | null;
  group_name: string | null;
  position: string | null;
  notes: string | null;
  role: string;
  require_password_change: boolean;
  created_at: string;
}

interface ProjectSummaryRow {
  title: string;
  team_name: string;
  status: string;
  leader_id: string | null;
  leader_email: string;
}

interface ProjectMembershipRow {
  project_id: string;
  user_id: string | null;
  email: string;
  role: string;
  projects: ProjectSummaryRow | ProjectSummaryRow[] | null;
}

export const DEFAULT_STUDENT_PASSWORD = '11111111';
const STUDENT_EMAIL_DOMAIN = 'kuencheng.edu.my';

export function extractStudentIdFromEmail(email: string): string {
  const match = String(email || '').match(/^(\d+)@/);
  return match ? match[1] : '';
}

export function generateEmailFromStudentId(studentId: string): string {
  return `${String(studentId || '').trim()}@${STUDENT_EMAIL_DOMAIN}`;
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

export function validateStudentData(data: ImportStudentData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.studentId || data.studentId.trim().length < 3) {
    errors.push('学号必填且至少3位');
  }

  if (!data.chineseName || data.chineseName.trim().length < 2) {
    errors.push('中文姓名至少需要2个字符');
  }

  return { valid: errors.length === 0, errors };
}

function profileInsertPayload(
  data: ImportStudentData,
  requirePasswordChange: boolean
) {
  const trimmedId = data.studentId.trim();
  return {
    student_no: trimmedId,
    chinese_name: data.chineseName.trim(),
    english_name: (data.englishName || '').trim(),
    class_name_cn: (data.classNameCn || '').trim(),
    class_name_en: (data.classNameEn || '').trim(),
    class_code: (data.classCode || '').trim(),
    group_level: (data.groupLevel || '').trim(),
    level: (data.level || '').trim(),
    phone: (data.phone || '').trim(),
    instagram: (data.instagram || '').trim(),
    group_name: (data.group || '').trim(),
    position: (data.position || '').trim(),
    notes: (data.notes || '').trim(),
    role: 'student' as const,
    require_password_change: requirePasswordChange,
    is_active: true,
  };
}

async function deleteAuthUserSafe(userId: string): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    await admin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('回滚学生账号失败:', error);
  }
}

export async function createStudent(
  data: ImportStudentData,
  defaultPassword?: string
): Promise<{ id: string; email: string; requirePasswordChange: boolean }> {
  const validation = validateStudentData(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const admin = getSupabaseAdminClient();
  const studentId = data.studentId.trim();
  const email = generateEmailFromStudentId(studentId).toLowerCase();
  const password = data.password || defaultPassword || studentId;
  const requirePasswordChange =
    password === studentId || password === DEFAULT_STUDENT_PASSWORD;

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) {
    throw new Error('该学号已注册');
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !created.user) {
    throw new Error(authError?.message || '创建登录账号失败');
  }

  const payload = profileInsertPayload(data, requirePasswordChange);

  const { error: profileError } = await admin
    .from('profiles')
    .update(payload)
    .eq('id', created.user.id);

  if (profileError) {
    await deleteAuthUserSafe(created.user.id);
    throw new Error(profileError.message || '保存学生资料失败');
  }

  return {
    id: created.user.id,
    email,
    requirePasswordChange,
  };
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
      await createStudent(student, defaultPassword);
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

function mapProjectRole(role: string): string {
  if (role === 'leader') return '组长';
  if (role === 'tech_lead') return '技术负责人';
  if (role === 'design_lead') return '设计负责人';
  return '成员';
}

function normalizeProject(
  projects: ProjectMembershipRow['projects']
): ProjectSummaryRow | null {
  if (!projects) return null;
  return Array.isArray(projects) ? projects[0] || null : projects;
}

async function loadProjectMemberships(): Promise<ProjectMembershipRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('project_members')
    .select(
      'project_id, user_id, email, role, projects(title, team_name, status, leader_id, leader_email)'
    );
  if (error) {
    console.warn('读取项目成员失败，将使用空数据:', error.message);
    return [];
  }
  return (data ?? []) as unknown as ProjectMembershipRow[];
}

async function loadProjectLeaders(): Promise<
  Array<{
    id: string;
    title: string;
    team_name: string;
    status: string;
    leader_id: string | null;
    leader_email: string;
  }>
> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('projects')
    .select('id, title, team_name, status, leader_id, leader_email');
  if (error) {
    console.warn('读取项目列表失败，将使用空数据:', error.message);
    return [];
  }
  return data ?? [];
}

function projectsForStudent(
  profile: Pick<ProfileRow, 'id' | 'email'>,
  leaders: Awaited<ReturnType<typeof loadProjectLeaders>>,
  memberships: ProjectMembershipRow[]
): StudentFullInfo['projects'] {
  const result: StudentFullInfo['projects'] = [];
  const email = String(profile.email || '').toLowerCase().trim();

  for (const project of leaders) {
    const isLeader =
      project.leader_id === profile.id ||
      String(project.leader_email || '').toLowerCase().trim() === email;
    if (!isLeader) continue;
    result.push({
      projectId: project.id,
      title: project.title,
      teamName: project.team_name,
      role: '组长',
      status: project.status,
    });
  }

  for (const membership of memberships) {
    const project = normalizeProject(membership.projects);
    if (!project) continue;

    const isMember =
      membership.user_id === profile.id ||
      String(membership.email || '').toLowerCase().trim() === email;
    if (!isMember) continue;

    if (result.some((item) => item.projectId === membership.project_id)) {
      continue;
    }

    result.push({
      projectId: membership.project_id,
      title: project.title,
      teamName: project.team_name,
      role: mapProjectRole(membership.role),
      status: project.status,
    });
  }

  return result;
}

function mapProfile(
  profile: ProfileRow,
  attendanceStats: StudentFullInfo['attendanceStats'],
  projects: StudentFullInfo['projects']
): StudentFullInfo {
  return {
    $id: profile.id,
    studentId: profile.student_no || extractStudentIdFromEmail(profile.email),
    chineseName: profile.chinese_name || '',
    englishName: profile.english_name || '',
    email: profile.email,
    classNameCn: profile.class_name_cn || '',
    classNameEn: profile.class_name_en || '',
    classCode: profile.class_code || '',
    groupLevel: profile.group_level || '',
    level: profile.level || '',
    phone: profile.phone || '',
    instagram: profile.instagram || '',
    group: profile.group_name || '',
    position: profile.position || '',
    notes: profile.notes || '',
    role: profile.role,
    requirePasswordChange: profile.require_password_change ?? true,
    createdAt: profile.created_at,
    attendanceStats,
    projects,
  };
}

async function loadAttendanceStats(): Promise<
  Map<string, StudentFullInfo['attendanceStats']>
> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_records')
    .select('student_id, status');
  if (error) {
    console.warn('读取出勤记录失败，将使用空数据:', error.message);
    return new Map();
  }

  const statsByStudent = new Map<string, StudentFullInfo['attendanceStats']>();
  for (const record of data ?? []) {
    const studentId = String(record.student_id || '');
    if (!studentId) continue;
    if (!statsByStudent.has(studentId)) {
      statsByStudent.set(studentId, { total: 0, present: 0, late: 0, absent: 0 });
    }
    const stats = statsByStudent.get(studentId)!;
    stats.total++;
    if (record.status === 'present') stats.present++;
    else if (record.status === 'late') stats.late++;
    else if (record.status === 'absent') stats.absent++;
  }
  return statsByStudent;
}

export async function getAllStudents(): Promise<StudentFullInfo[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('student_no', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('获取学生列表失败:', error.message);
    throw new Error('获取学生列表失败');
  }

  const [attendanceByStudent, leaders, memberships] = await Promise.all([
    loadAttendanceStats(),
    loadProjectLeaders(),
    loadProjectMemberships(),
  ]);

  const emptyStats = { total: 0, present: 0, late: 0, absent: 0 };

  return ((data ?? []) as unknown as ProfileRow[]).map((profile) =>
    mapProfile(
      profile,
      attendanceByStudent.get(profile.id) || emptyStats,
      projectsForStudent(profile, leaders, memberships)
    )
  );
}

export async function getStudentById(studentId: string): Promise<StudentFullInfo | null> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();
  if (error) {
    console.error('获取学生详情失败:', error.message);
    return null;
  }
  if (!data) return null;

  const [attendanceByStudent, leaders, memberships] = await Promise.all([
    loadAttendanceStats(),
    loadProjectLeaders(),
    loadProjectMemberships(),
  ]);

  const profile = data as unknown as ProfileRow;
  return mapProfile(
    profile,
    attendanceByStudent.get(profile.id) || {
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
    },
    projectsForStudent(profile, leaders, memberships)
  );
}

export async function deleteStudent(studentId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) {
    console.error('删除学生失败:', error.message);
    throw new Error(error.message || '删除学生失败');
  }
}

export async function deleteAllStudents(): Promise<{ deleted: number; failed: number }> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'student');
  if (error) {
    console.error('批量删除学生失败:', error.message);
    throw new Error('批量删除学生失败');
  }

  let deleted = 0;
  let failed = 0;

  for (const profile of data ?? []) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id);
    if (deleteError) {
      failed++;
      console.error('删除学生失败:', profile.id, deleteError.message);
    } else {
      deleted++;
    }
  }

  return { deleted, failed };
}

export async function updateStudent(
  docId: string,
  data: Partial<
    Omit<StudentFullInfo, '$id' | 'attendanceStats' | 'projects' | 'createdAt' | 'email'>
  >
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const fieldMap: Record<string, string> = {
    studentId: 'student_no',
    chineseName: 'chinese_name',
    englishName: 'english_name',
    classNameCn: 'class_name_cn',
    classNameEn: 'class_name_en',
    classCode: 'class_code',
    groupLevel: 'group_level',
    level: 'level',
    phone: 'phone',
    instagram: 'instagram',
    group: 'group_name',
    position: 'position',
    notes: 'notes',
    role: 'role',
    requirePasswordChange: 'require_password_change',
  };

  for (const [field, column] of Object.entries(fieldMap)) {
    const value = data[field as keyof typeof data];
    if (value !== undefined) {
      update[column] = value;
    }
  }

  const { error } = await admin.from('profiles').update(update).eq('id', docId);
  if (error) {
    console.error('更新学生信息失败:', error.message);
    throw new Error(error.message || '更新学生信息失败');
  }
}

export async function setStudentPassword(input: {
  userId: string;
  newPassword: string;
  requirePasswordChange?: boolean;
}): Promise<void> {
  if (input.newPassword.length < 6) {
    throw new Error('密码至少需要 6 位');
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(input.userId, {
    password: input.newPassword,
  });
  if (error) {
    console.error('更新学生密码失败:', error.message);
    throw new Error('更新学生密码失败');
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      require_password_change: input.requirePasswordChange ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId);
  if (profileError) {
    console.error('更新密码状态失败:', profileError.message);
    throw new Error('更新密码状态失败');
  }
}
