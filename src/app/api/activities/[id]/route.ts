import { NextRequest, NextResponse } from 'next/server';
import { activityService, UpdateActivityInput } from '@/services/activity.service';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await activityService.getActivityById(id);
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
      organizerId, 
      status,
      coverImage,
      allowedGrades,
    } = body;
    const updateData: UpdateActivityInput = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (maxAttendees !== undefined) updateData.maxParticipants = maxAttendees;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (organizerId !== undefined) updateData.organizerId = organizerId;
    if (status !== undefined) updateData.status = status as any;
    if (coverImage !== undefined) updateData.coverImage = coverImage || undefined;
    if (allowedGrades !== undefined) updateData.allowedGrades = allowedGrades && allowedGrades.length > 0 ? JSON.stringify(allowedGrades) : undefined;
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