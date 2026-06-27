import { NextResponse } from 'next/server';
import { serverDatabases } from '@/services/appwrite-server';
import bcrypt from 'bcryptjs';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; 
const DEFAULT_STUDENT_PASSWORD = '11111111';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }
    let tokenData: any;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      tokenData = JSON.parse(decoded);
      const { userId, email, timestamp } = tokenData;
      if (!userId || !email || !timestamp) {
        throw new Error('Invalid token format');
      }
      const currentTime = Date.now();
      const tokenAge = currentTime - timestamp;
      if (tokenAge > RESET_TOKEN_EXPIRY) {
        return NextResponse.json(
          { error: '重置链接已过期。请重新申请。' },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error('令牌解析失败:', err);
      return NextResponse.json(
        { error: '无效的重置链接' },
        { status: 400 }
      );
    }
    try {
      const userRecord = await serverDatabases.getDocument(
        APPWRITE_DATABASE_ID,
        USERS_COLLECTION_ID,
        tokenData.userId
      );
      if (!userRecord || userRecord.email !== tokenData.email) {
        return NextResponse.json(
          { error: '无效的重置请求' },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error('查询用户失败:', err);
      return NextResponse.json(
        { error: '用户不存在或已被删除' },
        { status: 404 }
      );
    }
    const passwordErrors: string[] = [];
    if (newPassword.length < 6) {
      passwordErrors.push('密码至少需要 6 个字符');
    }
    if (newPassword === DEFAULT_STUDENT_PASSWORD) {
      passwordErrors.push('密码不能为默认密码');
    }
    if (!/[a-z]/.test(newPassword)) {
      passwordErrors.push('密码需要包含小写字母');
    }
    if (!/[A-Z]/.test(newPassword)) {
      passwordErrors.push('密码需要包含大写字母');
    }
    if (!/[0-9]/.test(newPassword)) {
      passwordErrors.push('密码需要包含数字');
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      passwordErrors.push('密码需要包含特殊字符 (!@#$%^&*)');
    }
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors.join('; ') },
        { status: 400 }
      );
    }
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (err) {
      console.error('密码哈希失败:', err);
      return NextResponse.json(
        { error: '密码处理失败，请稍后重试' },
        { status: 500 }
      );
    }
    try {
      await serverDatabases.updateDocument(
        APPWRITE_DATABASE_ID,
        USERS_COLLECTION_ID,
        tokenData.userId,
        {
          passwordHash: hashedPassword,
          requirePasswordChange: false,
          updatedAt: new Date().toISOString(),
        }
      );
      console.log(`密码重置成功: ${tokenData.email} (用户ID: ${tokenData.userId})`);
      return NextResponse.json({
        success: true,
        message: '密码重置成功。请使用新密码登录。',
      });
    } catch (err) {
      console.error('更新密码失败:', err);
      return NextResponse.json(
        { error: '密码更新失败，请稍后重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('重置密码 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}