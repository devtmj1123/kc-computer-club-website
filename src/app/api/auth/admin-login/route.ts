import { NextRequest, NextResponse } from 'next/server';
import { adminEmailForUsername } from '@/lib/admin-email';
import { setAdminSessionCookie } from '@/lib/admin-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifySupabasePassword } from '@/lib/supabase/auth';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const ip = getClientIp(request);
    const ipLimit = rateLimit(`admin-login-ip:${ip}`, 20, 10 * 60 * 1000);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfter);
    }

    const accountLimit = rateLimit(
      `admin-login:${ip}:${normalizedUsername}`,
      8,
      10 * 60 * 1000
    );
    if (!accountLimit.allowed) {
      return rateLimitResponse(accountLimit.retryAfter);
    }

    const user = await verifySupabasePassword(
      adminEmailForUsername(normalizedUsername),
      password
    );
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, role, is_active, chinese_name, english_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('管理员资料读取失败:', profileError?.message);
      return NextResponse.json(
        { success: false, error: '管理员账户不存在或资料不完整' },
        { status: 403 }
      );
    }
    if (profile.role !== 'admin' || profile.is_active === false) {
      return NextResponse.json(
        { success: false, error: '此账号已被禁用或没有管理员权限' },
        { status: 403 }
      );
    }
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '此账号没有管理员权限' },
        { status: 403 }
      );
    }

    const adminUsername =
      typeof user.app_metadata?.username === 'string' &&
      user.app_metadata.username
        ? user.app_metadata.username
        : normalizedUsername;

    const { error: lastLoginError } = await admin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
    if (lastLoginError) {
      console.error('更新管理员登录时间失败:', lastLoginError.message);
    }

    const response = NextResponse.json({
      success: true,
      admin: {
        id: user.id,
        email: user.email || adminEmailForUsername(adminUsername),
        name:
          profile.chinese_name ||
          profile.english_name ||
          adminUsername,
        username: adminUsername,
        role: 'admin',
      },
    });

    return setAdminSessionCookie(response, {
      id: user.id,
      username: adminUsername,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('管理员登录失败:', err);
    return NextResponse.json(
      { success: false, error: '登录服务异常，请稍后重试' },
      { status: 500 }
    );
  }
}
