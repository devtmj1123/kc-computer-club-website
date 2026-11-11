import { NextRequest, NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/student-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifySupabasePassword } from '@/lib/supabase/auth';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

const DEFAULT_STUDENT_PASSWORD = '11111111';

export async function POST(req: NextRequest) {
  const session = getStudentSession(req);
  if (!session) {
    return NextResponse.json(
      { error: '请先登录学生账号' },
      { status: 401 }
    );
  }

  try {
    const { studentId, currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    if (
      studentId &&
      String(studentId) !== session.sub &&
      String(studentId) !== session.studentId
    ) {
      return NextResponse.json(
        { error: '只能修改自己的密码' },
        { status: 403 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码至少需要6个字符' },
        { status: 400 }
      );
    }
    if (newPassword === DEFAULT_STUDENT_PASSWORD) {
      return NextResponse.json(
        { error: '新密码不能为默认密码' },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const limit = rateLimit(
      `student-change-password:${ip}:${session.sub}`,
      10,
      15 * 60 * 1000
    );
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, student_no, role, is_active')
      .eq('id', session.sub)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== 'student' ||
      profile.is_active === false
    ) {
      return NextResponse.json(
        { error: '学生账户不存在或已禁用' },
        { status: 403 }
      );
    }
    if (profile.student_no && newPassword === profile.student_no) {
      return NextResponse.json(
        { error: '新密码不能与学号相同' },
        { status: 400 }
      );
    }

    const verifiedUser = await verifySupabasePassword(
      profile.email || session.email,
      currentPassword
    );
    if (!verifiedUser || verifiedUser.id !== session.sub) {
      return NextResponse.json(
        { error: '当前密码不正确' },
        { status: 401 }
      );
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      session.sub,
      { password: newPassword }
    );
    if (authError) {
      console.error('更新学生 Auth 密码失败:', authError.message);
      return NextResponse.json(
        { error: '密码更新失败，请稍后重试' },
        { status: 500 }
      );
    }

    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({ require_password_change: false })
      .eq('id', session.sub);
    if (profileUpdateError) {
      console.error('更新学生密码状态失败:', profileUpdateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('学生修改密码失败:', err);
    return NextResponse.json(
      { error: err.message || '修改密码失败' },
      { status: 500 }
    );
  }
}
