import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ADMINS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMINS_COLLECTION || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }
    const adminRecords = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      [Query.equal('username', username)]
    );
    if (adminRecords.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    const adminRecord = adminRecords.documents[0];
    if (!adminRecord.isActive) {
      return NextResponse.json(
        { success: false, error: '此账号已被禁用' },
        { status: 403 }
      );
    }
    const passwordHash = adminRecord.passwordHash || adminRecord.password;
    if (!passwordHash) {
      return NextResponse.json(
        { success: false, error: '密码数据异常，请联系系统管理员' },
        { status: 500 }
      );
    }
    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    try {
      await serverDatabases.updateDocument(
        APPWRITE_DATABASE_ID,
        ADMINS_COLLECTION_ID,
        adminRecord.$id,
        { lastLogin: new Date().toISOString() }
      );
    } catch {
    }
    let adminName = username;
    if (adminRecord.userId) {
      try {
        const userRecord = await serverDatabases.getDocument(
          APPWRITE_DATABASE_ID,
          USERS_COLLECTION_ID,
          adminRecord.userId
        );
        adminName = userRecord.name || username;
      } catch {
        adminName = username;
      }
    }
    return NextResponse.json({
      success: true,
      admin: {
        id: adminRecord.$id,
        email: username + '@admin.local',
        name: adminName,
        username: adminRecord.username,
        role: 'admin',
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('管理员登录失败:', err);
    return NextResponse.json(
      { success: false, error: '登录服务异常，请稍后重试' },
      { status: 500 }
    );
  }
}