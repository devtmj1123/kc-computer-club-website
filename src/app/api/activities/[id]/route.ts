import { NextRequest, NextResponse } from 'next/server';
import { activityService, UpdateActivityInput } from '@/services/activity.service';
import { requireAdminSession } from '@/lib/admin-session';
import { getSessionStudent } from '@/lib/student-identity';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await activityService.getActivityById(id);

    const isAdmin = requireAdminSession(request) === null;
    const publicStatuses = new Set(['published', 'ongoing', 'completed']);
    if (!publicStatuses.has(activity.status) && !isAdmin) {
      return NextResponse.json(
        { error: '活动不存在' },
        { status: 404 }
      );
    }

    if (activity.visibility === 'internal' && !isAdmin) {
      const student = await getSessionStudent(request);
      if (!student) {
        return NextResponse.json(
          { error: '此活动仅限登录成员查看' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取活动失败:', err);
    return NextResponse.json(
      { error: err.message || '获取活动失败' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      title, 
      description, 
      category, 
      date, 
      startTime, 
      endDate, 
      endTime, 
      location, 
      maxAttendees,
      registrationDeadline, 
      registrationDeadlineTime, 
      organizer, 
      status,
      coverImage,
      allowedGrades,
      visibility,
      signupFormFields,
    } = body;
    const updateData: UpdateActivityInput = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (maxAttendees !== undefined) updateData.maxParticipants = maxAttendees;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (status !== undefined) {
      updateData.status = status as UpdateActivityInput['status'];
    }
    if (coverImage !== undefined) updateData.coverImage = coverImage || undefined;
    if (allowedGrades !== undefined) {
      updateData.allowedGrades = JSON.stringify(
        Array.isArray(allowedGrades) ? allowedGrades : []
      );
    }
    if (visibility !== undefined) {
      updateData.visibility = visibility === 'internal' ? 'internal' : 'public';
    }
    if (signupFormFields !== undefined) {
      updateData.signupFormFields =
        typeof signupFormFields === 'string'
          ? signupFormFields
          : JSON.stringify(signupFormFields);
    }
    if (date && startTime) {
      updateData.startTime = `${date}T${startTime}:00Z`;
    }
    if (endDate && endTime) {
      updateData.endTime = `${endDate}T${endTime}:00Z`;
    }
    if (registrationDeadline && registrationDeadlineTime) {
      updateData.signupDeadline = `${registrationDeadline}T${registrationDeadlineTime}:00Z`;
    }
    const activity = await activityService.updateActivity(id, updateData);
    return NextResponse.json({
      success: true,
      message: '活动更新成功',
      activity,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新活动失败:', err);
    return NextResponse.json(
      { error: err.message || '更新活动失败' },
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
    await activityService.deleteActivity(id);
    return NextResponse.json({
      success: true,
      message: '活动删除成功',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除活动失败:', err);
    return NextResponse.json(
      { error: err.message || '删除活动失败' },
      { status: 500 }
    );
  }
}