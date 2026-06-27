import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ADMINS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMINS_COLLECTION || '';
export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json();
    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '请填写所有字段' },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '新密码至少需要 6 个字符' },
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
        { success: false, error: '管理员账户不存在' },
        { status: 404 }
      );
    }
    const adminRecord = adminRecords.documents[0];
    const passwordHash = adminRecord.passwordHash || adminRecord.password;
    if (!passwordHash) {
      return NextResponse.json(
        { success: false, error: '密码数据异常，请联系系统管理员' },
        { status: 500 }
      );
    }
    const isPasswordCorrect = await bcrypt.compare(currentPassword, passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, error: '当前密码不正确' },
        { status: 401 }
      );
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await serverDatabases.updateDocument(
      APPWRITE_DATABASE_ID,
      ADMINS_COLLECTION_ID,
      adminRecord.$id,
      { passwordHash: hashedNewPassword }
    );
    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('管理员修改密码失败:', err);
    return NextResponse.json(
      { success: false, error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}