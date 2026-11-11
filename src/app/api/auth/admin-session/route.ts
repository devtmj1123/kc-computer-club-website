import { NextRequest, NextResponse } from 'next/server';
import {
  clearAdminSessionCookie,
  getAdminSession,
} from '@/lib/admin-session';
import { adminEmailForUsername } from '@/lib/admin-email';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, user: null },
      { status: 401 }
    );
  }

  try {
    const admin = getSupabaseAdminClient();

    const [{ data: profile, error: profileError }, { data: authUser, error: authError }] =
      await Promise.all([
        admin
          .from('profiles')
          .select('id, role, is_active, chinese_name, english_name')
          .eq('id', session.sub)
          .maybeSingle(),
        admin.auth.admin.getUserById(session.sub),
      ]);

    const authIsAdmin = authUser?.user?.app_metadata?.role === 'admin';

    if (
      profileError ||
      authError ||
      !profile ||
      profile.role !== 'admin' ||
      profile.is_active === false ||
      !authIsAdmin
    ) {
      const response = NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
      return clearAdminSessionCookie(response);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.sub,
        email: adminEmailForUsername(session.username),
        name:
          profile.chinese_name ||
          profile.english_name ||
          session.username,
        username: session.username,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('读取管理员会话失败:', error);
    return NextResponse.json(
      { success: false, user: null },
      { status: 401 }
    );
  }
}
