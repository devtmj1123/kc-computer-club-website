import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectById,
  updateProject,
  deleteProject,
  approveProject,
  rejectProject,
  requestRevision,
  revertProjectToPending,
} from '@/services/project.service';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取项目失败:', err);
    return NextResponse.json(
      { error: err.message || '获取项目失败' },
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
    const { action, feedback, ...updateData } = body;
    let project;
    switch (action) {
      case 'approve':
        project = await approveProject(id, feedback);
        break;
      case 'reject':
        project = await rejectProject(id, feedback || '项目已被拒绝');
        break;
      case 'revision':
        if (!feedback) {
          return NextResponse.json(
            { error: '要求修改需要提供反馈意见' },
            { status: 400 }
          );
        }
        project = await requestRevision(id, feedback);
        break;
      case 'revert-pending':
        project = await revertProjectToPending(id);
        break;
      default:
        project = await updateProject(id, updateData);
    }
    return NextResponse.json({
      success: true,
      message: '项目更新成功',
      project,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新项目失败:', err);
    return NextResponse.json(
      { error: err.message || '更新项目失败' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({
      success: true,
      message: '项目删除成功',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除项目失败:', err);
    return NextResponse.json(
      { error: err.message || '删除项目失败' },
      { status: 500 }
    );
  }
}