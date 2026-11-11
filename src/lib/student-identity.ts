import { getStudentSession } from '@/lib/student-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ResolvedStudent {
  id: string;
  email: string;
  name: string;
  studentId: string;
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: unknown): string {
  return readText(value).toLowerCase();
}

export async function getStudentByEmail(email: unknown): Promise<ResolvedStudent | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const admin = getSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, email, chinese_name, english_name, student_no, role, is_active')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error('查询学生资料失败:', error.message);
    return null;
  }
  if (!profile || profile.role !== 'student' || profile.is_active === false) {
    return null;
  }

  return {
    id: profile.id,
    email: normalizedEmail,
    name: readText(profile.chinese_name) || readText(profile.english_name),
    studentId: readText(profile.student_no),
  };
}

/**
 * Resolves the signed student session cookie to the current database record.
 * Client-supplied email/id values are never trusted on their own.
 */
export async function getSessionStudent(
  request: Request
): Promise<ResolvedStudent | null> {
  const session = getStudentSession(request);
  if (!session) return null;

  const student = await getStudentByEmail(session.email);
  if (!student || student.id !== session.sub) return null;

  return student;
}

/**
 * Verifies that the signed session, email and id all belong to the same
 * student account. `id` may be the profile UUID or the canonical student
 * number; it is optional because the session already proves ownership.
 */
export async function verifyStudentRequestIdentity(
  request: Request,
  email: unknown,
  id?: unknown
): Promise<ResolvedStudent | null> {
  const student = await getSessionStudent(request);
  if (!student) return null;

  if (normalizeEmail(email) !== student.email) return null;

  const candidate = readText(id);
  if (!candidate) return student;

  if (candidate !== student.id && candidate !== student.studentId) {
    return null;
  }

  return student;
}

const PROJECT_MEMBER_ROLES = new Set(['leader', 'member', 'tech_lead', 'design_lead']);

export interface ResolvedProjectMember {
  userId: string;
  name: string;
  email: string;
  role: 'leader' | 'member' | 'tech_lead' | 'design_lead';
}

/**
 * Rebuilds the member list from the profiles table so a request cannot
 * invent members or impersonate someone else's display name.
 */
export async function resolveProjectMembers(
  members: unknown
): Promise<ResolvedProjectMember[]> {
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('至少需要一名组员（组长）');
  }

  const requested: Array<{ email: string; role: string }> = [];
  const seen = new Set<string>();

  for (const raw of members) {
    const record =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const email = normalizeEmail(record.email);

    if (!email) {
      throw new Error('组员邮箱不能为空');
    }
    if (seen.has(email)) {
      throw new Error('组员邮箱不能重复');
    }
    seen.add(email);
    requested.push({ email, role: readText(record.role) });
  }

  const admin = getSupabaseAdminClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, email, chinese_name, english_name, role, is_active')
    .in('email', requested.map((member) => member.email))
    .eq('role', 'student');

  if (error) {
    throw new Error(`查询组员资料失败：${error.message}`);
  }

  const byEmail = new Map(
    (profiles ?? [])
      .filter((profile) => profile.is_active !== false)
      .map((profile) => [String(profile.email).toLowerCase(), profile])
  );

  return requested.map((member) => {
    const profile = byEmail.get(member.email);
    if (!profile) {
      throw new Error(`组员 ${member.email} 未在系统中注册`);
    }

    return {
      userId: profile.id,
      name:
        readText(profile.chinese_name) ||
        readText(profile.english_name) ||
        member.email.split('@')[0],
      email: member.email,
      role: PROJECT_MEMBER_ROLES.has(member.role)
        ? (member.role as ResolvedProjectMember['role'])
        : 'member',
    };
  });
}
