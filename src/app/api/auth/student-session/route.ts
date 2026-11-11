import { NextRequest, NextResponse } from 'next/server';
import {
  clearStudentSessionCookie,
  getStudentSession,
} from '@/lib/student-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const session = getStudentSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, user: null },
      { status: 401 }
    );
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select(
        'id, email, student_no, chinese_name, english_name, class_name_cn, class_name_en, class_code, group_level, position, phone, instagram, role, is_active, require_password_change, created_at'
      )
      .eq('id', session.sub)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== 'student' ||
      profile.is_active === false ||
      String(profile.email || '').toLowerCase() !== session.email
    ) {
      const response = NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
      return clearStudentSessionCookie(response);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.chinese_name || profile.english_name || '',
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
      },
    });
  } catch (error) {
    console.error('读取学生会话失败:', error);
    return NextResponse.json(
      { success: false, user: null },
      { status: 401 }
    );
  }
}
