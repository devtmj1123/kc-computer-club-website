/* eslint-disable prettier/prettier */
'use client';

import React, { useState, useEffect } from 'react';
import styles from './AttendanceRecords.module.css';

interface AttendanceRecord {
  $id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  checkInTime: string;
  sessionTime: string;  // 格式如 '15:20' 或 '18:43'
  weekNumber: number;
  status: 'present' | 'absent' | 'late' | 'pending';
  isPending?: boolean;
  uniqueKey?: string;
}

// 学生统计信息
interface StudentStats {
  studentId: string;
  studentName: string;
  studentEmail: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  records: AttendanceRecord[];
}

// 从邮箱提取学号（前5-6个字符）
const extractStudentId = (email: string): string => {
  const match = email.match(/^([0-9a-zA-Z]{5,6})/i);
  return match ? match[1].toUpperCase() : email.split('@')[0].slice(0, 6);
};

interface AttendanceSummary {
  weekNumber: number;
  totalStudents?: number;
  session1: {
    total: number;
    present?: number;
    late?: number;
    absent?: number;
    pending?: number;
    students: AttendanceRecord[];
  };
  session2: {
    total: number;
    present?: number;
    late?: number;
    absent?: number;
    pending?: number;
    students: AttendanceRecord[];
  };
}

