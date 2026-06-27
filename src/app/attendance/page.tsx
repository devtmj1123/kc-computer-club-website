'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import AttendanceWidget from '@/components/attendance/AttendanceWidget';
import StudentAttendanceRecords from '@/components/attendance/StudentAttendanceRecords';
interface AttendanceRecord {
  id: string;
  sessionTitle: string;
  location: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
}
interface AttendanceConfig {
  dayOfWeek: number;
  session1Start: { hour: number; minute: number };
  session1Duration: number;
  session2Start: { hour: number; minute: number };
  session2Duration: number;
}
export default function AttendancePage() {
  const { user, isStudent, isLoading: authLoading } = useAuth();
  const [showDebugButton, setShowDebugButton] = useState(false);
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfig | null>(null);
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/attendance');
        const data = await response.json();
        if (data.config) {
          setAttendanceConfig(data.config);
        }
      } catch (error) {
        console.error('获取点名配置失败:', error);
      }
    };
    fetchConfig();
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setShowDebugButton(true);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebugButton(true);
        console.log('🐛 调试按钮已启用');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const formatAttendanceTime = () => {
    if (!attendanceConfig) {
      return '加载中...';
    }
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayName = dayNames[attendanceConfig.dayOfWeek];
    const s1EndHour =
      attendanceConfig.session1Start.hour +
      Math.floor((attendanceConfig.session1Start.minute + attendanceConfig.session1Duration) / 60);
    const s1EndMinute =
      (attendanceConfig.session1Start.minute + attendanceConfig.session1Duration) % 60;
    const s2EndHour =
      attendanceConfig.session2Start.hour +
      Math.floor((attendanceConfig.session2Start.minute + attendanceConfig.session2Duration) / 60);
    const s2EndMinute =
      (attendanceConfig.session2Start.minute + attendanceConfig.session2Duration) % 60;
    const s1Start = `${attendanceConfig.session1Start.hour}:${String(attendanceConfig.session1Start.minute).padStart(2, '0')}`;
    const s1End = `${s1EndHour}:${String(s1EndMinute).padStart(2, '0')}`;
    const s2Start = `${attendanceConfig.session2Start.hour}:${String(attendanceConfig.session2Start.minute).padStart(2, '0')}`;
    const s2End = `${s2EndHour}:${String(s2EndMinute).padStart(2, '0')}`;
    return `每${dayName} ${s1Start}-${s1End} 和 ${s2Start}-${s2End}`;
  };
  const statusLabels: Record<string, string> = {
    present: '出席',
    absent: '缺席',
    late: '迟到',
  };
  const statusColors: Record<string, string> = {
    present: 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/30',
    absent: 'bg-[#2a3c34] text-[#8a9e94] border border-[#3a4c44]',
    late: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  };
  if (authLoading) {
    return (
      <StudentLayout>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-[#13ec80] animate-spin">
              sync
            </span>
            <p className="text-[#8a9e94] mt-4">加载中...</p>
          </div>
        </main>
      </StudentLayout>
    );
  }
  if (!user) {
    return (
      <StudentLayout>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-[#13ec80] mb-4">login</span>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">请先登录</h2>
            <p className="text-[var(--text-secondary)] mb-6">您需要登录学生账号才能进行点名</p>
            <Link
              href="/auth/login?redirect=/attendance"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#13ec80] text-[#102219] font-semibold rounded-xl hover:bg-[#0fd673] transition-all"
            >
              <span className="material-symbols-outlined">login</span>
              前往登录
            </Link>
          </div>
        </main>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <main className="flex-1 flex flex-col items-center p-4 py-8 lg:p-10">
        <div className="w-full max-w-2xl flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">社团点名</h1>
            <p className="text-[var(--text-secondary)]">
              {user ? `欢迎，${user.name}` : '请在规定时间内完成点名'}
            </p>
          </div>
          <AttendanceWidget
            studentId={(() => {
              const match = user?.email?.match(/^(\d+)@/);
              return match ? match[1] : user?.id || '';
            })()}
            studentName={user?.name || ''}
            studentEmail={user?.email || ''}
            showDebugButton={showDebugButton || !isStudent}
            onCheckInSuccess={() => {
              console.log('点名成功');
            }}
          />
          <div className="mt-8">
            <StudentAttendanceRecords />
          </div>
        </div>
        <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center mt-8">
          <p className="text-[var(--text-secondary)] text-sm">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            点名时间：{formatAttendanceTime()}
          </p>
        </div>
      </main>
    </StudentLayout>
  );
}