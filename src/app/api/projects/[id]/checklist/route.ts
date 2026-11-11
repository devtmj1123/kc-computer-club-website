import { NextRequest, NextResponse } from 'next/server';
import { ChecklistItem } from '@/types';
import {
  getProjectById,
  getProjectChecklist,
  projectHasMember,
  replaceProjectChecklist,
} from '@/services/project.service';
import { verifyStudentRequestIdentity } from '@/lib/student-identity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checklist = await getProjectChecklist(id);

    return NextResponse.json({
      success: true,
      checklist,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取检查清单失败:', err);
    return NextResponse.json(
      { error: err.message || '获取检查清单失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, userEmail, userId } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: '项目列表格式错误' },
        { status: 400 }
      );
    }

    const student = await verifyStudentRequestIdentity(
      request,
      userEmail,
      userId
    );
    if (!student) {
      return NextResponse.json(
        { error: '学生身份验证失败，请重新登录' },
        { status: 401 }
      );
    }

    const project = await getProjectById(id);
    if (!projectHasMember(project, student.email)) {
      return NextResponse.json(
        { error: '没有权限编辑此项目的检查清单' },
        { status: 403 }
      );
    }

    const checklist = await replaceProjectChecklist(
      id,
      items.map((item: ChecklistItem) => ({
        id: String(item.id || ''),
        title: String(item.title || '').trim(),
        description: item.description || undefined,
        completed: item.completed === true,
        completedAt: item.completedAt || undefined,
        assignee: item.assignee || undefined,
      }))
    );

    return NextResponse.json({
      success: true,
      message: '检查清单更新成功',
      checklist,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新检查清单失败:', err);
    return NextResponse.json(
      { error: err.message || '更新检查清单失败' },
      { status: 500 }
    );
  }
}
