import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '@/services/activity.service';
import { getSessionStudent } from '@/lib/student-identity';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyPublicFormToken } from '@/lib/recaptcha';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupRequestBody {
  activityId?: unknown;
  fullName?: unknown;
  email?: unknown;
  studentId?: unknown;
  grade?: unknown;
  phone?: unknown;
  additionalInfo?: unknown;
  recaptchaToken?: unknown;
}

function readString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupRequestBody;

    const activityId = readString(body.activityId, 64);
    const fullName = readString(body.fullName, 100);
    const email = readString(body.email, 255).toLowerCase();
    const studentId = readString(body.studentId, 50);
    const grade = readString(body.grade, 50);
    const phone = readString(body.phone, 30);
    const additionalInfo = readString(body.additionalInfo, 1000);

    if (!activityId || !fullName || !email || !grade || !phone) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const remoteIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const captchaOk = await verifyPublicFormToken(
      body.recaptchaToken,
      remoteIp
    );
    if (!captchaOk) {
      return NextResponse.json(
        { success: false, error: '人机验证失败，请刷新后重试' },
        { status: 400 }
      );
    }

    let activity;
    try {
      activity = await activityService.getActivityById(activityId);
    } catch {
      return NextResponse.json(
        { success: false, error: '活动不存在' },
        { status: 404 }
      );
    }

    if (activity.status !== 'published') {
      return NextResponse.json(
        { success: false, error: '此活动暂不开放报名' },
        { status: 400 }
      );
    }

    const deadline = new Date(activity.signupDeadline).getTime();
    if (Number.isFinite(deadline) && deadline < Date.now()) {
      return NextResponse.json(
        { success: false, error: '此活动报名已截止' },
        { status: 400 }
      );
    }

    const student = await getSessionStudent(request);

    if (activity.visibility === 'internal') {
      if (!student) {
        return NextResponse.json(
          { success: false, error: '此活动仅限登录用户报名' },
          { status: 401 }
        );
      }
      if (student.email !== email) {
        return NextResponse.json(
          { success: false, error: '请使用当前登录账号的邮箱报名' },
          { status: 403 }
        );
      }
    }

    const linkedUserId = student && student.email === email ? student.id : null;

    if (
      (activity.maxParticipants ?? 0) > 0 &&
      activity.currentParticipants >= (activity.maxParticipants ?? 0)
    ) {
      return NextResponse.json(
        { success: false, error: '此活动报名人数已满' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: existing, error: existingError } = await admin
      .from('signups')
      .select('id')
      .eq('activity_id', activityId)
      .eq('email', email)
      .limit(1);

    if (existingError) {
      console.error('查询报名记录失败:', existingError.message);
      return NextResponse.json(
        { success: false, error: '报名失败，请稍后重试' },
        { status: 500 }
      );
    }
    if ((existing ?? []).length > 0) {
      return NextResponse.json(
        { success: false, error: '您已经报名过此活动' },
        { status: 400 }
      );
    }

    const { data: signup, error: insertError } = await admin
      .from('signups')
      .insert({
        activity_id: activityId,
        user_id: linkedUserId,
        full_name: fullName,
        email,
        phone,
        student_no: studentId || null,
        grade,
        additional_info: additionalInfo || null,
        form_data: {
          fullName,
          studentId,
          grade,
          additionalInfo,
          userId: linkedUserId,
        },
        status: 'pending',
        notes: '',
      })
      .select('id, status')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: '您已经报名过此活动' },
          { status: 400 }
        );
      }
      console.error('创建报名失败:', insertError.message);
      return NextResponse.json(
        { success: false, error: '报名失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signup,
    });
  } catch (error) {
    console.error('Failed to create signup:', error);
    return NextResponse.json(
      { success: false, error: '报名失败，请稍后重试' },
      { status: 500 }
    );
  }
}
