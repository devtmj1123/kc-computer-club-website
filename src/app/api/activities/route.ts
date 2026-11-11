import { NextRequest, NextResponse } from 'next/server';
import { activityService, CreateActivityInput } from '@/services/activity.service';
import { requireAdminSession, getAdminSession } from '@/lib/admin-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAdminRequest = !requireAdminSession(request);
    const onlyPublished = isAdminRequest
      ? searchParams.get('onlyPublished') === 'true'
      : true;
    const visibility = isAdminRequest
      ? ((searchParams.get('visibility') as 'public' | 'all') || 'all')
      : 'public';
    const activities = await activityService.getAllActivities(onlyPublished, visibility);

    if (activities.length === 0) {
      return NextResponse.json({ success: true, total: 0, activities: [] });
    }

    // One grouped query instead of one Appwrite request per activity.
    const admin = getSupabaseAdminClient();
    const { data: signups, error: signupError } = await admin
      .from('signups')
      .select('activity_id')
      .in('activity_id', activities.map((activity) => activity.$id))
      .neq('status', 'cancelled');

    if (signupError) {
      console.error('统计报名人数失败:', signupError.message);
    }

    const counts = new Map<string, number>();
    for (const signup of signups ?? []) {
      const activityId = String(signup.activity_id);
      counts.set(activityId, (counts.get(activityId) ?? 0) + 1);
    }

    const activitiesWithCount = activities.map((activity) => ({
      ...activity,
      currentParticipants: counts.get(activity.$id) ?? 0,
    }));

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
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const session = getAdminSession(request);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

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
      status,
      coverImage,
      allowedGrades,
      visibility,
      signupFormFields,
    } = body;
    if (!title || !description || !date || !startTime || !endDate || !endTime || !location) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }
    const startDateTime = `${date}T${startTime}:00Z`;
    const endDateTime = `${endDate}T${endTime}:00Z`;
    const signupDeadlineDateTime = `${registrationDeadline || date}T${registrationDeadlineTime || '23:59'}:00Z`;
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
      signupFormFields:
        typeof signupFormFields === 'string'
          ? signupFormFields
          : JSON.stringify([]),
      organizer: typeof organizer === 'string' && organizer.trim() ? organizer : session.username,
      organizerId: session.sub,
      status: status || 'draft',
      coverImage: coverImage || undefined,
      allowedGrades:
        allowedGrades && allowedGrades.length > 0
          ? JSON.stringify(allowedGrades)
          : undefined,
      visibility: visibility || 'public',
    };
    const activity = await activityService.createActivity(input);
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
