import { databases } from '@/services/appwrite';
import { NextRequest, NextResponse } from 'next/server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ADMINS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMINS_COLLECTION || '';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adminId } = await params;
    const admin = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminId
    );
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.$id,
        username: admin.username,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin || null,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取管理员错误:', err);
    return NextResponse.json(
      { error: err.message || '获取管理员失败' },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adminId } = await params;
    const body = await request.json();
    const { isActive } = body;
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive 必须是布尔值' },
        { status: 400 }
      );
    }
    const updatedAdmin = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminId,
      { isActive }
    );
    return NextResponse.json({
      success: true,
      message: '管理员信息更新成功',
      admin: {
        id: updatedAdmin.$id,
        username: updatedAdmin.username,
        isActive: updatedAdmin.isActive,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新管理员错误:', err);
    return NextResponse.json(
      { error: err.message || '更新失败' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adminId } = await params;
    const admin = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminId
    );
    const allAdmins = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID
    );
    if (allAdmins.documents.length === 1) {
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
      message: `管理员 ${admin.username} 已删除`,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除管理员错误:', err);
    return NextResponse.json(
      { error: err.message || '删除失败' },
      { status: 500 }
    );
  }
}