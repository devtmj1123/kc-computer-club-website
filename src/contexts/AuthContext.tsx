'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  studentLogin,
  adminLogin,
  studentLogout,
  adminLogout,
  checkSession,
  changeStudentPassword,
} from '@/services/auth.service';

export interface StudentUser {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  chineseName?: string;
  englishName?: string;
  classNameCn?: string;
  classNameEn?: string;
  classCode?: string;
  createdAt: string;
  requirePasswordChange?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: 'admin';
}

export type AuthUser = StudentUser | AdminUser;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  requirePasswordChange: boolean;
  login: (email: string, password: string) => Promise<{ requirePasswordChange: boolean }>;
  adminLogin: (adminEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkExistingSession = async () => {
      if (isLoggedOut) {
        setIsLoading(false);
        return;
      }

      try {
        const isAdminPath = pathname?.startsWith('/admin');
        const preferredType: 'student' | 'admin' = isAdminPath ? 'admin' : 'student';

        const sessionInfo = await checkSession(preferredType);

        if (sessionInfo.user) {
          setUser(sessionInfo.user);

          if (sessionInfo.type === 'student' && 'requirePasswordChange' in sessionInfo.user) {
            setRequirePasswordChange(sessionInfo.user.requirePasswordChange === true);
          }

          if (sessionInfo.type === 'student') {
            localStorage.setItem('studentSession', JSON.stringify(sessionInfo.user));
          } else if (sessionInfo.type === 'admin') {
            localStorage.setItem('adminSession', JSON.stringify(sessionInfo.user));
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to check session:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, [pathname, isLoggedOut]);

  const login = async (email: string, password: string): Promise<{ requirePasswordChange: boolean }> => {
    setError(null);
    setIsLoggedOut(false);
    try {
      const studentUser = await studentLogin(email, password);
      setUser(studentUser);
      setRequirePasswordChange(studentUser.requirePasswordChange === true);
      localStorage.setItem('studentSession', JSON.stringify(studentUser));
      return { requirePasswordChange: studentUser.requirePasswordChange === true };
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      const errorMsg = error.message || '登录失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const handleAdminLogin = async (adminUsername: string, password: string) => {
    setError(null);
    setIsLoggedOut(false);
    try {
      const adminUser = await adminLogin(adminUsername, password);
      setUser(adminUser);
      setRequirePasswordChange(false);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      const errorMsg = error.message || '管理员登录失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !('studentId' in user)) {
      throw new Error('请先登录');
    }

    try {
      await changeStudentPassword(user.id, currentPassword, newPassword);
      setRequirePasswordChange(false);

      const updatedUser = { ...user, requirePasswordChange: false };
      setUser(updatedUser);
      localStorage.setItem('studentSession', JSON.stringify(updatedUser));
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      throw new Error(error.message || '修改密码失败');
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoggedOut(true);
    try {
      if (user && 'role' in user && user.role === 'admin') {
        await adminLogout();
        localStorage.removeItem('adminSession');
      } else {
        await studentLogout();
        localStorage.removeItem('studentSession');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setRequirePasswordChange(false);
    }
  };

  const value = {
    user,
    isLoading,
    isStudent: user ? !('role' in user) : false,
    isAdmin: user ? 'role' in user && user.role === 'admin' : false,
    requirePasswordChange,
    login,
    adminLogin: handleAdminLogin,
    logout,
    changePassword: handleChangePassword,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
