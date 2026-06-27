import { NextRequest, NextResponse } from 'next/server';
import { activityService, CreateActivityInput } from '@/services/activity.service';
import { Client, Databases, Query } from 'appwrite';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyPublished = searchParams.get('onlyPublished') === 'true';
    const visibility = (searchParams.get('visibility') as 'public' | 'all') || 'all';
    const activities = await activityService.getAllActivities(onlyPublished, visibility);
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    const databases = new Databases(client);
    const activitiesWithCount = await Promise.all(
      activities.map(async (activity) => {
        try {
          const signupsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'signups',
            [
              Query.equal('activityId', activity.$id),
              Query.notEqual('status', 'cancelled'),
            ]
          );
          const actualCount = signupsResponse.total || 0;
          return {
            ...activity,
            currentParticipants: actualCount,
          };
        } catch (err) {
          console.warn(`Failed to count signups for activity ${activity.$id}:`, err);
          return activity;
        }
      })
    );
    return NextResponse.json({
      success: true,
      total: activitiesWithCount.length,
      activities: activitiesWithCount,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取活动列表失败:', err);
    return NextResponse.json(
      { error: err.message || '获取活动列表失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
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
      visibility,
    } = body;
    if (!title || !description || !date || !startTime || !endDate || !endTime || !location || !organizer || !organizerId) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }
    const startDateTime = `${date}T${startTime}:00Z`;
    const endDateTime = `${endDate}T${endTime}:00Z`;
    const signupDeadlineDateTime = `${registrationDeadline}T${registrationDeadlineTime || '23:59'}:00Z`;
    const input: CreateActivityInput = {
      title,
      description,
      category: category || '其他',
      startTime: startDateTime,
      endTime: endDateTime,
      location,
      maxParticipants: maxAttendees || 0,
      currentParticipants: 0,
      signupDeadline: signupDeadlineDateTime,
      signupFormFields: JSON.stringify([]),
      organizer,
      organizerId,
      status: status || 'draft',
      coverImage: coverImage || undefined,
      allowedGrades: allowedGrades && allowedGrades.length > 0 ? JSON.stringify(allowedGrades) : undefined,
      visibility: visibility || 'public',
    };
    const activity = await activityService.createActivity(input);
    if (status === 'published') {
      try {
        const userIds = ['user1', 'user2', 'user3']; 
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        for (const userId of userIds) {
          await fetch(`${appUrl}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              title: `新活动：${title}`,
              message: `${date} 在 ${location} 举行的 "${description.substring(0, 50)}..." 活动`,
              type: 'activity',
              relatedId: activity.$id,
            }),
          }).catch((err) => console.error('发送通知失败:', err));
        }
      } catch (err) {
        console.error('发送通知时出错:', err);
      }
    }
    return NextResponse.json({
      success: true,
      message: '活动创建成功',
      activity,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建活动失败:', err);
    return NextResponse.json(
      { error: err.message || '创建活动失败' },
      { status: 500 }
    );
  }
}