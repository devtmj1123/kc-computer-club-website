import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/services/appwrite';
import { ChecklistItem } from '@/types';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION || 'projects';
function isProjectMember(project: Record<string, unknown>, userEmail: string): boolean {
  if (!userEmail) return false;
  const email = userEmail.toLowerCase().trim();
  if (project.leaderEmail && (project.leaderEmail as string).toLowerCase().trim() === email) {
    return true;
  }
  if (project.members) {
    try {
      const members = typeof project.members === 'string' 
        ? JSON.parse(project.members) 
        : project.members;
      if (Array.isArray(members)) {
        return members.some((m: { email?: string }) => 
          m.email && m.email.toLowerCase().trim() === email
        );
      }
    } catch {
    }
  }
  return false;
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      id
    );
    let checklist = null;
    if (project.resources && typeof project.resources === 'string' && project.resources.startsWith('CHECKLIST::')) {
      try {
        const checklistJson = project.resources.substring('CHECKLIST::'.length);
        checklist = JSON.parse(checklistJson);
      } catch {
        checklist = null;
      }
    }
    return NextResponse.json({
      success: true,
      checklist: checklist || {
        checklistId: `${id}-checklist`,
        projectId: id,
        title: '项目检查清单',
        items: [],
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
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
    const { items, userEmail } = body;
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: '项目列表格式错误' },
        { status: 400 }
      );
    }
    const project = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      id
    );
    if (!userEmail || !isProjectMember(project, userEmail)) {
      return NextResponse.json(
        { error: '没有权限编辑此项目的检查清单' },
        { status: 403 }
      );
    }
    const checklist = {
      checklistId: `${id}-checklist`,
      projectId: id,
      title: '项目检查清单',
      items: items.map((item: ChecklistItem) => ({
        id: item.id,
        title: item.title,
        description: item.description || null,
        completed: item.completed,
        completedAt: item.completedAt || null,
        assignee: item.assignee || null,
      })),
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const checklistStorage = `CHECKLIST::${JSON.stringify(checklist)}`;
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      id,
      {
        resources: checklistStorage,
        updatedAt: new Date().toISOString(),
      }
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