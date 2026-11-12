import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ResetTokenData } from '@/lib/reset-token';

export interface ResetProfile {
  id: string;
  email: string;
  recovery_email?: string | null;
  role: string;
  is_active: boolean | null;
}

export type ResetAccountResult =
  | { ok: true; profile: ResetProfile; email: string }
  | { ok: false; error: string; status: number; code?: string };

function isMissingRecoveryEmailColumn(message: string | undefined): boolean {
  return Boolean(message && /recovery_email/i.test(message));
}

/**
 * Verify that a reset token still points at a real, active account and that
 * the token has not already been consumed.
 *
 * Supabase updates `auth.users.updated_at` whenever the password is changed.
 * Comparing it with the token timestamp makes reset links single-use without
 * needing another table or column.
 */
export async function resolveResetAccount(
  token: ResetTokenData
): Promise<ResetAccountResult> {
  const admin = getSupabaseAdminClient();
  const isAdminReset = token.type === 'admin';

  // Student resets must keep working before migration 0005 is applied, so only
  // admin resets select the recovery_email column.
  const columns = isAdminReset
    ? 'id, email, recovery_email, role, is_active'
    : 'id, email, role, is_active';

  const { data, error } = await admin
    .from('profiles')
    .select(columns)
    .eq('id', token.userId)
    .maybeSingle();

  if (error) {
    if (isAdminReset && isMissingRecoveryEmailColumn(error.message)) {
      console.error(
        '管理员密码重置失败：请先应用 0005_admin_recovery_email.sql'
      );
      return {
        ok: false,
        status: 503,
        code: 'RECOVERY_EMAIL_MIGRATION_REQUIRED',
        error:
          '管理员密码找回尚未完成数据库配置。请先在 Supabase SQL Editor 执行 0005_admin_recovery_email.sql。',
      };
    }

    console.error('查询重置密码账户失败:', error.message);
    return {
      ok: false,
      status: 500,
      error: '服务暂时不可用，请稍后重试',
    };
  }

  const profile = data as ResetProfile | null;
  if (!profile) {
    return { ok: false, status: 400, error: '无效的重置请求' };
  }

  const roleMatches = isAdminReset
    ? profile.role === 'admin'
    : profile.role === 'student';
  if (!roleMatches || profile.is_active === false) {
    return { ok: false, status: 400, error: '无效的重置请求' };
  }

  const expectedEmail = isAdminReset ? profile.recovery_email : profile.email;
  if (
    !expectedEmail ||
    String(expectedEmail).toLowerCase() !== String(token.email).toLowerCase()
  ) {
    return { ok: false, status: 400, error: '无效的重置请求' };
  }

  // Reject links that were already used (password changed afterwards) or that
  // predate a later account update. A small tolerance absorbs clock skew.
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(
    profile.id
  );
  if (authError || !authData?.user) {
    console.error('读取重置账户认证信息失败:', authError?.message);
    return { ok: false, status: 400, error: '无效的重置请求' };
  }

  const updatedAt = authData.user.updated_at
    ? new Date(authData.user.updated_at).getTime()
    : 0;
  if (updatedAt > token.timestamp + 5000) {
    return {
      ok: false,
      status: 400,
      code: 'RESET_LINK_ALREADY_USED',
      error: '此重置链接已被使用或账户资料已更新，请重新申请。',
    };
  }

  return { ok: true, profile, email: expectedEmail };
}
