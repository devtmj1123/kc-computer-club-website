import { databases } from '@/services/appwrite';
import { ID, Query } from 'appwrite';
import { Project, CreateProjectInput, UpdateProjectInput, ProjectMember } from '@/types';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION || 'projects';

export async function getAllProjects(status?: string): Promise<Project[]> {
  try {
    const queries = status ? [Query.equal('status', status)] : [];
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      queries
    );
    return response.documents.map(parseProject) as Project[];
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取项目列表失败:', err);
    throw new Error(err.message || '获取项目列表失败');
  }
}

export async function getProjectById(id: string): Promise<Project> {
  try {
    const project = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      id
    );
    return parseProject(project) as Project;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取项目失败:', err);
    throw new Error(err.message || '获取项目失败');
  }
}

export async function getUserProject(userEmail: string): Promise<Project | null> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      []
    );

    for (const doc of response.documents) {
      const project = parseProject(doc);

      if (project.leaderEmail === userEmail) {
        return project as Project;
      }

      if (project.members && project.members.some(m => m.email === userEmail)) {
        return project as Project;
      }
    }

    return null;
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
    return project.leaderEmail === userEmail;
  } catch {
    return false;
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const now = new Date().toISOString();

    const membersWithTimestamp: ProjectMember[] = input.members.map(m => ({
      ...m,
      joinedAt: now,
    }));

    const projectData = {
      teamName: input.teamName,
      title: input.title,
      description: input.description,
      category: input.category,
      objectives: input.objectives || '',
      timeline: input.timeline || '',
      resources: input.resources || '',
      projectLink: input.projectLink || '',
      members: JSON.stringify(membersWithTimestamp),
      leaderId: input.leaderId,
      leaderEmail: input.leaderEmail,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const project = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      ID.unique(),
      projectData
    );

    return parseProject(project) as Project;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建项目失败:', err);
    throw new Error(err.message || '创建项目失败');
  }
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  try {
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (input.teamName !== undefined) updateData.teamName = input.teamName;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.objectives !== undefined) updateData.objectives = input.objectives;
    if (input.timeline !== undefined) updateData.timeline = input.timeline;
    if (input.resources !== undefined) updateData.resources = input.resources;
    if (input.projectLink !== undefined) updateData.projectLink = input.projectLink;
    if (input.status !== undefined) updateData.status = input.status;

    if (input.adminFeedback !== undefined) {
      const currentProject = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        id
      );
      let currentTimeline = (currentProject.timeline as string) || '';
      if (currentTimeline.includes('FEEDBACK::')) {
        currentTimeline = currentTimeline.substring(0, currentTimeline.indexOf('FEEDBACK::')).trim();
      }
      if (input.adminFeedback) {
        updateData.timeline = currentTimeline + (currentTimeline ? '\n' : '') + 'FEEDBACK::' + input.adminFeedback;
      } else {
        updateData.timeline = currentTimeline;
      }
    }

    if (input.members !== undefined) {
      const now = new Date().toISOString();
      const membersWithTimestamp: ProjectMember[] = input.members.map(m => ({
        ...m,
        joinedAt: now,
      }));
      updateData.members = JSON.stringify(membersWithTimestamp);
    }

    const project = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      id,
      updateData
    );

    return parseProject(project) as Project;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新项目失败:', err);
    throw new Error(err.message || '更新项目失败');
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      id
    );
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

function parseProject(doc: Record<string, unknown>): Partial<Project> {
  let members: ProjectMember[] = [];
  if (doc.members) {
    try {
      if (typeof doc.members === 'string') {
        members = JSON.parse(doc.members as string);
      } else if (Array.isArray(doc.members)) {
        members = doc.members as ProjectMember[];
      }
    } catch {
      members = [];
    }
  }

  let checklist: any = undefined;
  if (doc.resources && typeof doc.resources === 'string' && (doc.resources as string).startsWith('CHECKLIST::')) {
    try {
      const checklistJson = (doc.resources as string).substring('CHECKLIST::'.length);
      checklist = JSON.parse(checklistJson);
    } catch {
      checklist = undefined;
    }
  }

  let adminFeedback = '';
  let actualTimeline = doc.timeline as string || '';
  if (actualTimeline.includes('FEEDBACK::')) {
    const feedbackIndex = actualTimeline.indexOf('FEEDBACK::');
    adminFeedback = actualTimeline.substring(feedbackIndex + 'FEEDBACK::'.length);
    actualTimeline = actualTimeline.substring(0, feedbackIndex).trim();
  }
  if (!adminFeedback && doc.adminFeedback) {
    adminFeedback = doc.adminFeedback as string;
  }

  return {
    projectId: doc.$id as string,
    teamName: doc.teamName as string,
    title: doc.title as string,
    description: doc.description as string,
    category: doc.category as Project['category'],
    objectives: doc.objectives as string,
    timeline: actualTimeline,
    resources: doc.resources as string,
    projectLink: doc.projectLink as string,
    members,
    checklist,
    leaderId: doc.leaderId as string,
    leaderEmail: doc.leaderEmail as string,
    status: doc.status as Project['status'],
    adminFeedback: adminFeedback,
    createdAt: doc.createdAt as string,
    updatedAt: doc.updatedAt as string,
  };
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
