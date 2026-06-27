import { databases } from '@/services/appwrite';
import { ID, Query } from 'appwrite';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ADMINS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMINS_COLLECTION || '';
export async function GET() {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID
    );
    const admins = response.documents.map(doc => ({
      id: doc.$id,
      username: doc.username,
      isActive: doc.isActive,
      lastLogin: doc.lastLogin || null,
      createdAt: doc.createdAt,
    }));
    return NextResponse.json({
      success: true,
      total: response.total,
      admins,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Get admins error:', err);
    return NextResponse.json(
      { error: err.message || '获取管理员列表失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码必填' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要 6 个字符' },
        { status: 400 }
      );
    }
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      [Query.equal('username', username)]
    );
    if (existing.documents.length > 0) {
      return NextResponse.json(
        { error: '用户名已被使用' },
        { status: 409 }
      );
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();
    const adminRecord = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      ID.unique(),
      {
        username,
        passwordHash,
        isActive: true,
        userId: '', 
        createdAt: now,
        permissions: JSON.stringify(['manage_notices', 'manage_activities', 'manage_comments', 'view_analytics']),
      }
    );
    return NextResponse.json({
      success: true,
      message: '管理员创建成功',
      admin: {
        id: adminRecord.$id,
        username: adminRecord.username,
        isActive: adminRecord.isActive,
        createdAt: adminRecord.createdAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Create admin error:', err);
    return NextResponse.json(
      { error: err.message || '创建管理员失败' },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, username, isActive, newPassword } = body;
    if (!adminId) {
      return NextResponse.json(
        { error: '管理员 ID 必填' },
        { status: 400 }
      );
    }
    const admin = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminId
    );
    const updateData: Record<string, unknown> = {};
    if (username && username !== admin.username) {
      const existing = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        ADMINS_COLLECTION_ID,
        [Query.equal('username', username)]
      );
      if (existing.documents.length > 0) {
        return NextResponse.json(
          { error: '用户名已被使用' },
          { status: 409 }
        );
      }
      updateData.username = username;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: '密码至少需要 6 个字符' },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }
    const updated = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminId,
      updateData
    );
    return NextResponse.json({
      success: true,
      message: '管理员更新成功',
      admin: {
        id: updated.$id,
        username: updated.username,
        isActive: updated.isActive,
        lastLogin: updated.lastLogin || null,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Update admin error:', err);
    return NextResponse.json(
      { error: err.message || '更新管理员失败' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminId = searchParams.get('id');
    if (!adminId) {
      return NextResponse.json(
        { error: '管理员 ID 必填' },
        { status: 400 }
      );
    }
    const allAdmins = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID
    );
    if (allAdmins.total <= 1) {
      return NextResponse.json(
        { error: '不能删除最后一个管理员' },
        { status: 400 }
      );
    }
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminId
    );
    return NextResponse.json({
      success: true,
      message: '管理员删除成功',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Delete admin error:', err);
    return NextResponse.json(
      { error: err.message || '删除管理员失败' },
      { status: 500 }
    );
  }
}