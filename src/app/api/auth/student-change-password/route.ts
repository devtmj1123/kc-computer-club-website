import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const DEFAULT_STUDENT_PASSWORD = '11111111';
export async function POST(req: NextRequest) {
  try {
    const { studentId, currentPassword, newPassword } = await req.json();
    if (!studentId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少需要6个字符' }, { status: 400 });
    }
    if (newPassword === DEFAULT_STUDENT_PASSWORD) {
      return NextResponse.json({ error: '新密码不能为默认密码' }, { status: 400 });
    }
    const doc = await serverDatabases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, studentId);
    if (!doc.passwordHash) {
      return NextResponse.json({ error: '账户密码数据异常' }, { status: 400 });
    }
    if (doc.studentId && newPassword === doc.studentId) {
      return NextResponse.json({ error: '新密码不能与学号相同' }, { status: 400 });
    }
    const isPasswordCorrect = await bcrypt.compare(currentPassword, doc.passwordHash as string);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: '当前密码不正确' }, { status: 401 });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, studentId, {
      passwordHash: hashedNewPassword,
      requirePasswordChange: false,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || '修改密码失败' }, { status: 500 });
  }
}