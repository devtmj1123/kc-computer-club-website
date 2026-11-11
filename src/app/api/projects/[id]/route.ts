import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectById,
  getUserProject,
  updateProject,
  deleteProject,
  approveProject,
  rejectProject,
  requestRevision,
  revertProjectToPending,
} from '@/services/project.service';
import { UpdateProjectInput } from '@/types';
import { requireAdminSession } from '@/lib/admin-session';
import {
  getSessionStudent,
  normalizeEmail,
  resolveProjectMembers,
  verifyStudentRequestIdentity,
} from '@/lib/student-identity';

const ADMIN_ACTIONS = new Set([
  'approve',
  'reject',
  'revision',
  'revert-pending',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);

    if (project.status !== 'approved') {
      const authError = requireAdminSession(request);
      let allowed = !authError;

      if (!allowed) {
        const student = await getSessionStudent(request);
        allowed =
          !!student && normalizeEmail(project.leaderEmail) === student.email;
      }

      if (!allowed) {
        return NextResponse.json(
          { error: '项目不存在或尚未通过审核' },
          { status: 404 }
        );
      }
    }

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
    const { action, feedback, userEmail, userId, ...updateData } = body;

    if (action !== undefined) {
      if (!ADMIN_ACTIONS.has(String(action))) {
        return NextResponse.json(
          { error: '无效的项目操作' },
          { status: 400 }
        );
      }

      const authError = requireAdminSession(request);
      if (authError) return authError;

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
        default:
          project = await revertProjectToPending(id);
      }

      return NextResponse.json({
        success: true,
        message: '项目更新成功',
        project,
      });
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

    const currentProject = await getProjectById(id);
    if (
      normalizeEmail(currentProject.leaderEmail) !== student.email ||
      (currentProject.leaderId &&
        currentProject.leaderId !== student.id &&
        currentProject.leaderId !== student.studentId)
    ) {
      return NextResponse.json(
        { error: '只有组长可以编辑此项目' },
        { status: 403 }
      );
    }

    // Whitelist editable fields: students must never be able to set status,
    // admin feedback, leader identity or other moderation-only fields.
    const sanitized: UpdateProjectInput = {};
    if (updateData.teamName !== undefined) sanitized.teamName = updateData.teamName;
    if (updateData.title !== undefined) sanitized.title = updateData.title;
    if (updateData.description !== undefined) sanitized.description = updateData.description;
    if (updateData.category !== undefined) sanitized.category = updateData.category;
    if (updateData.objectives !== undefined) sanitized.objectives = updateData.objectives;
    if (updateData.timeline !== undefined) sanitized.timeline = updateData.timeline;
    if (updateData.resources !== undefined) sanitized.resources = updateData.resources;
    if (updateData.projectLink !== undefined) sanitized.projectLink = updateData.projectLink;

    if (updateData.members !== undefined) {
      let members;
      try {
        members = await resolveProjectMembers(updateData.members);
      } catch (memberError) {
        return NextResponse.json(
          {
            error:
              memberError instanceof Error ? memberError.message : '组员信息无效',
          },
          { status: 400 }
        );
      }

      if (!members.some((member) => member.email === student.email)) {
        return NextResponse.json(
          { error: '组长必须在组员列表中' },
          { status: 400 }
        );
      }

      for (const member of members) {
        if (member.email === student.email) continue;
        const memberProject = await getUserProject(member.email);
        if (memberProject && memberProject.projectId !== id) {
          return NextResponse.json(
            {
              error: `组员 ${member.name} (${member.email}) 已经是其他项目的成员`,
              memberEmail: member.email,
            },
            { status: 400 }
          );
        }
      }

      sanitized.members = members;
    }

    const project = await updateProject(id, sanitized);
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
  const authError = requireAdminSession(request);
  if (authError) return authError;

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
