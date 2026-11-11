import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectMember,
  ProjectChecklist,
  ChecklistItem,
} from '@/types';

interface ProjectMemberRow {
  user_id: string | null;
  name: string;
  email: string;
  role: ProjectMember['role'];
  joined_at: string;
  sort_order: number;
}

interface ChecklistRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  assignee: string | null;
  sort_order: number;
}

interface ProjectRow {
  id: string;
  team_name: string;
  title: string;
  description: string;
  category: string;
  objectives: string | null;
  timeline: string | null;
  resources: string | null;
  project_link: string | null;
  leader_id: string | null;
  leader_email: string;
  status: Project['status'];
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  project_members?: ProjectMemberRow[] | null;
  project_checklist_items?: ChecklistRow[] | null;
}

const PROJECT_SELECT =
  'id, team_name, title, description, category, objectives, timeline, resources, project_link, leader_id, leader_email, status, admin_feedback, created_at, updated_at, project_members(user_id, name, email, role, joined_at, sort_order), project_checklist_items(id, title, description, completed, completed_at, assignee, sort_order)';

function parseProject(row: ProjectRow): Project {
  const members: ProjectMember[] = (row.project_members ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((member) => ({
      userId: member.user_id || '',
      name: member.name,
      email: member.email,
      role: member.role,
      joinedAt: member.joined_at,
    }));

  const checklistRows = (row.project_checklist_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const checklist: ProjectChecklist | undefined =
    checklistRows.length > 0
      ? {
          checklistId: `${row.id}-checklist`,
          projectId: row.id,
          title: '项目检查清单',
          items: checklistRows.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description || undefined,
            completed: item.completed,
            completedAt: item.completed_at || undefined,
            assignee: item.assignee || undefined,
          })),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      : undefined;

  return {
    projectId: row.id,
    teamName: row.team_name,
    title: row.title,
    description: row.description,
    category: row.category as Project['category'],
    objectives: row.objectives || '',
    timeline: row.timeline || '',
    resources: row.resources || '',
    projectLink: row.project_link || '',
    members,
    leaderId: row.leader_id || '',
    leaderEmail: row.leader_email,
    status: row.status,
    adminFeedback: row.admin_feedback || '',
    checklist,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function replaceMembers(
  projectId: string,
  members: ProjectMember[]
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error: deleteError } = await admin
    .from('project_members')
    .delete()
    .eq('project_id', projectId);
  if (deleteError) throw new Error(deleteError.message);

  if (members.length === 0) return;

  const { error } = await admin.from('project_members').insert(
    members.map((member, index) => ({
      project_id: projectId,
      user_id: member.userId || null,
      name: member.name,
      email: member.email,
      role: member.role,
      joined_at: member.joinedAt || new Date().toISOString(),
      sort_order: index,
    }))
  );
  if (error) throw new Error(error.message);
}

export async function getAllProjects(status?: string): Promise<Project[]> {
  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from('projects')
      .select(PROJECT_SELECT)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return ((data ?? []) as unknown as ProjectRow[]).map(parseProject);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取项目列表失败:', err);
    throw new Error(err.message || '获取项目列表失败');
  }
}

export async function getProjectById(id: string): Promise<Project> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('项目不存在');

    return parseProject(data as unknown as ProjectRow);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取项目失败:', err);
    throw new Error(err.message || '获取项目失败');
  }
}

export function projectHasMember(project: Project, email: string): boolean {
  const normalized = email.toLowerCase().trim();
  if (project.leaderEmail.toLowerCase().trim() === normalized) return true;
  return project.members.some(
    (member) => member.email.toLowerCase().trim() === normalized
  );
}

export async function getUserProject(userEmail: string): Promise<Project | null> {
  try {
    const email = userEmail.toLowerCase().trim();
    if (!email) return null;

    const admin = getSupabaseAdminClient();
    const { data: memberships, error: memberError } = await admin
      .from('project_members')
      .select('project_id')
      .eq('email', email);

    if (memberError) throw new Error(memberError.message);

    const projectIds = Array.from(
      new Set((memberships ?? []).map((row) => String(row.project_id)))
    );

    const filters = [`leader_email.eq.${email}`];
    if (projectIds.length > 0) {
      filters.push(`id.in.(${projectIds.join(',')})`);
    }

    const { data, error } = await admin
      .from('projects')
      .select(PROJECT_SELECT)
      .or(filters.join(','))
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? parseProject(data as unknown as ProjectRow) : null;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('检查用户项目失败:', err);
    return null;
  }
}

