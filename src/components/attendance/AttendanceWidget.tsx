'use client';

import React, { useState, useEffect } from 'react';

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
  showDebugButton?: boolean;
}

export default function AttendanceWidget({
  studentId = '',
  studentName = '',
  studentEmail = '',
  onCheckInSuccess,
  showDebugButton = false,
}: AttendanceWidgetProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [requireCode, setRequireCode] = useState(false);

  const loadStudentRecords = async (weekNumber: number) => {
    if (!studentEmail) return;
    try {
      const res = await fetch(`/api/attendance/my-records?email=${encodeURIComponent(studentEmail)}`);
      const data = await res.json();
      if (data.success && data.recordsByWeek[weekNumber]) {
        const done: string[] = data.recordsByWeek[weekNumber]
          .filter((r: { status: string }) => r.status === 'present' || r.status === 'late')
          .map((r: { sessionTime: string }) => r.sessionTime);
        setCompletedSessions(done);
        if (done.length > 0) setHasCheckedIn(false);
      }
    } catch {
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      setStatus(data);
      setDebugMode(data.debugMode || false);
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

  const toggleDebugMode = async () => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-debug',
          enabled: !debugMode,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setDebugMode(data.debugMode);
        setMessage(data.message);
        await fetchAttendanceStatus();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      setError('切换调试模式失败：' + (error.message || '未知错误'));
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
            setCompletedSessions(prev => [...new Set([...prev, sessionMatch[1]])]);
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
      if (sessionTime) setCompletedSessions(prev => [...new Set([...prev, sessionTime])]);
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
  }, []);

  if (!status) {
    return (
      <div className="bg-[var(--nm-bg)] shadow-[var(--nm-raised)] rounded-[28px] p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-3 text-[var(--text-secondary)]">加载中...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-[28px] transition-all duration-300 overflow-hidden shadow-[var(--nm-raised-lg)] ${
      status.isAttendanceOpen
        ? 'bg-[linear-to-br] from-[var(--nm-bg)] to-primary/10'
        : 'bg-[var(--nm-bg)]'
    }`}>
      <div className={`h-1 w-full ${status.isAttendanceOpen ? 'bg-primary' : 'bg-[var(--surface-hover)]'}`}></div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
            <span className="material-symbols-outlined text-primary">assignment</span>
            点名系统
            {debugMode && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                调试模式
              </span>
            )}
          </h3>
          <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
            第 {status.weekNumber} 周
          </span>
        </div>

        <div className="space-y-4">
          {status.isAttendanceOpen ? (
            <>
              <div className="bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] rounded-2xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">today</span>
                <div>
                  <p className="text-[var(--foreground)] font-bold">今天是点名日</p>
                  <p className="text-[var(--text-secondary)] text-sm">请输入老师公布的验证码完成签到</p>
                </div>
              </div>

              {completedSessions.length > 0 && (
                <div className="bg-primary/10 shadow-[var(--nm-inset-sm)] rounded-2xl p-3 flex flex-wrap gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span className="text-primary text-sm font-medium">本周已签到：</span>
                  {completedSessions.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-mono">{s}</span>
                  ))}
                </div>
              )}

              {requireCode && !isLoading && (
                <div className="bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-amber-400">pin</span>
                    <p className="text-amber-400 font-medium">请输入验证码</p>
                  </div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="输入4位验证码"
                    maxLength={4}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[var(--nm-bg)] shadow-[var(--nm-inset)] rounded-2xl text-[var(--foreground)] text-center text-2xl font-mono tracking-widest placeholder:text-[var(--text-secondary)] focus:outline-none disabled:opacity-60"
                  />
                  <p className="text-[var(--text-secondary)] text-xs mt-2 text-center">
                    时段1 和 时段2 各有不同验证码，请向在场老师获取
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckIn}
                disabled={isLoading || (requireCode && verificationCode.length !== 4)}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-[var(--nm-raised-sm)] ${
                  isLoading
                    ? 'bg-primary/50 text-[var(--surface)] cursor-wait'
                    : (requireCode && verificationCode.length !== 4)
                    ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover text-[var(--surface)] hover:shadow-[0_0_24px_rgba(19,236,128,0.45)] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">hourglass_bottom</span>
                    点名中...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">touch_app</span>
                    立即点名
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] rounded-2xl p-5 text-center">
              <span className="material-symbols-outlined text-[var(--text-secondary)] text-4xl mb-3">event_busy</span>
              <p className="text-[var(--foreground)] font-medium mb-2">今天不是点名日</p>
              <div className="text-[var(--text-secondary)] text-sm space-y-1">
                {status.config ? (
                  <p>点名日：每{['周日', '周一', '周二', '周三', '周四', '周五', '周六'][status.config.dayOfWeek]}</p>
                ) : (
                  <p>加载点名配置中...</p>
                )}
              </div>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 shadow-[var(--nm-inset-sm)] rounded-2xl">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              <p className="text-primary text-sm font-medium">{message}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 shadow-[var(--nm-inset-sm)] rounded-2xl">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {showDebugButton && (
            <div className="pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button
                onClick={toggleDebugMode}
                className={`w-full py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-[var(--nm-raised-sm)] ${
                  debugMode
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-[var(--nm-bg)] text-[var(--text-secondary)] hover:shadow-[var(--nm-raised)] hover:text-[var(--foreground)]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">bug_report</span>
                {debugMode ? '关闭调试模式' : '开启调试模式（测试点名）'}
              </button>
              {debugMode && (
                <p className="mt-2 text-xs text-amber-400/70 text-center">
                  调试模式已开启，可在任何时间进行点名测试
                </p>
              )}
            </div>
          )}

          {!showDebugButton && (
            <div className="pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-xs text-[var(--text-secondary)] text-center">
                💡 提示：按 <kbd className="px-2 py-1 bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] rounded-xl text-xs font-mono">Ctrl+Shift+D</kbd> 显示调试功能
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
