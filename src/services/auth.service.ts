import { databases } from './appwrite';
import { Query } from 'appwrite';
import { StudentUser, AdminUser } from '@/contexts/AuthContext';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'kc-computer-club-2024';

export function encryptData(data: string): string {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

export function decryptData(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

export const DEFAULT_STUDENT_PASSWORD = '11111111';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function studentLogin(
  email: string,
  password: string
): Promise<StudentUser & { requirePasswordChange: boolean }> {
  const res = await fetch('/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '登录失败，请稍后重试');
  }

  const studentUser = data as StudentUser & { requirePasswordChange: boolean };

  if (typeof window !== 'undefined') {
    localStorage.setItem('studentSession', JSON.stringify(studentUser));
  }

  return studentUser;
}

export async function changeStudentPassword(
  studentId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch('/api/auth/student-change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, currentPassword, newPassword }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '修改密码失败');
  }

  if (typeof window !== 'undefined') {
    const sessionStr = localStorage.getItem('studentSession');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        session.requirePasswordChange = false;
        localStorage.setItem('studentSession', JSON.stringify(session));
      } catch {
      }
    }
  }
}

export async function studentLogout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('studentSession');
  }
  return Promise.resolve();
}

export async function getCurrentStudent(): Promise<(StudentUser & { requirePasswordChange: boolean }) | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionStr = localStorage.getItem('studentSession');
    if (!sessionStr) {
      return null;
    }

    const session = JSON.parse(sessionStr) as StudentUser & { requirePasswordChange: boolean };

    try {
      const studentRecord = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        USERS_COLLECTION_ID,
        session.id
      );

      if (!studentRecord || studentRecord.role !== 'student') {
        localStorage.removeItem('studentSession');
        return null;
      }

      return {
        id: studentRecord.$id,
        email: studentRecord.email,
        name: studentRecord.chineseName || studentRecord.name || '',
        studentId: studentRecord.studentId || '',
        chineseName: studentRecord.chineseName || '',
        englishName: studentRecord.englishName || '',
        classNameCn: studentRecord.classNameCn || '',
        classNameEn: studentRecord.classNameEn || '',
        classCode: studentRecord.classCode || '',
        createdAt: studentRecord.createdAt || studentRecord.$createdAt,
        requirePasswordChange: studentRecord.requirePasswordChange === true,
      };
    } catch {
      return session;
    }
  } catch {
    return null;
  }
}

export async function adminLogin(
  adminUsername: string,
  password: string
): Promise<AdminUser> {
  try {
    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUsername, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || '管理员登录失败');
    }

    const adminUser: AdminUser = data.admin;

    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSession', JSON.stringify(adminUser));
    }

    return adminUser;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    throw new Error(err.message || '管理员登录失败');
  }
}

export async function changeAdminPassword(
  identifier: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const response = await fetch('/api/auth/admin-change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || '修改密码失败');
    }
  } catch (error) {
    const err = error as Error & { message?: string };
    throw new Error(err.message || '修改密码失败');
  }
}

export async function adminLogout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminSession');
  }
  return Promise.resolve();
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) {
      return null;
    }

    return JSON.parse(sessionStr) as AdminUser;
  } catch {
    return null;
  }
}

export async function getAdminSessions(): Promise<
  Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
  }>
> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const now = new Date().toISOString();

  return [
    {
      id: 'session-1',
      device: userAgent.includes('Windows') ? 'Windows PC' : userAgent.includes('Mac') ? 'MacBook' : 'Device',
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Browser',
      location: '本地',
      ip: '127.0.0.1',
      lastActive: now,
      isCurrent: true,
    },
  ];
}

export async function logoutOtherSession(sessionId: string): Promise<void> {
  console.log(`已登出会话: ${sessionId}`);
}

export async function checkSession(preferredType?: 'student' | 'admin'): Promise<{
  type: 'student' | 'admin' | null;
  user: (StudentUser & { requirePasswordChange?: boolean }) | AdminUser | null;
}> {
  try {
    if (typeof window === 'undefined') {
      return { type: null, user: null };
    }

    const checkAdminFirst = preferredType === 'admin';

    if (checkAdminFirst) {
      try {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
          const adminUser = JSON.parse(adminSession) as AdminUser;
          return {
            type: 'admin',
            user: adminUser,
          };
        }
      } catch (err) {
        console.warn('Failed to restore admin session:', (err as Error).message);
        localStorage.removeItem('adminSession');
      }
    } else {
      try {
        const studentSession = localStorage.getItem('studentSession');
        if (studentSession) {
          const studentUser = JSON.parse(studentSession) as StudentUser & { requirePasswordChange: boolean };
          return {
            type: 'student',
            user: studentUser,
          };
        }
      } catch (err) {
        console.warn('Failed to restore student session:', (err as Error).message);
        localStorage.removeItem('studentSession');
      }
    }

    return { type: null, user: null };
  } catch (error) {
    console.log('checkSession error:', (error as Error).message);
    return { type: null, user: null };
  }
}

export function verifyResetToken(token: string): { userId: string; email: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const tokenData = JSON.parse(decoded);

    const { userId, email, timestamp } = tokenData;

    if (!userId || !email || !timestamp) {
      return null;
    }

    const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
    const currentTime = Date.now();
    const tokenAge = currentTime - timestamp;

    if (tokenAge > RESET_TOKEN_EXPIRY) {
      return null;
    }

    return { userId, email, timestamp };
  } catch (error) {
    console.error('令牌验证失败:', error);
    return null;
  }
}

export function generateResetToken(userId: string, email: string): string {
  const tokenData = {
    userId,
    email: email.toLowerCase(),
    timestamp: Date.now(),
  };

  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '密码重置失败');
    }

    return {
      success: true,
      message: data.message || '密码重置成功',
    };
  } catch (error) {
    console.error('重置密码失败:', error);
    throw new Error(error instanceof Error ? error.message : '密码重置失败');
  }
}