export async function isUserProjectLeader(userEmail: string): Promise<boolean> {
  try {
    const project = await getUserProject(userEmail);
    if (!project) return false;
    return project.leaderEmail.toLowerCase() === userEmail.toLowerCase();
  } catch {
    return false;
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('projects')
      .insert({
        team_name: input.teamName,
        title: input.title,
        description: input.description,
        category: input.category,
        objectives: input.objectives || '',
        timeline: input.timeline || '',
        resources: input.resources || '',
        project_link: input.projectLink || '',
        leader_id: input.leaderId || null,
        leader_email: input.leaderEmail.toLowerCase(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    const projectId = (data as { id: string }).id;
    const now = new Date().toISOString();
    await replaceMembers(
      projectId,
      input.members.map((member) => ({ ...member, joinedAt: now }))
    );

    return getProjectById(projectId);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建项目失败:', err);
    throw new Error(err.message || '创建项目失败');
  }
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  try {
    const admin = getSupabaseAdminClient();
    const updateData: Record<string, unknown> = {};

    if (input.teamName !== undefined) updateData.team_name = input.teamName;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.objectives !== undefined) updateData.objectives = input.objectives;
    if (input.timeline !== undefined) updateData.timeline = input.timeline;
    if (input.resources !== undefined) updateData.resources = input.resources;
    if (input.projectLink !== undefined) updateData.project_link = input.projectLink;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.adminFeedback !== undefined) {
      updateData.admin_feedback = input.adminFeedback;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await admin.from('projects').update(updateData).eq('id', id);
      if (error) throw new Error(error.message);
    }

    if (input.members !== undefined) {
      const now = new Date().toISOString();
      await replaceMembers(
        id,
        input.members.map((member) => ({ ...member, joinedAt: now }))
      );
    }

    return getProjectById(id);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新项目失败:', err);
    throw new Error(err.message || '更新项目失败');
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除项目失败:', err);
    throw new Error(err.message || '删除项目失败');
  }
}

export async function approveProject(id: string, feedback?: string): Promise<Project> {
  return updateProject(id, {
    status: 'approved',
    adminFeedback: feedback || '项目已批准',
  });
}

export async function rejectProject(id: string, feedback: string): Promise<Project> {
  return updateProject(id, {
    status: 'rejected',
    adminFeedback: feedback,
  });
}

export async function requestRevision(id: string, feedback: string): Promise<Project> {
  return updateProject(id, {
    status: 'revision',
    adminFeedback: feedback,
  });
}

export async function revertProjectToPending(id: string): Promise<Project> {
  return updateProject(id, {
    status: 'pending',
    adminFeedback: '',
  });
}

export async function getProjectChecklist(projectId: string): Promise<ProjectChecklist> {
  const project = await getProjectById(projectId);
  return (
    project.checklist || {
      checklistId: `${projectId}-checklist`,
      projectId,
      title: '项目检查清单',
      items: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  );
}

export async function replaceProjectChecklist(
  projectId: string,
  items: ChecklistItem[]
): Promise<ProjectChecklist> {
  const admin = getSupabaseAdminClient();

  const { error: deleteError } = await admin
    .from('project_checklist_items')
    .delete()
    .eq('project_id', projectId);
  if (deleteError) throw new Error(deleteError.message);

  if (items.length > 0) {
    const { error } = await admin.from('project_checklist_items').insert(
      items.map((item, index) => ({
        project_id: projectId,
        title: item.title,
        description: item.description || null,
        completed: item.completed === true,
        completed_at: item.completedAt || null,
        assignee: item.assignee || null,
        sort_order: index,
      }))
    );
    if (error) throw new Error(error.message);
  }

  const { error: touchError } = await admin
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (touchError) throw new Error(touchError.message);

  return getProjectChecklist(projectId);
}

export async function getProjectStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revision: number;
}> {
  try {
    const projects = await getAllProjects();
    return {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      approved: projects.filter(p => p.status === 'approved').length,
      rejected: projects.filter(p => p.status === 'rejected').length,
      revision: projects.filter(p => p.status === 'revision').length,
    };
  } catch {
    return { total: 0, pending: 0, approved: 0, rejected: 0, revision: 0 };
  }
}
