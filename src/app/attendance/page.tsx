'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/contexts/AuthContext';
import AttendanceWidget from '@/components/attendance/AttendanceWidget';
import StudentAttendanceRecords from '@/components/attendance/StudentAttendanceRecords';

interface AttendanceConfig {
  dayOfWeek: number;
  session1Start: { hour: number; minute: number };
  session1Duration: number;
  session2Start: { hour: number; minute: number };
  session2Duration: number;
}

export default function AttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
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

  const formatAttendanceTime = () => {
    if (!attendanceConfig) {
      return '加载中…';
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
    const s1Start = `${attendanceConfig.session1Start.hour}:${String(
      attendanceConfig.session1Start.minute
    ).padStart(2, '0')}`;
    const s1End = `${s1EndHour}:${String(s1EndMinute).padStart(2, '0')}`;
    const s2Start = `${attendanceConfig.session2Start.hour}:${String(
      attendanceConfig.session2Start.minute
    ).padStart(2, '0')}`;
    const s2End = `${s2EndHour}:${String(s2EndMinute).padStart(2, '0')}`;
    return `每${dayName} ${s1Start}–${s1End} 和 ${s2Start}–${s2End}`;
  };

  if (authLoading) {
    return (
      <StudentLayout>
        <main className="flex items-center justify-center py-32">
          <Loading size="lg" text="加载签到信息…" />
        </main>
      </StudentLayout>
    );
  }

  if (!user) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[1000px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">ATTENDANCE · 签到</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            请先登录。
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            你需要登录学生账号才能进行社团点名与查看考勤记录。
          </p>
          <Link
            href="/auth/login?redirect=/attendance"
            className="mt-8 inline-flex items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="material-symbols-outlined text-[15px]">login</span>
            前往登录
          </Link>
        </main>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">签到</span>
        </nav>

        <header className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">ATTENDANCE · 社团点名</div>
            <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--foreground)]">
              今天，你到了吗？
            </h1>
            <p className="mt-4 max-w-xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
              欢迎，{user.name}。请在规定时间内完成签到，并在下方查看个人考勤记录。
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              SESSION TIME
            </p>
            <p className="mt-1.5 font-mono text-[12px] leading-relaxed tracking-[0.02em] text-[var(--text-secondary)]">
              {formatAttendanceTime()}
            </p>
          </div>
        </header>

        <section className="mt-8">
          <AttendanceWidget
            studentId={(() => {
              const match = user?.email?.match(/^(\d+)@/);
              return match ? match[1] : user?.id || '';
            })()}
            studentName={user?.name || ''}
            studentEmail={user?.email || ''}
          />
        </section>

        <section className="mt-12">
          <div className="flex items-baseline gap-4 border-b border-[var(--rule-strong)] pb-4">
            <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
              01
            </span>
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
              我的考勤记录
            </h2>
            <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              RECORDS
            </span>
          </div>
          <div className="mt-6">
            <StudentAttendanceRecords />
          </div>
        </section>

        <p className="mt-8 flex items-start gap-2 border border-[var(--border)] px-4 py-3 font-mono text-[12px] leading-relaxed tracking-[0.02em] text-[var(--text-tertiary)]">
          <span className="material-symbols-outlined text-[14px]">info</span>
          点名时间：{formatAttendanceTime()}。如考勤记录有误，请联系社团管理员。
        </p>
      </main>
    </StudentLayout>
  );
}
