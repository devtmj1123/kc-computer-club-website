import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';
import { createStudent } from '@/services/student.service';

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await createStudent({
      studentId: String(body.studentId || ''),
      chineseName: String(body.chineseName || ''),
      englishName: String(body.englishName || ''),
      classNameCn: String(body.classNameCn || ''),
      classNameEn: String(body.classNameEn || ''),
      classCode: String(body.classCode || ''),
      groupLevel: String(body.groupLevel || ''),
      level: String(body.level || ''),
      phone: String(body.phone || ''),
      instagram: String(body.instagram || ''),
      group: String(body.group || ''),
      position: String(body.position || ''),
      notes: String(body.notes || ''),
      password: body.password ? String(body.password) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: '学生账户创建成功',
      student: {
        id: result.id,
        email: result.email,
        studentId: String(body.studentId || '').trim(),
        chineseName: String(body.chineseName || '').trim(),
        requirePasswordChange: result.requirePasswordChange,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建学生失败:', err);
    return NextResponse.json(
      { error: err.message || '创建学生失败' },
      { status: 400 }
    );
  }
}
