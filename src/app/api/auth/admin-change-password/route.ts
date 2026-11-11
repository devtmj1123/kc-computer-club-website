import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { adminEmailForUsername } from '@/lib/admin-email';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifySupabasePassword } from '@/lib/supabase/auth';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: '请先登录管理员账号' },
      { status: 401 }
    );
  }

  try {
    const { username, currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '请填写所有字段' },
        { status: 400 }
      );
    }

    if (username && String(username) !== session.username) {
      return NextResponse.json(
        { success: false, error: '只能修改自己的密码' },
        { status: 403 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '新密码至少需要 6 个字符' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const limit = rateLimit(
      `admin-change-password:${ip}:${session.sub}`,
      10,
      15 * 60 * 1000
    );
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', session.sub)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== 'admin' ||
      profile.is_active === false
    ) {
      return NextResponse.json(
        { success: false, error: '管理员账户不存在或已禁用' },
        { status: 403 }
      );
    }

    const verifiedUser = await verifySupabasePassword(
      adminEmailForUsername(session.username),
      currentPassword
    );
    if (!verifiedUser || verifiedUser.id !== session.sub) {
      return NextResponse.json(
        { success: false, error: '当前密码不正确' },
        { status: 401 }
      );
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      session.sub,
      { password: newPassword }
    );
    if (authError) {
      console.error('更新管理员 Auth 密码失败:', authError.message);
      return NextResponse.json(
        { success: false, error: '修改密码失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('管理员修改密码失败:', err);
    return NextResponse.json(
      { success: false, error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
