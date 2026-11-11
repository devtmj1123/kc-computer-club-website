'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceRecord {
  $id: string;
  studentName: string;
  studentEmail: string;
  checkInTime: string;
  sessionTime: string;
  weekNumber: number;
  status: 'present' | 'absent' | 'late';
}

interface RecordsByWeek {
  [key: number]: AttendanceRecord[];
}

export default function StudentAttendanceRecords() {
  const { user, isLoading: authLoading } = useAuth();
  const [recordsByWeek, setRecordsByWeek] = useState<RecordsByWeek>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setError('请先登录');
      setIsLoading(false);
      return;
    }

    setError('');

    const email = user.email || (user as { username?: string }).username;
    if (!email) {
      setError('用户信息不完整，请重新登录');
      setIsLoading(false);
      return;
    }

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/attendance/my-records?email=${encodeURIComponent(email)}&studentId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json();

        if (response.ok) {
          setRecordsByWeek(data.recordsByWeek || {});
          setError('');
        } else {
          setError(data.error || '获取记录失败');
        }
      } catch (err) {
        const error = err as Error & { message?: string };
        setError('获取记录失败：' + (error.message || '未知错误'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [user, authLoading]);

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleDateString('zh-CN');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return '出席';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺席';
      default:
        return '未知';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="border border-[var(--rule-strong)] px-5 py-10 text-center">
        <span className="material-symbols-outlined animate-spin text-[22px] text-[var(--primary)]">
          hourglass_empty
        </span>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          正在读取考勤记录…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
      </div>
    );
  }

  const weeks = Object.keys(recordsByWeek)
    .map(Number)
    .sort((a, b) => b - a);

  if (weeks.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] px-4 py-10 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          暂无签到记录
        </p>
        <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
          完成第一次社团点名后，记录会显示在这里。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {weeks.map((weekNumber) => (
        <section key={weekNumber}>
          <div className="flex items-center justify-between border-b border-[var(--rule-strong)] pb-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                WEEK {String(weekNumber).padStart(2, '0')}
              </span>
              <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                第 {weekNumber} 周
              </h3>
            </div>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              共 {recordsByWeek[weekNumber]?.length || 0} 次
            </span>
          </div>

          <div>
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_72px] gap-3 border-b border-[var(--border)] px-1 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <span>签到时间</span>
              <span>场次</span>
              <span className="text-right">状态</span>
            </div>

            {recordsByWeek[weekNumber]?.map((record) => (
              <div
                key={record.$id}
                className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_72px] items-center gap-3 border-b border-[var(--border)] px-1 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[12px] tracking-[0.02em] text-[var(--foreground)]">
                    {formatDate(record.checkInTime)}
                  </p>
                  <p className="mt-0.5 font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                    {formatTime(record.checkInTime)}
                  </p>
                </div>

                <p className="text-[12px] text-[var(--text-secondary)]">
                  {record.sessionTime === '15:20'
                    ? '下午 3:15–3:30'
                    : record.sessionTime === '16:35'
                      ? '下午 4:30–4:45'
                      : record.sessionTime}
                </p>

                <div className="flex justify-end">
                  <span
                    className={`border px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.06em] ${
                      record.status === 'present'
                        ? 'border-[var(--primary)]/40 text-[var(--primary)]'
                        : record.status === 'late'
                          ? 'border-[var(--warning)]/40 text-[var(--warning)]'
                          : record.status === 'absent'
                            ? 'border-[var(--error)]/40 text-[var(--error)]'
                            : 'border-[var(--border)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    {getStatusLabel(record.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
