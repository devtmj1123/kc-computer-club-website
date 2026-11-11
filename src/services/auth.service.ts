import type { StudentUser, AdminUser } from '@/contexts/AuthContext';

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
    // UI cache only. Every request is authorised by the httpOnly session
    // cookie, never by this localStorage value.
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
        // Ignore a corrupt UI cache.
      }
    }
  }
}

export async function studentLogout(): Promise<void> {
  try {
    await fetch('/api/auth/student-logout', { method: 'POST' });
  } catch (error) {
    console.error('Failed to clear student session cookie:', error);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('studentSession');
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
      body: JSON.stringify({
        username: identifier,
        currentPassword,
        newPassword,
      }),
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

  try {
    await fetch('/api/auth/admin-logout', { method: 'POST' });
  } catch (error) {
    console.error('Failed to clear admin session cookie:', error);
  }
}

async function fetchSessionUser(
  type: 'student' | 'admin'
): Promise<(StudentUser & { requirePasswordChange?: boolean }) | AdminUser | null> {
  try {
    const response = await fetch(`/api/auth/${type}-session`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function checkSession(preferredType?: 'student' | 'admin'): Promise<{
  type: 'student' | 'admin' | null;
  user: (StudentUser & { requirePasswordChange?: boolean }) | AdminUser | null;
}> {
  if (typeof window === 'undefined') {
    return { type: null, user: null };
  }

  const order: Array<'student' | 'admin'> =
    preferredType === 'admin' ? ['admin', 'student'] : ['student', 'admin'];

  for (const type of order) {
    const user = await fetchSessionUser(type);
    if (user) {
      return { type, user };
    }
  }

  return { type: null, user: null };
}
