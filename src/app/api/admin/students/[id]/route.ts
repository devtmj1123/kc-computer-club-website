import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';
import {
  deleteStudent,
  getStudentById,
  setStudentPassword,
  updateStudent,
} from '@/services/student.service';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const student = await getStudentById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: '学生不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, student });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取学生信息失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '获取学生信息失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const admin = getSupabaseAdminClient();

    if (typeof body.email === 'string' && body.email.trim()) {
      const email = body.email.trim().toLowerCase();
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        email,
        email_confirm: true,
      });
      if (authError) {
        return NextResponse.json(
          { success: false, error: authError.message || '邮箱更新失败' },
          { status: 400 }
        );
      }
      const { error: profileError } = await admin
        .from('profiles')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (profileError) {
        return NextResponse.json(
          { success: false, error: profileError.message || '邮箱更新失败' },
          { status: 400 }
        );
      }
    }

    if (body.newPassword) {
      await setStudentPassword({
        userId: id,
        newPassword: String(body.newPassword),
        requirePasswordChange: body.requirePasswordChange ?? false,
      });
    } else if (body.requirePasswordChange !== undefined) {
      await admin
        .from('profiles')
        .update({
          require_password_change: Boolean(body.requirePasswordChange),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    await updateStudent(id, {
      studentId: body.studentId,
      chineseName: body.chineseName,
      englishName: body.englishName,
      classNameCn: body.classNameCn,
      classNameEn: body.classNameEn,
      classCode: body.classCode,
      groupLevel: body.groupLevel,
      level: body.level,
      phone: body.phone,
      instagram: body.instagram,
      group: body.group,
      position: body.position,
      notes: body.notes,
      role: body.role,
    });

    return NextResponse.json({ success: true, message: '学生信息已更新' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || '更新失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await deleteStudent(id);
    return NextResponse.json({ success: true, message: '学生已删除' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || '删除失败' },
      { status: 500 }
    );
  }
}