export default function AttendanceRecords() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // 学生详情模态框
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  
  // 验证码相关状态
  const [attendanceCode1, setAttendanceCode1] = useState<string | null>(null);
  const [attendanceCode2, setAttendanceCode2] = useState<string | null>(null);
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  
  // 标记迟到相关状态
  const [isMarkingLate, setIsMarkingLate] = useState(false);
  
  // 初始化时段相关状态
  const [isInitializing, setIsInitializing] = useState(false);
  const [sessionInitStatus, setSessionInitStatus] = useState<{
    isInitialized: boolean;
    stats?: { total: number; pending: number; present: number; late: number; absent: number };
  }>({ isInitialized: false });
  
  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent' | 'pending'>('all');
  
  // 点名配置（从数据库加载）
  const [attendanceConfig, setAttendanceConfig] = useState<{
    session1Start: { hour: number; minute: number };
    session1Duration: number;
    session2Start: { hour: number; minute: number };
    session2Duration: number;
  }>({
    session1Start: { hour: 15, minute: 20 },
    session1Duration: 5,
    session2Start: { hour: 16, minute: 35 },
    session2Duration: 5,
  });
  
  // 计算结束时间（处理分钟溢出）
  const calculateEndTime = (hour: number, minute: number, duration: number): { hour: number; minute: number } => {
    const totalMinutes = minute + duration;
    return {
      hour: hour + Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
    };
  };

  // 格式化时间段显示（从配置获取）
  const formatSessionTimeRange = (sessionNumber: 1 | 2): string => {
    const start = sessionNumber === 1 ? attendanceConfig.session1Start : attendanceConfig.session2Start;
    const duration = sessionNumber === 1 ? attendanceConfig.session1Duration : attendanceConfig.session2Duration;
    const end = calculateEndTime(start.hour, start.minute, duration);
    const startHour12 = start.hour > 12 ? start.hour - 12 : start.hour;
    const endHour12 = end.hour > 12 ? end.hour - 12 : end.hour;
    const period = start.hour >= 12 ? '下午' : '上午';
    return `${period} ${startHour12}:${String(start.minute).padStart(2, '0')}-${endHour12}:${String(end.minute).padStart(2, '0')}`;
  };
  
  // 获取时段时间字符串（HH:MM 格式）
  const getSessionTimeString = (sessionNumber: 1 | 2): string => {
    const start = sessionNumber === 1 ? attendanceConfig.session1Start : attendanceConfig.session2Start;
    return `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}`;
  };

  // 检查点名状态并自动生成验证码
  const checkAttendanceStatus = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      
      const nowOpen = data.isAttendanceOpen || false;
      setIsAttendanceOpen(nowOpen);
      
      // 验证码需要管理员手动生成
      
      // 更新验证码状态
      if (data.codeEnabled !== undefined) {
        setCodeEnabled(data.codeEnabled);
      }
    } catch (err) {
      console.error('检查点名状态失败:', err);
    }
  };

  // 获取学生统计数据
  const fetchStudentStats = async (studentEmail: string, studentName: string) => {
    setIsLoadingStudent(true);
    try {
      // 获取该学生的所有出席记录
      const response = await fetch(`/api/attendance/student-stats?email=${encodeURIComponent(studentEmail)}`);
      const data = await response.json();
      
      if (response.ok) {
        const records = data.records as AttendanceRecord[];
        
        // 统计出席、迟到、缺席次数
        let present = 0, late = 0, absent = 0;
        records.forEach((record) => {
          if (record.status === 'present') present++;
          else if (record.status === 'late') late++;
          else if (record.status === 'absent') absent++;
        });

        setSelectedStudent({
          studentId: extractStudentId(studentEmail),
          studentName,
          studentEmail,
          present,
          late,
          absent,
          total: records.length,
          records,
        });
      } else {
        alert('获取学生记录失败：' + (data.error || '未知错误'));
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      alert('获取学生记录失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const handleStudentClick = (email: string, name: string) => {
    fetchStudentStats(email, name);
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  const fetchRecords = async (week: number) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/attendance/records?weekNumber=${week}`);
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
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

  // 配置类型定义
  type SessionConfig = {
    session1Start: { hour: number; minute: number };
    session1Duration: number;
    session2Start: { hour: number; minute: number };
    session2Duration: number;
  };

  // 检查当前时间是否在时段窗口内（时段开始时间 ~ 结束后15分钟）
  const isWithinSessionWindow = (sessionNumber: 1 | 2, config?: SessionConfig): boolean => {
    const now = new Date();
    const useConfig = config || attendanceConfig;
    const start = sessionNumber === 1 ? useConfig.session1Start : useConfig.session2Start;
    const duration = sessionNumber === 1 ? useConfig.session1Duration : useConfig.session2Duration;
    
    const sessionStart = new Date();
    sessionStart.setHours(start.hour, start.minute, 0, 0);
    
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + duration + 10); // 时段窗口 = 持续时间 + 10分钟缓冲
    
    return now >= sessionStart && now <= sessionEnd;
  };

  // 获取时段时间字符串 (可接收外部配置)
  const getSessionTimeStringWithConfig = (sessionNumber: 1 | 2, config?: SessionConfig): string => {
    const useConfig = config || attendanceConfig;
    const start = sessionNumber === 1 ? useConfig.session1Start : useConfig.session2Start;
    return `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}`;
  };

  // 自动初始化时段（只在时段开始时自动添加学生）
  const autoInitializeSession = async (sessionNumber: 1 | 2, week: number, config?: SessionConfig) => {
    try {
      const useConfig = config || attendanceConfig;
      const sessionTimeStr = getSessionTimeStringWithConfig(sessionNumber, useConfig);
      
      // 只在时段窗口内自动初始化
      if (!isWithinSessionWindow(sessionNumber, useConfig)) {
        console.log(`时段 ${sessionTimeStr} 未开始，跳过自动初始化`);
        return;
      }
      
      // 检查该时段是否已初始化
      const checkResponse = await fetch(`/api/attendance/initialize-session?sessionTime=${sessionTimeStr}&weekNumber=${week}`);
      const checkData = await checkResponse.json();
      
      // 如果未初始化或没有待点名学生，自动初始化
      if (checkData.success && (!checkData.isInitialized || (checkData.stats?.total === 0))) {
        console.log(`时段 ${sessionTimeStr} 已开始，自动初始化第 ${week} 周...`);
        const duration = sessionNumber === 1 ? useConfig.session1Duration : useConfig.session2Duration;
        const initResponse = await fetch('/api/attendance/initialize-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionTime: sessionTimeStr,
            weekNumber: week,
            sessionDuration: duration,
          }),
        });
        const initData = await initResponse.json();
        if (initData.success) {
          console.log(`✓ 时段初始化完成：${initData.summary?.newRecordsCount || 0} 名学生`);
          // 刷新记录显示
          fetchRecords(week);
          checkSessionInitStatus(sessionTimeStr);
        }
      }
    } catch (err) {
      console.error('自动初始化失败:', err);
    }
  };

  useEffect(() => {
    // 获取当前周数和验证码状态以及配置
    const response = fetch('/api/attendance?action=debug-status');
    response.then((res) => res.json()).then((data) => {
      setWeekNumber(data.config?.weekNumber || 1);
      setAttendanceCode1(data.attendanceCode1 || null);
      setAttendanceCode2(data.attendanceCode2 || null);
      setCodeEnabled(data.codeEnabled || false);
      
      // 加载点名配置（时段时间从数据库获取）
      const initialConfig: SessionConfig = {
        session1Start: data.config?.session1Start || { hour: 15, minute: 20 },
        session1Duration: data.config?.session1Duration || 5,
        session2Start: data.config?.session2Start || { hour: 16, minute: 35 },
        session2Duration: data.config?.session2Duration || 5,
      };
      setAttendanceConfig(initialConfig);
      
      // 重新获取周数和状态
      fetch('/api/attendance').then((res) => res.json()).then(async (statusData) => {
        const currentWeek = statusData.weekNumber || 1;
        setWeekNumber(currentWeek);
        setIsAttendanceOpen(statusData.isAttendanceOpen || false);
        
        // 构建最新配置 (直接使用，不依赖 state)
        const latestConfig: SessionConfig = {
          session1Start: statusData.config?.session1Start || initialConfig.session1Start,
          session1Duration: statusData.config?.session1Duration || initialConfig.session1Duration,
          session2Start: statusData.config?.session2Start || initialConfig.session2Start,
          session2Duration: statusData.config?.session2Duration || initialConfig.session2Duration,
        };
        setAttendanceConfig(latestConfig);
        
        // 获取时段时间字符串
        const session1Time = `${String(latestConfig.session1Start.hour).padStart(2, '0')}:${String(latestConfig.session1Start.minute).padStart(2, '0')}`;
        const session2Time = `${String(latestConfig.session2Start.hour).padStart(2, '0')}:${String(latestConfig.session2Start.minute).padStart(2, '0')}`;
        
        // 仅在时段窗口内自动初始化（传入配置，不依赖 state）
        await autoInitializeSession(1, currentWeek, latestConfig);
        await autoInitializeSession(2, currentWeek, latestConfig);
        
        // 获取记录和检查状态
        fetchRecords(currentWeek);
        checkSessionInitStatus(session1Time);
        checkSessionInitStatus(session2Time);
      });
    });
    
    // 每 30 秒检查一次点名状态和自动初始化
    const statusInterval = setInterval(async () => {
      await checkAttendanceStatus();
      // 检查是否需要自动初始化（时段刚开始时）- 此时 state 已更新
      if (weekNumber > 0) {
        await autoInitializeSession(1, weekNumber);
        await autoInitializeSession(2, weekNumber);
      }
    }, 30000);
    
    // 每 10 秒刷新一次记录数据（实时更新学生点名状态）
    const recordsInterval = setInterval(() => {
      if (weekNumber > 0) {
        fetchRecords(weekNumber);
      }
    }, 10000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(recordsInterval);
    };
  }, []);

  // 手动生成两个新验证码
  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-code' }),
      });
      const data = await response.json();
      if (data.success) {
        setAttendanceCode1(data.attendanceCode1);
        setAttendanceCode2(data.attendanceCode2);
        setCodeEnabled(true);
        alert(data.message || '验证码生成成功');
      } else {
        alert('生成验证码失败：' + (data.error || '未知错误，请检查后台日志'));
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      alert('生成验证码失败：' + (error.message || '网络错误'));
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // 清除验证码
  const handleClearCode = async () => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-code' }),
      });
      const data = await response.json();
      if (data.success) {
        setAttendanceCode1(null);
        setAttendanceCode2(null);
        setCodeEnabled(false);
        alert('验证码已清除');
      }
    } catch (err) {
      alert('清除验证码失败');
    }
  };

  // 手动初始化/刷新时段（预填充所有学生为 pending 状态）
  const handleInitializeSession = async (sessionNumber: 1 | 2) => {
    const sessionTimeStr = getSessionTimeString(sessionNumber);
    const sessionRange = formatSessionTimeRange(sessionNumber);
    const duration = sessionNumber === 1 ? attendanceConfig.session1Duration : attendanceConfig.session2Duration;
    
    if (!confirm(`确定要重新初始化点名时段吗？\n时段: ${sessionRange}\n\n这将为缺失的学生创建待点名记录（已有记录不受影响）。`)) {
      return;
    }
    
    setIsInitializing(true);
    try {
      const response = await fetch('/api/attendance/initialize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTime: sessionTimeStr,
          weekNumber,
          sessionDuration: duration,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`时段初始化完成！已为 ${data.summary?.newRecordsCount || 0} 名学生创建待点名记录`);
        // 刷新数据
        await fetchRecords(weekNumber);
        // 更新初始化状态
        await checkSessionInitStatus(sessionTimeStr);
      } else {
        alert('初始化失败：' + (data.error || '未知错误'));
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      alert('初始化失败：' + (error.message || '未知错误'));
    } finally {
      setIsInitializing(false);
    }
  };

  // 检查时段初始化状态
  const checkSessionInitStatus = async (sessionTime: string) => {
    try {
      const response = await fetch(`/api/attendance/initialize-session?sessionTime=${sessionTime}&weekNumber=${weekNumber}`);
      const data = await response.json();
      if (data.success) {
        setSessionInitStatus({
          isInitialized: data.isInitialized,
          stats: data.stats,
        });
      }
    } catch (err) {
      console.error('检查初始化状态失败:', err);
    }
  };

  // 标记所有未点名学生为缺席
  const handleMarkAllLate = async (sessionNumber: 1 | 2) => {
    const sessionTimeStr = getSessionTimeString(sessionNumber);
    const sessionRange = formatSessionTimeRange(sessionNumber);
    
    if (!confirm(`确定要将所有未点名的学生标记为缺席吗？\n时段: ${sessionRange}`)) {
      return;
    }
    
    setIsMarkingLate(true);
    try {
      const response = await fetch('/api/attendance/mark-absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTime: sessionTimeStr,
          weekNumber,
          markAs: 'absent',  // 标记为缺席
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`标记完成！${data.summary?.createdRecordsCount || 0} 名学生被标记为缺席`);
        // 刷新数据
        fetchRecords(weekNumber);
      } else {
        alert('标记失败：' + (data.error || '未知错误'));
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      alert('标记失败：' + (error.message || '未知错误'));
    } finally {
      setIsMarkingLate(false);
    }
  };

  const formatTime = (isoTime: string | null) => {
    if (!isoTime) return '-';
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (isoTime: string | null) => {
    if (!isoTime) return '-';
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN');
  };

  const handleChangeStatus = async (
    recordId: string,
    newStatus: 'present' | 'absent' | 'late',
    record?: AttendanceRecord
  ) => {
    setUpdatingId(recordId);

    try {
      // 检查是否是 pending 记录（需要创建而非更新）
      // 新格式: $id = studentId_sessionTime_weekNumber (如: 12345_15:20_3)
      const isPendingRecord = record?.isPending || record?.status === 'pending';

      if (isPendingRecord && record) {
        // 对于 pending 记录，使用 PATCH 创建新的点名记录
        // recordId 格式: studentId_sessionTime_weekNumber
        const response = await fetch('/api/attendance/record', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId,  // uniqueKey 格式: studentId_sessionTime_weekNumber
            status: newStatus,
            studentName: record.studentName,
            studentEmail: record.studentEmail,
            notes: newStatus === 'late' ? 'Admin 标记为迟到' : undefined,
          }),
        });

        if (response.ok) {
          // 立即更新本地状态，不需要重新fetch
          if (summary) {
            setSummary(prev => {
              const newSummary = JSON.parse(JSON.stringify(prev));
              // 找出sessionTime
              const sessionTime = record.sessionTime;
              const session = sessionTime === getSessionTimeString(1) ? newSummary.session1 : newSummary.session2;

              // 找到待点名记录并更新
              const idx = session.students.findIndex((s: AttendanceRecord) => s.uniqueKey === recordId);
              if (idx !== -1) {
                session.students[idx].status = newStatus;
                // 更新统计数据
                session.pending = (session.pending || 0) - 1;
                session[newStatus] = (session[newStatus] || 0) + 1;
              }
              return newSummary;
            });
          }
        } else {
          const data = await response.json();
          alert('创建失败：' + (data.error || '未知错误'));
        }
      } else {
        // 对于已有记录，执行更新操作
        const response = await fetch('/api/attendance/record', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId,
            status: newStatus,
            notes: newStatus === 'late' ? 'Admin 标记为迟到' : undefined,
          }),
        });

        if (response.ok) {
          // 立即更新本地状态，不需要重新fetch
          if (summary && record) {
            setSummary(prev => {
              const newSummary = JSON.parse(JSON.stringify(prev));
              const sessionTime = record.sessionTime;
              const session = sessionTime === getSessionTimeString(1) ? newSummary.session1 : newSummary.session2;

              // 找到记录并更新
              const idx = session.students.findIndex((s: AttendanceRecord) => (s.uniqueKey || s.$id) === recordId);
              if (idx !== -1) {
                const oldStatus = session.students[idx].status;
                session.students[idx].status = newStatus;

                // 更新统计数据
                if (oldStatus !== 'pending') {
                  session[oldStatus] = Math.max(0, (session[oldStatus] || 0) - 1);
                }
                session[newStatus] = (session[newStatus] || 0) + 1;
              }
              return newSummary;
            });
          }
        } else {
          const data = await response.json();
          alert('修改失败：' + (data.error || '未知错误'));
        }
      }
    } catch (err) {
      const error = err as Error & { message?: string };
      alert('修改失败：' + (error.message || '未知错误'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#3fb950'; // GitHub 绿色
      case 'late':
        return '#d29922'; // GitHub 橙色
      case 'absent':
        return '#ff7b72'; // GitHub 红色
      case 'pending':
        return '#6e7681'; // GitHub 灰色 - 未点名
      default:
        return '#6e7681';
    }
  };

  // 获取状态显示文本
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return '出席';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺席';
      case 'pending':
        return '未点名';
      default:
        return status;
    }
  };

  // CSV 导出函数
  const exportToCSV = (sessionNumber: 1 | 2) => {
    if (!summary) return;

    const data = sessionNumber === 1 ? summary.session1.students : summary.session2.students;
    const sessionTime = sessionNumber === 1 ? '下午 3:15-3:30' : '下午 4:30-4:45';

    // 创建 CSV 内容
    const headers = ['学号', '姓名', '邮箱', '签到时间', '签到日期', '状态'];
    const rows = data.map((record) => [
      extractStudentId(record.studentEmail),
      record.studentName,
      record.studentEmail,
      formatTime(record.checkInTime),
      formatDate(record.checkInTime),
      record.status === 'present' ? '出席' : record.status === 'late' ? '迟到' : '缺席',
    ]);

    // 组合 CSV
    const csvContent = [
      [`电脑学会点名记录 - 第${summary.weekNumber}周 - ${sessionTime}`],
      [],
      [headers.join(',')],
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // 添加 UTF-8 BOM 让 Excel 正确识别中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_week${summary.weekNumber}_session${sessionNumber}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!summary) {
    return <div className={styles.empty}>暂无数据</div>;
  }

  return (
    <div className={styles.container}>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      
      {/* 验证码控制面板 - 始终可见以便管理员操作 */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2632 0%, #1e3a5f 100%)',
        border: codeEnabled ? '2px solid rgba(19, 236, 128, 0.5)' : '1px solid rgba(19, 127, 236, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: codeEnabled ? '0 0 20px rgba(19, 236, 128, 0.2)' : 'none',
      }}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <span className="material-symbols-outlined" style={{fontSize: '28px', color: '#137fec'}}>pin</span>
            <div>
              <h3 style={{margin: 0, color: 'white', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'}}>
                点名验证码
                {isAttendanceOpen && (
                  <span style={{
                    padding: '4px 12px',
                    background: 'rgba(19, 236, 128, 0.2)',
                    border: '1px solid rgba(19, 236, 128, 0.5)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#13ec80',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    animation: 'pulse 2s infinite',
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      background: '#13ec80',
                      borderRadius: '50%',
                      animation: 'blink 1s infinite',
                    }}></span>
                    点名进行中
                  </span>
                )}
              </h3>
              <p style={{margin: '4px 0 0', color: '#8a9e94', fontSize: '13px'}}>
                {codeEnabled ? '学生需要输入验证码才能点名' : '验证码功能已关闭'}
              </p>
            </div>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            {codeEnabled && (attendanceCode1 || attendanceCode2) && (
              <div style={{
                background: 'rgba(19, 127, 236, 0.15)',
                border: '2px solid rgba(19, 127, 236, 0.5)',
                borderRadius: '12px',
                padding: '12px 20px',
                display: 'flex',
                gap: '24px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8a9e94', fontSize: '11px', marginBottom: '4px' }}>时段 1 验证码</div>
                  <div style={{ color: '#137fec', fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '6px' }}>
                    {attendanceCode1 || '----'}
                  </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(19, 127, 236, 0.3)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8a9e94', fontSize: '11px', marginBottom: '4px' }}>时段 2 验证码</div>
                  <div style={{ color: '#13ec80', fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '6px' }}>
                    {attendanceCode2 || '----'}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <button
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#137fec',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isGeneratingCode ? 'wait' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: isGeneratingCode ? 0.7 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>refresh</span>
                {isGeneratingCode ? '生成中…（首次约需 5-10 秒）' : (attendanceCode1 || attendanceCode2) ? '刷新验证码' : '生成验证码'}
              </button>
              
              {codeEnabled && (
                <button
                  onClick={handleClearCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: 'transparent',
                    color: '#ff7b72',
                    border: '1px solid rgba(255, 123, 114, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
                  关闭验证码
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.header}>
        <h2><span className="material-symbols-outlined" style={{fontSize: '28px', marginRight: '8px', verticalAlign: 'middle', color: '#137fec'}}>bar_chart</span>点名记录</h2>
        <div className={styles.weekSelector}>
          <button
            onClick={() => {
              const newWeek = Math.max(1, weekNumber - 1);
              setWeekNumber(newWeek);
              fetchRecords(newWeek);
            }}
            className={styles.prevButton}
          >
            <span className="material-symbols-outlined" style={{fontSize: '18px', marginRight: '4px'}}>arrow_back</span>
            上一周
          </button>
          <span className={styles.weekNumber}>第 {summary.weekNumber} 周</span>
          <button 
            onClick={() => {
              const newWeek = weekNumber + 1;
              setWeekNumber(newWeek);
              fetchRecords(newWeek);
            }}
            className={styles.nextButton}
          >
            下一周
            <span className="material-symbols-outlined" style={{fontSize: '18px', marginLeft: '4px'}}>arrow_forward</span>
          </button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.title}>下午 3:15-3:30</div>
          <div className={styles.count}>{(summary.session1.present || 0) + (summary.session1.late || 0)}</div>
          <div className={styles.label}>人出席</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.title}>下午 4:30-4:45</div>
          <div className={styles.count}>{(summary.session2.present || 0) + (summary.session2.late || 0)}</div>
          <div className={styles.label}>人出席</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.title}>本周总人次</div>
          <div className={styles.count}>{(summary.session1.present || 0) + (summary.session1.late || 0) + (summary.session2.present || 0) + (summary.session2.late || 0)}</div>
          <div className={styles.label}>次出席</div>
        </div>
      </div>

      {/* 状态筛选器 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: '#1a2632',
        borderRadius: '12px',
        border: '1px solid #2a3c54',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <span className="material-symbols-outlined" style={{ color: '#8ba9c8', fontSize: '20px' }}>filter_list</span>
        <span style={{ color: '#8ba9c8', fontSize: '14px', marginRight: '8px' }}>筛选状态:</span>
        {(['all', 'present', 'late', 'absent', 'pending'] as const).map((status) => {
          const labels: Record<string, string> = { all: '全部', present: '出席', late: '迟到', absent: '缺席', pending: '未点名' };
          const colors: Record<string, string> = { all: '#137fec', present: '#3fb950', late: '#d29922', absent: '#f85149', pending: '#6e7681' };
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: isActive ? 'none' : '1px solid #2a3c54',
                background: isActive ? colors[status] : 'transparent',
                color: isActive ? 'white' : '#8ba9c8',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {labels[status]}
            </button>
          );
        })}
      </div>

      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3><span className="material-symbols-outlined" style={{fontSize: '20px', marginRight: '8px', verticalAlign: 'middle', color: '#137fec'}}>location_on</span>{formatSessionTimeRange(1)} 点名记录</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!sessionInitStatus.isInitialized && (
              <button
                onClick={() => handleInitializeSession(1)}
                disabled={isInitializing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: isInitializing ? '#555' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isInitializing ? 'wait' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {isInitializing ? 'sync' : 'add_circle'}
                </span>
                {isInitializing ? '初始化中...' : '初始化时段'}
              </button>
            )}
            {sessionInitStatus.isInitialized && sessionInitStatus.stats && sessionInitStatus.stats.pending > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#10b981',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                已初始化 ({sessionInitStatus.stats.pending} 人待点名)
              </div>
            )}
            <button
              onClick={() => handleMarkAllLate(1)}
              disabled={isMarkingLate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: isMarkingLate ? '#6e7681' : '#f85149',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isMarkingLate ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isMarkingLate ? 'sync' : 'cancel'}</span>
              未点名标缺席
            </button>
            <button
              onClick={() => exportToCSV(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#137fec',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d5bc4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#137fec';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              导出 CSV
            </button>
          </div>
        </div>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.col1}>学号</div>
            <div className={styles.col2}>学生姓名</div>
            <div className={styles.col3}>邮箱</div>
            <div className={styles.col4}>点名时间</div>
            <div className={styles.col5}>状态</div>
          </div>
          <div className={styles.tableBody}>
            {summary.session1.students.filter(s => statusFilter === 'all' || s.status === statusFilter).length > 0 ? (
              summary.session1.students.filter(s => statusFilter === 'all' || s.status === statusFilter).map((record) => (
                <div key={record.$id} className={styles.tableRow}>
                  <div 
                    className={styles.col1} 
                    style={{ fontWeight: '600', color: '#137fec', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => handleStudentClick(record.studentEmail, record.studentName)}
                    title="点击查看学生出席统计"
                  >
                    {extractStudentId(record.studentEmail)}
                  </div>
                  <div className={styles.col2}>{record.studentName}</div>
                  <div className={styles.col3}>{record.studentEmail}</div>
                  <div className={styles.col4}>
                    {record.status === 'pending' ? (
                      <span style={{ color: '#6e7681', fontStyle: 'italic' }}>未点名</span>
                    ) : (
                      <>{formatDate(record.checkInTime)} {formatTime(record.checkInTime)}</>
                    )}
                  </div>
                  <div className={styles.col5}>
                    {updatingId === (record.uniqueKey || record.$id) ? (
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite', color: '#6e7681' }}>
                        sync
                      </span>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px', width: '100%'}}>
                        {/* 当前状态显示 */}
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '13px',
                          background: record.status === 'present' ? 'rgba(63, 185, 80, 0.15)' : 
                                      record.status === 'late' ? 'rgba(210, 153, 34, 0.15)' : 
                                      record.status === 'absent' ? 'rgba(255, 123, 114, 0.15)' : 
                                      'rgba(110, 118, 129, 0.15)',
                          color: record.status === 'present' ? '#3fb950' : 
                                 record.status === 'late' ? '#d29922' : 
                                 record.status === 'absent' ? '#ff7b72' : 
                                 '#6e7681',
                          border: `1px solid ${record.status === 'present' ? '#3fb950' : 
                                                record.status === 'late' ? '#d29922' : 
                                                record.status === 'absent' ? '#ff7b72' : 
                                                '#6e7681'}`,
                        }}>
                          {record.status === 'present' ? '✓ 出席' : 
                           record.status === 'late' ? '⏰ 迟到' : 
                           record.status === 'absent' ? '✗ 缺席' : 
                           '○ 未点名'}
                        </div>
                        {/* 操作按钮（缩小版） */}
                        <div className={styles.statusButtonGroup} style={{gap: '4px'}}>
                          <button
                            onClick={() => handleChangeStatus(record.uniqueKey || record.$id, 'present', record)}
                            className={`${styles.statusBtn} ${styles.statusBtnPresent} ${record.status === 'present' ? styles.active : ''}`}
                            disabled={updatingId === (record.uniqueKey || record.$id)}
                            title="标记为出席"
                            style={{fontSize: '10px', padding: '3px 6px', minWidth: '38px'}}
                          >
                            出席
                          </button>
                          <button
                            onClick={() => handleChangeStatus(record.uniqueKey || record.$id, 'late', record)}
                            className={`${styles.statusBtn} ${styles.statusBtnLate} ${record.status === 'late' ? styles.active : ''}`}
                            disabled={updatingId === (record.uniqueKey || record.$id)}
                            title="标记为迟到"
                            style={{fontSize: '10px', padding: '3px 6px', minWidth: '38px'}}
                          >
                            迟到
                          </button>
                          <button
                            onClick={() => handleChangeStatus(record.uniqueKey || record.$id, 'absent', record)}
                            className={`${styles.statusBtn} ${styles.statusBtnAbsent} ${record.status === 'absent' ? styles.active : ''}`}
                            disabled={updatingId === (record.uniqueKey || record.$id)}
                            title="标记为缺席"
                            style={{fontSize: '10px', padding: '3px 6px', minWidth: '38px'}}
                          >
                            缺席
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noData}>暂无点名记录</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3><span className="material-symbols-outlined" style={{fontSize: '20px', marginRight: '8px', verticalAlign: 'middle', color: '#137fec'}}>location_on</span>{formatSessionTimeRange(2)} 点名记录</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleMarkAllLate(2)}
              disabled={isMarkingLate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: isMarkingLate ? '#6e7681' : '#f85149',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isMarkingLate ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isMarkingLate ? 'sync' : 'cancel'}</span>
              未点名标缺席
            </button>
            <button
              onClick={() => exportToCSV(2)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#137fec',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d5bc4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#137fec';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              导出 CSV
            </button>
          </div>
        </div>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.col1}>学号</div>
            <div className={styles.col2}>学生姓名</div>
            <div className={styles.col3}>邮箱</div>
            <div className={styles.col4}>点名时间</div>
            <div className={styles.col5}>状态</div>
          </div>
          <div className={styles.tableBody}>
            {summary.session2.students.filter(s => statusFilter === 'all' || s.status === statusFilter).length > 0 ? (
              summary.session2.students.filter(s => statusFilter === 'all' || s.status === statusFilter).map((record) => (
                <div key={record.$id} className={styles.tableRow}>
                  <div 
                    className={styles.col1} 
                    style={{ fontWeight: '600', color: '#137fec', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => handleStudentClick(record.studentEmail, record.studentName)}
                    title="点击查看学生出席统计"
                  >
                    {extractStudentId(record.studentEmail)}
                  </div>
                  <div className={styles.col2}>{record.studentName}</div>
                  <div className={styles.col3}>{record.studentEmail}</div>
                  <div className={styles.col4}>
                    {record.status === 'pending' ? (
                      <span style={{ color: '#6e7681', fontStyle: 'italic' }}>未点名</span>
                    ) : (
                      <>{formatDate(record.checkInTime)} {formatTime(record.checkInTime)}</>
                    )}
                  </div>
                  <div className={styles.col5}>
                    {updatingId === (record.uniqueKey || record.$id) ? (
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite', color: '#6e7681' }}>
                        sync
                      </span>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px', width: '100%'}}>
                        {/* 当前状态显示 */}
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '13px',
                          background: record.status === 'present' ? 'rgba(63, 185, 80, 0.15)' : 
                                      record.status === 'late' ? 'rgba(210, 153, 34, 0.15)' : 
                                      record.status === 'absent' ? 'rgba(255, 123, 114, 0.15)' : 
                                      'rgba(110, 118, 129, 0.15)',
                          color: record.status === 'present' ? '#3fb950' : 
                                 record.status === 'late' ? '#d29922' : 
                                 record.status === 'absent' ? '#ff7b72' : 
                                 '#6e7681',
                          border: `1px solid ${record.status === 'present' ? '#3fb950' : 
                                                record.status === 'late' ? '#d29922' : 
                                                record.status === 'absent' ? '#ff7b72' : 
                                                '#6e7681'}`,
                        }}>
                          {record.status === 'present' ? '✓ 出席' : 
                           record.status === 'late' ? '⏰ 迟到' : 
                           record.status === 'absent' ? '✗ 缺席' : 
                           '○ 未点名'}
                        </div>
                        {/* 操作按钮（缩小版） */}
                        <div className={styles.statusButtonGroup} style={{gap: '4px'}}>
                          <button
                            onClick={() => handleChangeStatus(record.uniqueKey || record.$id, 'present', record)}
                            className={`${styles.statusBtn} ${styles.statusBtnPresent} ${record.status === 'present' ? styles.active : ''}`}
                            disabled={updatingId === (record.uniqueKey || record.$id)}
                            title="标记为出席"
                            style={{fontSize: '10px', padding: '3px 6px', minWidth: '38px'}}
                          >
                            出席
                          </button>
                          <button
                            onClick={() => handleChangeStatus(record.uniqueKey || record.$id, 'late', record)}
                            className={`${styles.statusBtn} ${styles.statusBtnLate} ${record.status === 'late' ? styles.active : ''}`}
                            disabled={updatingId === (record.uniqueKey || record.$id)}
                            title="标记为迟到"
                            style={{fontSize: '10px', padding: '3px 6px', minWidth: '38px'}}
                          >
                            迟到
                          </button>
                          <button
                            onClick={() => handleChangeStatus(record.uniqueKey || record.$id, 'absent', record)}
                            className={`${styles.statusBtn} ${styles.statusBtnAbsent} ${record.status === 'absent' ? styles.active : ''}`}
                            disabled={updatingId === (record.uniqueKey || record.$id)}
                            title="标记为缺席"
                            style={{fontSize: '10px', padding: '3px 6px', minWidth: '38px'}}
                          >
                            缺席
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noData}>暂无点名记录</div>
            )}
          </div>
        </div>
      </div>

      {/* 学生统计模态框 */}
      {(selectedStudent || isLoadingStudent) && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {isLoadingStudent ? (
              <div className={styles.modalLoading}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', animation: 'spin 1s linear infinite', color: '#137fec' }}>
                  sync
                </span>
                <p>加载中...</p>
              </div>
            ) : selectedStudent && (
              <>
                <div className={styles.modalHeader}>
                  <h2>
                    <span className="material-symbols-outlined" style={{ marginRight: '8px', color: '#137fec' }}>person</span>
                    学生出席统计
                  </h2>
                  <button className={styles.closeBtn} onClick={closeModal}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className={styles.studentInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>学号:</span>
                    <span className={styles.value}>{selectedStudent.studentId}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>姓名:</span>
                    <span className={styles.value}>{selectedStudent.studentName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>邮箱:</span>
                    <span className={styles.value}>{selectedStudent.studentEmail}</span>
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard} style={{ borderColor: '#3fb950' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#3fb950' }}>check_circle</span>
                    <div className={styles.statNumber} style={{ color: '#3fb950' }}>{selectedStudent.present}</div>
                    <div className={styles.statLabel}>出席</div>
                  </div>
                  <div className={styles.statCard} style={{ borderColor: '#d29922' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#d29922' }}>schedule</span>
                    <div className={styles.statNumber} style={{ color: '#d29922' }}>{selectedStudent.late}</div>
                    <div className={styles.statLabel}>迟到</div>
                  </div>
                  <div className={styles.statCard} style={{ borderColor: '#ff7b72' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#ff7b72' }}>cancel</span>
                    <div className={styles.statNumber} style={{ color: '#ff7b72' }}>{selectedStudent.absent}</div>
                    <div className={styles.statLabel}>缺席</div>
                  </div>
                </div>

                <div className={styles.attendanceRate}>
                  <span className={styles.label}>出席率:</span>
                  <span className={styles.rateValue}>
                    {selectedStudent.total > 0 
                      ? Math.round((selectedStudent.present / selectedStudent.total) * 100) 
                      : 0}%
                  </span>
                  <span className={styles.rateTotal}>（共 {selectedStudent.total} 次点名）</span>
                </div>

                {selectedStudent.records.length > 0 && (
                  <div className={styles.recordsHistory}>
                    <h3>
                      <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>history</span>
                      最近出席记录
                    </h3>
                    <div className={styles.historyList}>
                      {selectedStudent.records.slice(0, 10).map((record) => (
                        <div key={record.$id} className={styles.historyItem}>
                          <span className={styles.historyDate}>
                            第 {record.weekNumber} 周 · {record.sessionTime === '3:15pm' ? '3:15PM' : '4:30PM'}
                          </span>
                          <span 
                            className={styles.historyStatus}
                            style={{ color: getStatusColor(record.status) }}
                          >
                            {record.status === 'present' ? '出席' : record.status === 'late' ? '迟到' : '缺席'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
