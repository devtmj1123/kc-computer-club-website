import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, requireAdminSession } from '@/lib/admin-session';
import { adminEmailForUsername, usernameFromAdminEmail } from '@/lib/admin-email';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

interface AdminRow {
  id: string;
  email: string;
  chinese_name: string | null;
  recovery_email?: string | null;
  is_active: boolean;
  created_at: string;
}

interface RecoveryEmailParseResult {
  value: string | null;
  error: string | null;
}

function parseRecoveryEmail(input: unknown): RecoveryEmailParseResult {
  if (input === undefined || input === null) {
    return { value: null, error: null };
  }

  const value = String(input).trim().toLowerCase();
  if (!value) {
    return { value: null, error: null };
  }
  if (
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    return { value: null, error: 'recovery email 格式不正确' };
  }
  if (value.endsWith('@admin.kcc.internal')) {
    return {
      value: null,
      error: 'recovery email 不能使用内部管理员邮箱',
    };
  }

  return { value, error: null };
}

function isMissingRecoveryEmailColumn(message: string | undefined): boolean {
  return Boolean(message && /recovery_email/i.test(message));
}

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const admin = getSupabaseAdminClient();
    const baseColumns = 'id, email, chinese_name, is_active, created_at';
    const withRecovery = await admin
      .from('profiles')
      .select(`${baseColumns}, recovery_email`)
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    let rows = (withRecovery.data ?? []) as AdminRow[];
    let queryError = withRecovery.error;

    if (
      queryError &&
      isMissingRecoveryEmailColumn(queryError.message)
    ) {
      console.warn(
        'profiles.recovery_email 尚未创建，管理员列表已回退到旧字段。请应用 0005_admin_recovery_email.sql'
      );
      const fallback = await admin
        .from('profiles')
        .select(baseColumns)
        .eq('role', 'admin')
        .order('created_at', { ascending: true });
      rows = (fallback.data ?? []) as AdminRow[];
      queryError = fallback.error;
    }

    if (queryError) {
      throw new Error(queryError.message);
    }
    const authUsers = new Map<string, { username?: string; lastSignIn: string | null }>();
    const { data: userPage, error: userError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!userError) {
      for (const user of userPage.users) {
        authUsers.set(user.id, {
          username:
            typeof user.app_metadata?.username === 'string'
              ? user.app_metadata.username
              : undefined,
          lastSignIn: user.last_sign_in_at || null,
        });
      }
    }

    const admins = rows.map((row) => {
      const meta = authUsers.get(row.id);
      const username =
        meta?.username ||
        usernameFromAdminEmail(row.email) ||
        row.email.split('@')[0] ||
        row.id;
      return {
        id: row.id,
        username,
        name: row.chinese_name || username,
        recoveryEmail: row.recovery_email || null,
        isActive: row.is_active,
        lastLogin: meta?.lastSignIn || null,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({ success: true, total: admins.length, admins });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取管理员列表失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '获取管理员列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码必填' },
        { status: 400 }
      );
    }
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: '用户名至少 3 个字符' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少需要 6 个字符' },
        { status: 400 }
      );
    }

    const recovery = parseRecoveryEmail(body.recoveryEmail);
    if (recovery.error) {
      return NextResponse.json(
        { success: false, error: recovery.error },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const email = adminEmailForUsername(username);
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { success: false, error: '用户名已被使用' },
        { status: 409 }
      );
    }

    if (recovery.value) {
      const { data: existingRecovery, error: recoveryError } = await admin
        .from('profiles')
        .select('id')
        .ilike('recovery_email', recovery.value)
        .maybeSingle();
      if (recoveryError) {
        return NextResponse.json(
          {
            success: false,
            error: isMissingRecoveryEmailColumn(recoveryError.message)
              ? '数据库尚未应用 0005_admin_recovery_email.sql，无法保存 recovery email'
              : recoveryError.message,
          },
          { status: 500 }
        );
      }
      if (existingRecovery) {
        return NextResponse.json(
          { success: false, error: '该 recovery email 已被其他账户使用' },
          { status: 409 }
        );
      }
    }

    const displayName = String(body.name || username).trim() || username;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'admin', username },
      user_metadata: { username, chinese_name: displayName },
    });
    if (createError || !created.user) {
      return NextResponse.json(
        { success: false, error: createError?.message || '创建管理员失败' },
        { status: 400 }
      );
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: created.user.id,
        email,
        chinese_name: displayName,
        role: 'admin',
        permissions: ['*'],
        is_active: true,
        require_password_change: false,
        ...(recovery.value ? { recovery_email: recovery.value } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json(
        {
          success: false,
          error: isMissingRecoveryEmailColumn(profileError.message)
            ? '数据库尚未应用 0005_admin_recovery_email.sql，无法保存 recovery email'
            : profileError.message || '创建管理员资料失败',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '管理员创建成功',
      admin: {
        id: created.user.id,
        username,
        name: displayName,
        isActive: true,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建管理员失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '创建管理员失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const adminId = String(body.adminId || '');
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: '缺少管理员 ID' },
        { status: 400 }
      );
    }

    const username = String(body.username || '').trim().toLowerCase();
    const newPassword = body.newPassword ? String(body.newPassword) : '';
    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少需要 6 个字符' },
        { status: 400 }
      );
    }
    if (username && username.length < 3) {
      return NextResponse.json(
        { success: false, error: '用户名至少 3 个字符' },
        { status: 400 }
      );
    }

    const hasRecoveryEmail = Object.prototype.hasOwnProperty.call(
      body,
      'recoveryEmail'
    );
    const recovery = parseRecoveryEmail(body.recoveryEmail);
    if (recovery.error) {
      return NextResponse.json(
        { success: false, error: recovery.error },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, role')
      .eq('id', adminId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理员不存在' },
        { status: 404 }
      );
    }

    if (hasRecoveryEmail && recovery.value) {
      const { data: existingRecovery, error: recoveryError } = await admin
        .from('profiles')
        .select('id')
        .ilike('recovery_email', recovery.value)
        .neq('id', adminId)
        .maybeSingle();
      if (recoveryError) {
        return NextResponse.json(
          {
            success: false,
            error: isMissingRecoveryEmailColumn(recoveryError.message)
              ? '数据库尚未应用 0005_admin_recovery_email.sql，无法保存 recovery email'
              : recoveryError.message,
          },
          { status: 500 }
        );
      }
      if (existingRecovery) {
        return NextResponse.json(
          { success: false, error: '该 recovery email 已被其他账户使用' },
          { status: 409 }
        );
      }
    }

    const authUpdate: Record<string, unknown> = {};
    if (newPassword) authUpdate.password = newPassword;
    if (body.isActive !== undefined) {
      authUpdate.ban_duration = body.isActive ? 'none' : '876000h';
    }

    const nextEmail = username ? adminEmailForUsername(username) : null;
    if (nextEmail && nextEmail !== profile.email) {
      authUpdate.email = nextEmail;
      authUpdate.email_confirm = true;
      authUpdate.app_metadata = { role: 'admin', username };
    }

    if (Object.keys(authUpdate).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(adminId, authUpdate);
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message || '更新管理员失败' },
          { status: 400 }
        );
      }
    }

    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (nextEmail) profileUpdate.email = nextEmail;
    if (body.isActive !== undefined) profileUpdate.is_active = Boolean(body.isActive);
    if (typeof body.name === 'string' && body.name.trim()) {
      profileUpdate.chinese_name = body.name.trim();
    }
    if (hasRecoveryEmail) {
      profileUpdate.recovery_email = recovery.value;
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', adminId);
    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: isMissingRecoveryEmailColumn(updateError.message)
            ? '数据库尚未应用 0005_admin_recovery_email.sql，无法保存 recovery email'
            : updateError.message || '更新管理员资料失败',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '管理员更新成功' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新管理员失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '更新管理员失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const adminId = request.nextUrl.searchParams.get('id');
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: '缺少管理员 ID' },
        { status: 400 }
      );
    }

    const current = getAdminSession(request);
    if (current?.sub === adminId) {
      return NextResponse.json(
        { success: false, error: '不能删除当前登录的管理员账号' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { success: false, error: '至少需要保留一个管理员账号' },
        { status: 400 }
      );
    }

    const { error } = await admin.auth.admin.deleteUser(adminId);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || '删除管理员失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: '管理员已删除' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除管理员失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '删除管理员失败' },
      { status: 500 }
    );
  }
}
