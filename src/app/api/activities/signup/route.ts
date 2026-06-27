import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query, ID } from 'appwrite';
import { activityService } from '@/services/activity.service';
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const SIGNUPS_COLLECTION = 'signups';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      activityId,
      fullName,
      email,
      studentId,
      grade,
      phone,
      additionalInfo,
      userId,
    } = body;
    if (!activityId || !fullName || !email || !grade || !phone) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
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
    if (activity.visibility === 'internal' && !userId) {
      return NextResponse.json(
        { success: false, error: '此活动仅限登录用户报名' },
        { status: 401 }
      );
    }
    if (activity.maxParticipants && activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants) {
      return NextResponse.json(
        { success: false, error: '此活动报名人数已满' },
        { status: 400 }
      );
    }
    try {
      const existingSignups = await databases.listDocuments(
        DATABASE_ID,
        SIGNUPS_COLLECTION,
        [
          Query.equal('activityId', activityId),
          Query.equal('email', email),
        ]
      );
      if (existingSignups.documents.length > 0) {
        return NextResponse.json(
          { success: false, error: '您已经报名过此活动' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Failed to check existing signups:', error);
    }
    const formData = {
      fullName,
      studentId: studentId || '',
      grade,
      additionalInfo: additionalInfo || '',
      userId: userId || null,
    };
    const now = new Date().toISOString();
    const signup = await databases.createDocument(
      DATABASE_ID,
      SIGNUPS_COLLECTION,
      ID.unique(),
      {
        activityId,
        formData: JSON.stringify(formData),
        email,
        phone,
        status: 'pending',
        notes: '',
        createdAt: now,
        updatedAt: now,
      }
    );
    try {
      await activityService.incrementRegisteredCount(activityId);
    } catch (error) {
      console.error('Failed to increment participant count:', error);
    }
    return NextResponse.json({
      success: true,
      signup: {
        id: signup.$id,
        activityId: signup.activityId,
        email: signup.email,
        status: signup.status,
        createdAt: signup.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to create signup:', error);
    return NextResponse.json(
      { success: false, error: '报名失败，请稍后重试' },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const queries: ReturnType<typeof Query.equal>[] = [];
    if (activityId) {
      queries.push(Query.equal('activityId', activityId));
    }
    queries.push(Query.orderDesc('createdAt'));
    const response = await databases.listDocuments(
      DATABASE_ID,
      SIGNUPS_COLLECTION,
      queries
    );
    const signups = response.documents.map((doc) => ({
      id: doc.$id,
      activityId: doc.activityId,
      email: doc.email,
      phone: doc.phone,
      formData: doc.formData ? JSON.parse(doc.formData) : {},
      status: doc.status,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
    return NextResponse.json({
      success: true,
      signups,
      total: response.total,
    });
  } catch (error) {
    console.error('Failed to fetch signups:', error);
    return NextResponse.json(
      { success: false, error: '获取报名列表失败' },
      { status: 500 }
    );
  }
}