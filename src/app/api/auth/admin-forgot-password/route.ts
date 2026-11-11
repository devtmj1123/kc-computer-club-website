import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { adminEmailForUsername } from '@/lib/admin-email';
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
  '如果该管理员账户存在并已设置 recovery email，重置邮件已发送。请检查收件箱和垃圾邮件文件夹。';

interface AdminRecoveryProfile {
  id: string;
  email: string;
  recovery_email: string | null;
  role: string;
  is_active: boolean | null;
  chinese_name: string | null;
}

function isMissingRecoveryEmailColumn(message: string | undefined): boolean {
  return Boolean(message && /recovery_email/i.test(message));
}

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
    const identifier = String(
      body.identifier || body.username || body.email || ''
    )
      .trim()
      .toLowerCase();

    if (!identifier) {
      return NextResponse.json(
        { error: '请输入管理员用户名或 recovery email' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const limit = rateLimit(
      `admin-forgot-password:${ip}:${identifier}`,
      5,
      60 * 60 * 1000
    );
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }

    const admin = getSupabaseAdminClient();
    let profile: AdminRecoveryProfile | null = null;

    if (identifier.includes('@')) {
      const { data, error } = await admin
        .from('profiles')
        .select(
          'id, email, recovery_email, role, is_active, chinese_name'
        )
        .eq('role', 'admin')
        .eq('recovery_email', identifier)
        .maybeSingle();

      if (error) {
        if (isMissingRecoveryEmailColumn(error.message)) {
          console.error(
            '管理员找回密码失败：请先应用 0005_admin_recovery_email.sql'
          );
        } else {
          console.error('查询管理员 recovery email 失败:', error.message);
        }
        return NextResponse.json({
          success: true,
          message: GENERIC_MESSAGE,
        });
      }
      profile = data as AdminRecoveryProfile | null;
    } else {
      const internalEmail = adminEmailForUsername(identifier);
      const { data, error } = await admin
        .from('profiles')
        .select(
          'id, email, recovery_email, role, is_active, chinese_name'
        )
        .eq('email', internalEmail)
        .maybeSingle();

      if (error) {
        if (isMissingRecoveryEmailColumn(error.message)) {
          console.error(
            '管理员找回密码失败：请先应用 0005_admin_recovery_email.sql'
          );
        } else {
          console.error('查询管理员账户失败:', error.message);
        }
        return NextResponse.json({
          success: true,
          message: GENERIC_MESSAGE,
        });
      }
      profile = data as AdminRecoveryProfile | null;
    }

    if (
      !profile ||
      profile.role !== 'admin' ||
      profile.is_active === false
    ) {
      return NextResponse.json({
        success: true,
        message: GENERIC_MESSAGE,
      });
    }

    const recoveryEmail = profile.recovery_email?.trim().toLowerCase();
    if (!recoveryEmail) {
      console.log(
        `管理员 ${profile.email} 未设置 recovery email，跳过密码重置邮件`
      );
      return NextResponse.json({
        success: true,
        message: GENERIC_MESSAGE,
      });
    }

    const resetToken = createResetToken({
      userId: profile.id,
      email: recoveryEmail,
      timestamp: Date.now(),
      type: 'admin',
    });
    if (!resetToken) {
      return NextResponse.json(
        { error: '密码重置功能暂未配置，请联系管理员' },
        { status: 503 }
      );
    }

    const resetLink =
      `${getAppUrl()}/auth/reset-password?token=` +
      `${encodeURIComponent(resetToken)}&type=admin`;
    const sent = await sendPasswordResetEmail({
      to: recoveryEmail,
      displayName: profile.chinese_name,
      resetLink,
      audience: 'admin',
    });

    if (sent.ok) {
      console.log(
        `管理员密码重置邮件已发送至 ${recoveryEmail} (管理员ID: ${profile.id})`
      );
    }

    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error('管理员忘记密码 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
