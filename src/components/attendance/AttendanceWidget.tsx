'use client';

import { useState, useEffect } from 'react';

interface AttendanceStatus {
  isAttendanceOpen: boolean;
  session: {
    sessionTime: string;
    minutesRemaining: number;
  } | null;
  message: string;
  weekNumber: number;
  debugMode?: boolean;
  codeEnabled?: boolean;
  hasCode?: boolean;
  config?: {
    dayOfWeek: number;
    session1Start: { hour: number; minute: number };
    session1Duration: number;
    session2Start: { hour: number; minute: number };
    session2Duration: number;
  };
}

interface AttendanceWidgetProps {
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  onCheckInSuccess?: () => void;
}

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function AttendanceWidget({
  studentId = '',
  studentName = '',
  studentEmail = '',
}: AttendanceWidgetProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [requireCode, setRequireCode] = useState(false);

  const loadStudentRecords = async (weekNumber: number) => {
    if (!studentEmail) return;
    try {
      const res = await fetch(
        `/api/attendance/my-records?email=${encodeURIComponent(studentEmail)}&studentId=${encodeURIComponent(studentId)}`
      );
      const data = await res.json();
      if (data.success && data.recordsByWeek[weekNumber]) {
        const done: string[] = data.recordsByWeek[weekNumber]
          .filter((r: { status: string }) => r.status === 'present' || r.status === 'late')
          .map((r: { sessionTime: string }) => r.sessionTime);
        setCompletedSessions(done);
        if (done.length > 0) setHasCheckedIn(false);
      }
    } catch {
      // ignore record preload failures
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      setStatus(data);
      if (data.codeEnabled && data.hasCode) {
        setRequireCode(true);
      } else {
        setRequireCode(false);
      }
      setError('');
      if (studentEmail && data.weekNumber) {
        await loadStudentRecords(data.weekNumber);
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      setError('无法获取点名状态：' + (error.message || '未知错误'));
    }
  };

  const handleCheckIn = async () => {
    if (!studentId || !studentName || !studentEmail) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login?redirect=/attendance';
      }
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          studentEmail,
          verificationCode: requireCode ? verificationCode : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requireCode) {
          setRequireCode(true);
        }
        if (data.error && (data.error.includes('您已在') || data.error.includes('已完成点名'))) {
          setMessage(data.error);
          setVerificationCode('');
          const sessionMatch = (data.error as string).match(/(\d{1,2}:\d{2})/);
          if (sessionMatch) {
            setCompletedSessions((prev) => [...new Set([...prev, sessionMatch[1]])]);
          }
          setTimeout(() => {
            setMessage('');
          }, 5000);
          setIsLoading(false);
          return;
        }
        setError(data.error || '点名失败');
        setIsLoading(false);
        return;
      }

      const sessionTime: string = data.record?.sessionTime || '';
      setMessage(`点名成功！时段: ${sessionTime}`);
      if (sessionTime) setCompletedSessions((prev) => [...new Set([...prev, sessionTime])]);
      setVerificationCode('');

      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      const error = err as Error & { message?: string };
      setError('点名失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceStatus();

    const interval = setInterval(fetchAttendanceStatus, 10000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!status) {
    return (
      <div className="border border-[var(--rule-strong)] px-5 py-10 text-center">
        <span className="material-symbols-outlined animate-spin text-[22px] text-[var(--primary)]">
          hourglass_empty
        </span>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          正在读取点名状态…
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--rule-strong)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        <span>ATTENDANCE / 点名</span>
        <span className="inline-flex items-center gap-1.5 text-[var(--primary)]">
          <span className="size-1 rounded-full bg-[var(--primary)]" />
          WEEK {String(status.weekNumber).padStart(2, '0')}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              {status.isAttendanceOpen ? 'OPEN · 点名进行中' : 'CLOSED · 非点名时段'}
            </p>
            <h3 className="mt-2 font-display text-[24px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
              {status.isAttendanceOpen ? '今天，你到了吗？' : '今天不是点名日'}
            </h3>
          </div>
          <span
            className={`shrink-0 border px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] ${
              status.isAttendanceOpen
                ? 'border-[var(--primary)]/40 text-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--text-tertiary)]'
            }`}
          >
            {status.isAttendanceOpen ? 'LIVE' : 'IDLE'}
          </span>
        </div>

        {status.isAttendanceOpen ? (
          <div className="mt-5 space-y-4">
            <p className="text-[12px] leading-[1.9] text-[var(--text-secondary)]">
              请输入老师公布的验证码完成签到。签到时间以服务器记录为准。
            </p>

            {completedSessions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border border-[var(--primary)]/30 bg-[var(--primary-light)] px-3 py-2.5">
                <span className="material-symbols-outlined text-[15px] text-[var(--primary)]">
                  check_circle
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--primary)]">
                  本周已签到
                </span>
                {completedSessions.map((session) => (
                  <span
                    key={session}
                    className="border border-[var(--primary)]/40 px-1.5 py-0.5 font-mono text-[12px] text-[var(--primary)]"
                  >
                    {session}
                  </span>
                ))}
              </div>
            )}

            {requireCode && !isLoading && (
              <div>
                <label
                  htmlFor="attendance-code"
                  className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  验证码
                </label>
                <input
                  id="attendance-code"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="0000"
                  maxLength={4}
                  disabled={isLoading}
                  className="mt-1.5 h-14 w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] text-center font-mono text-[24px] tracking-[0.5em] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] disabled:opacity-60"
                />
                <p className="mt-2 font-mono text-[12px] leading-relaxed tracking-[0.04em] text-[var(--text-tertiary)]">
                  时段 1 和时段 2 各有不同验证码，请向在场老师获取。
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={isLoading || (requireCode && verificationCode.length !== 4)}
              className={`inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-[12px] font-semibold transition-colors ${
                isLoading
                  ? 'cursor-wait bg-[var(--primary)]/50 text-[var(--primary-contrast)]'
                  : requireCode && verificationCode.length !== 4
                    ? 'cursor-not-allowed border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-tertiary)]'
                    : 'bg-[var(--primary)] text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[15px]">
                    hourglass_empty
                  </span>
                  点名中…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">touch_app</span>
                  立即点名
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-5 border border-[var(--border)] px-4 py-4">
            <p className="text-[12px] leading-[1.9] text-[var(--text-secondary)]">
              {status.config
                ? `点名日：每${DAY_NAMES[status.config.dayOfWeek]}。请在点名时段内回到此页面签到。`
                : (status.message || '正在读取点名配置…')}
            </p>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-start gap-2.5 border border-[var(--primary)]/30 bg-[var(--primary-light)] px-3.5 py-2.5">
            <span className="material-symbols-outlined mt-0.5 text-[15px] text-[var(--primary)]">
              check_circle
            </span>
            <p className="text-[12px] leading-relaxed text-[var(--primary)]">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 border border-[var(--error)]/30 bg-[var(--error-light)] px-3.5 py-2.5">
            <span className="material-symbols-outlined mt-0.5 text-[15px] text-[var(--error)]">
              error
            </span>
            <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
