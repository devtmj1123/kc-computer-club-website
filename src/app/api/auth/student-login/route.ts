import { NextRequest, NextResponse } from 'next/server';
import {
  isStudentSessionConfigured,
  setStudentSessionCookie,
} from '@/lib/student-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifySupabasePassword } from '@/lib/supabase/auth';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!isStudentSessionConfigured()) {
      return NextResponse.json(
        { error: '登录会话未配置，请联系管理员' },
        { status: 503 }
      );
    }

    const { email, password } = await req.json();
    const normalizedEmail =
      typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return NextResponse.json(
        { error: '请提供邮箱和密码' },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const ipLimit = rateLimit(`student-login-ip:${ip}`, 30, 10 * 60 * 1000);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfter);
    }

    const accountLimit = rateLimit(
      `student-login:${ip}:${normalizedEmail}`,
      8,
      10 * 60 * 1000
    );
    if (!accountLimit.allowed) {
      return rateLimitResponse(accountLimit.retryAfter);
    }

    const user = await verifySupabasePassword(normalizedEmail, password);
    if (!user) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select(
        'id, email, student_no, chinese_name, english_name, class_name_cn, class_name_en, class_code, group_level, position, phone, instagram, role, is_active, require_password_change, created_at'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('学生资料读取失败:', profileError?.message);
      return NextResponse.json(
        { error: '账户资料不完整，请联系管理员' },
        { status: 403 }
      );
    }
    if (profile.role !== 'student') {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }
    if (profile.is_active === false) {
      return NextResponse.json(
        { error: '此账号已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    const { error: lastLoginError } = await admin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
    if (lastLoginError) {
      console.error('更新学生登录时间失败:', lastLoginError.message);
    }

    const studentName = profile.chinese_name || profile.english_name || '';
    const response = NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: studentName,
      studentId: profile.student_no || '',
      chineseName: profile.chinese_name || '',
      englishName: profile.english_name || '',
      classNameCn: profile.class_name_cn || '',
      classNameEn: profile.class_name_en || '',
      classCode: profile.class_code || '',
      groupLevel: profile.group_level || '',
      position: profile.position || '',
      phone: profile.phone || '',
      instagram: profile.instagram || '',
      createdAt: profile.created_at,
      requirePasswordChange: profile.require_password_change === true,
    });

    return setStudentSessionCookie(response, {
      id: profile.id,
      email: String(profile.email || normalizedEmail),
      studentId: profile.student_no ? String(profile.student_no) : '',
      name: studentName,
    });
  } catch (error) {
    const err = error as Error;
    console.error('学生登录失败:', err);
    return NextResponse.json(
      { error: err.message || '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
