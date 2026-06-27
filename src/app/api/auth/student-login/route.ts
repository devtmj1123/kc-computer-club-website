import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: '请提供邮箱和密码' }, { status: 400 });
    }
    const studentRecords = await serverDatabases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('email', email.toLowerCase().trim())]
    );
    if (studentRecords.documents.length === 0) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }
    const doc = studentRecords.documents[0];
    if (doc.role !== 'student') {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }
    if (!doc.passwordHash) {
      return NextResponse.json({ error: '账户未设置密码，请联系管理员' }, { status: 401 });
    }
    const passwordMatch = await bcrypt.compare(password, doc.passwordHash as string);
    if (!passwordMatch) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }
    try {
      await serverDatabases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, doc.$id, {
        lastLogin: new Date().toISOString(),
      });
    } catch {
    }
    return NextResponse.json({
      id: doc.$id,
      email: doc.email,
      name: doc.chineseName || doc.name || '',
      studentId: doc.studentId || '',
      chineseName: doc.chineseName || '',
      englishName: doc.englishName || '',
      classNameCn: doc.classNameCn || '',
      classNameEn: doc.classNameEn || '',
      classCode: doc.classCode || '',
      createdAt: doc.createdAt || doc.$createdAt,
      requirePasswordChange: doc.requirePasswordChange === true,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || '登录失败，请稍后重试' }, { status: 500 });
  }
}