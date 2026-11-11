import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';
import {
  bulkImportStudents,
  deleteAllStudents,
  getAllStudents,
  type ImportStudentData,
} from '@/services/student.service';

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const students = await getAllStudents();
    return NextResponse.json({ success: true, students });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取学生列表失败:', err);
    return NextResponse.json(
      { success: false, error: err.message || '获取学生列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { students, defaultPassword } = body as {
      students?: ImportStudentData[];
      defaultPassword?: string;
    };
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供学生数据' },
        { status: 400 }
      );
    }

    const results = await bulkImportStudents(students, defaultPassword);
    return NextResponse.json({
      success: true,
      message: `成功导入 ${results.success} 名学生，失败 ${results.failed} 名`,
      imported: results.success,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || '批量导入失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const result = await deleteAllStudents();
    return NextResponse.json({
      success: true,
      message: `已删除 ${result.deleted} 名学生，失败 ${result.failed} 名`,
      deleted: result.deleted,
      failed: result.failed,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || '删除失败' },
      { status: 500 }
    );
  }
}
