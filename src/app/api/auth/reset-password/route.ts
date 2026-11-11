import { NextResponse } from 'next/server';
import { verifyResetToken } from '@/lib/reset-token';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

const DEFAULT_STUDENT_PASSWORD = '11111111';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }
    const ip = getClientIp(request);
    const limit = rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }
    const tokenResult = verifyResetToken(token);
    if (!tokenResult.ok) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: 400 }
      );
    }

    const { userId, email } = tokenResult.data;
    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== 'student' ||
      profile.is_active === false ||
      String(profile.email).toLowerCase() !== String(email).toLowerCase()
    ) {
      return NextResponse.json(
        { error: '无效的重置请求' },
        { status: 400 }
      );
    }

    const passwordErrors: string[] = [];
    if (newPassword.length < 6) {
      passwordErrors.push('密码至少需要 6 个字符');
    }
    if (newPassword === DEFAULT_STUDENT_PASSWORD) {
      passwordErrors.push('密码不能为默认密码');
    }
    if (!/[a-z]/.test(newPassword)) {
      passwordErrors.push('密码需要包含小写字母');
    }
    if (!/[A-Z]/.test(newPassword)) {
      passwordErrors.push('密码需要包含大写字母');
    }
    if (!/[0-9]/.test(newPassword)) {
      passwordErrors.push('密码需要包含数字');
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      passwordErrors.push('密码需要包含特殊字符 (!@#$%^&*)');
    }
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors.join('; ') },
        { status: 400 }
      );
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );
    if (authError) {
      console.error('更新重置密码失败:', authError.message);
      return NextResponse.json(
        { error: '密码更新失败，请稍后重试' },
        { status: 500 }
      );
    }

    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({ require_password_change: false })
      .eq('id', profile.id);
    if (profileUpdateError) {
      console.error('更新密码重置状态失败:', profileUpdateError.message);
    }

    console.log(`密码重置成功: ${profile.email} (用户ID: ${profile.id})`);
    return NextResponse.json({
      success: true,
      message: '密码重置成功。请使用新密码登录。',
    });
  } catch (error) {
    console.error('重置密码 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
