import { NextRequest, NextResponse } from 'next/server';
import {
  getAllProjects,
  createProject,
  getUserProject,
  getProjectStats,
} from '@/services/project.service';
import { CreateProjectInput } from '@/types';
import { requireAdminSession } from '@/lib/admin-session';
import {
  normalizeEmail,
  resolveProjectMembers,
  verifyStudentRequestIdentity,
} from '@/lib/student-identity';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const checkUser = searchParams.get('checkUser');
    const checkUserId = searchParams.get('checkUserId');
    const getStats = searchParams.get('stats');

    if (getStats === 'true') {
      const authError = requireAdminSession(request);
      if (authError) return authError;

      const projects = await getAllProjects();
      const stats = await getProjectStats();
      return NextResponse.json({
        success: true,
        projects,
        stats,
      });
    }

    if (checkUser) {
      const student = await verifyStudentRequestIdentity(
        request,
        checkUser,
        checkUserId
      );
      if (!student) {
        return NextResponse.json(
          { error: '学生身份验证失败' },
          { status: 401 }
        );
      }

      const userProject = await getUserProject(student.email);
      if (userProject) {
        return NextResponse.json({
          success: true,
          hasProject: true,
          project: userProject,
          isLeader: normalizeEmail(userProject.leaderEmail) === student.email,
        });
      }
      return NextResponse.json({
        success: true,
        hasProject: false,
        project: null,
        isLeader: false,
      });
    }

    // Public project listings only ever expose approved projects. Only an
    // authenticated admin may request another status.
    const isAdmin = requireAdminSession(request) === null;
    const requestedStatus = isAdmin ? status || undefined : 'approved';
    const projects = await getAllProjects(requestedStatus);
    return NextResponse.json({
      success: true,
      total: projects.length,
      projects,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      teamName,
      title,
      description,
      category,
      objectives,
      timeline,
      resources,
      projectLink,
      members,
      leaderId,
      leaderEmail,
    } = body;

    if (!teamName || !title || !description || !category || !leaderId || !leaderEmail) {
      return NextResponse.json(
        { error: '缺少必填字段：teamName, title, description, category, leaderId, leaderEmail' },
        { status: 400 }
      );
    }

    const leader = await verifyStudentRequestIdentity(
      request,
      leaderEmail,
      leaderId
    );
    if (!leader) {
      return NextResponse.json(
        { error: '组长身份验证失败，请重新登录' },
        { status: 401 }
      );
    }

    let normalizedMembers;
    try {
      normalizedMembers = await resolveProjectMembers(members);
    } catch (memberError) {
      return NextResponse.json(
        {
          error:
            memberError instanceof Error ? memberError.message : '组员信息无效',
        },
        { status: 400 }
      );
    }

    if (!normalizedMembers.some((member) => member.email === leader.email)) {
      return NextResponse.json(
        { error: '组长必须在组员列表中' },
        { status: 400 }
      );
    }

    const existingProject = await getUserProject(leader.email);
    if (existingProject) {
      return NextResponse.json(
        {
          error: '您已经是其他项目的成员，不能创建新项目',
          existingProject: {
            id: existingProject.projectId,
            title: existingProject.title,
            teamName: existingProject.teamName,
          },
        },
        { status: 400 }
      );
    }

    for (const member of normalizedMembers) {
      if (member.email !== leader.email) {
        const memberProject = await getUserProject(member.email);
        if (memberProject) {
          return NextResponse.json(
            {
              error: `组员 ${member.name} (${member.email}) 已经是其他项目的成员`,
              memberEmail: member.email,
            },
            { status: 400 }
          );
        }
      }
    }

    const input: CreateProjectInput = {
      teamName,
      title,
      description,
      category,
      objectives: objectives || '',
      timeline: timeline || '',
      resources: resources || '',
      projectLink: projectLink || '',
      members: normalizedMembers,
      leaderId: leader.id,
      leaderEmail: leader.email,
    };
    const project = await createProject(input);
    return NextResponse.json({
      success: true,
      message: '项目创建成功',
      project,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建项目失败:', err);
    return NextResponse.json(
      { error: err.message || '创建项目失败' },
      { status: 500 }
    );
  }
}
