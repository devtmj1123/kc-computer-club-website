import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  createResetToken,
  isResetTokenConfigured,
} from '@/lib/reset-token';
import {
  getAppUrl,
  isResetEmailConfigured,
  sendPasswordResetEmail,
} from '@/lib/reset-email';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

const GENERIC_MESSAGE =
  '如果该邮箱已注册，重置请求已提交。请检查邮件（包括垃圾邮件文件夹）';

export async function POST(request: Request) {
  try {
    if (!isResetTokenConfigured()) {
      return NextResponse.json(
        { error: '密码重置功能暂未配置，请联系管理员' },
        { status: 503 }
      );
    }
    if (!isResetEmailConfigured()) {
      return NextResponse.json(
        { error: '邮件服务暂未配置，请联系管理员重置密码' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    const emailRegex = /^\d{5,6}@kuencheng\.edu\.my$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式错误' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const limit = rateLimit(`forgot-password:${ip}:${email}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, role, is_active, chinese_name, english_name')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('查询密码重置用户失败:', profileError.message);
      return NextResponse.json(
        { error: '服务暂时不可用，请稍后重试' },
        { status: 500 }
      );
    }

    if (
      !profile ||
      profile.role !== 'student' ||
      profile.is_active === false
    ) {
      return NextResponse.json({
        success: true,
        message: GENERIC_MESSAGE,
      });
    }

    const resetToken = createResetToken({
      userId: profile.id,
      email,
      timestamp: Date.now(),
      type: 'student',
    });
    if (!resetToken) {
      return NextResponse.json(
        { error: '密码重置功能暂未配置，请联系管理员' },
        { status: 503 }
      );
    }

    const appUrl = getAppUrl(request);
    const resetLink = `${appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    const sent = await sendPasswordResetEmail({
      to: email,
      displayName: profile.chinese_name || profile.english_name,
      resetLink,
      audience: 'student',
      appUrl,
    });

    if (sent.ok) {
      console.log(`密码重置邮件已发送: ${email} (用户ID: ${profile.id})`);
    } else {
      console.error(
        `密码重置邮件发送失败: ${email} (用户ID: ${profile.id})，请检查 RESEND_API_KEY / RESEND_FROM_EMAIL`
      );
    }

    // Always return the same response, whether the account exists or the
    // provider rejects a message, to avoid account discovery.
    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error('忘记密码 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
