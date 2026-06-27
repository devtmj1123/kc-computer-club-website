import { databases } from '@/services/appwrite';
import { ID } from 'appwrite';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ADMINS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMINS_COLLECTION || '';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6个字符' },
        { status: 400 }
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
        username: 'admin',
        passwordHash,
        isActive: true,
        userId: '', 
        createdAt: now,
        permissions: JSON.stringify(['manage_notices', 'manage_activities', 'manage_comments', 'view_analytics']),
      }
    );
    return NextResponse.json({
      success: true,
      message: '管理员账户创建成功',
      admin: {
        id: adminRecord.$id,
        username: adminRecord.username,
        createdAt: adminRecord.createdAt,
      },
      credentials: {
        username: 'admin',
        password: password,
      },
      note: '请妥善保管初始密码。管理员可以稍后通过修改密码页面更改密码。',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string; code?: number };
    if (err.message?.includes('duplicate') || err.message?.includes('already')) {
      return NextResponse.json(
        { 
          error: '管理员账户已存在',
          hint: '如果需要重置密码，请使用修改密码功能。如需删除此账户，请在 Appwrite 控制台中手动删除。'
        },
        { status: 409 }
      );
    }
    console.error('管理员创建错误:', err);
    return NextResponse.json(
      { 
        error: err.message || '创建管理员账户失败',
        code: err.code
      },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const { documents } = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID
    );
    return NextResponse.json({
      adminExists: documents.length > 0,
      adminCount: documents.length,
      admins: documents.map(doc => ({
        id: doc.$id,
        username: doc.username,
        isActive: doc.isActive,
        createdAt: doc.createdAt,
        lastLogin: doc.lastLogin || null,
      })),
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('检查管理员错误:', err);
    return NextResponse.json(
      { error: err.message || '检查管理员失败' },
      { status: 500 }
    );
  }
}