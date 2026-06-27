'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './StudentAttendanceRecords.module.css';

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

    console.log('StudentAttendanceRecords - authLoading:', authLoading);
    console.log('StudentAttendanceRecords - user:', user);
    console.log('StudentAttendanceRecords - user?.email:', user?.email);

    if (!user) {
      setError('请先登录');
      setIsLoading(false);
      return;
    }

    setError('');

    const email = user.email || (user as any).username;
    if (!email) {
      console.error('User object missing email field:', user);
      setError('用户信息不完整，请重新登录');
      setIsLoading(false);
      return;
    }

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/attendance/my-records?email=${encodeURIComponent(email)}`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#3fb950';
      case 'late':
        return '#d29922';
      case 'absent':
        return '#ff7b72';
      default:
        return '#6e7681';
    }
  };

  if (authLoading || isLoading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const weeks = Object.keys(recordsByWeek)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', marginRight: '8px', verticalAlign: 'middle', color: '#137fec' }}>
            check_circle
          </span>
          我的签到记录
        </h2>
        <p className={styles.subtitle}>查看您的签到历史和状态</p>
      </div>

      {weeks.length === 0 ? (
        <div className={styles.empty}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
            info
          </span>
          <p>暂无签到记录</p>
        </div>
      ) : (
        <div className={styles.recordsContainer}>
          {weeks.map((weekNumber) => (
            <div key={weekNumber} className={styles.weekSection}>
              <div className={styles.weekTitle}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>
                  calendar_month
                </span>
                第 {weekNumber} 周
                <span className={styles.weekCount}>
                  共 {recordsByWeek[weekNumber]?.length || 0} 次
                </span>
              </div>

              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.col1}>签到时间</div>
                  <div className={styles.col2}>场次</div>
                  <div className={styles.col3}>状态</div>
                </div>

                <div className={styles.tableBody}>
                  {recordsByWeek[weekNumber]?.map((record) => (
                    <div key={record.$id} className={styles.tableRow}>
                      <div className={styles.col1}>
                        <div className={styles.date}>{formatDate(record.checkInTime)}</div>
                        <div className={styles.time}>{formatTime(record.checkInTime)}</div>
                      </div>

                      <div className={styles.col2}>
                        {record.sessionTime === '15:20' ? (
                          <div className={styles.session}>下午 3:15-3:30</div>
                        ) : record.sessionTime === '16:35' ? (
                          <div className={styles.session}>下午 4:30-4:45</div>
                        ) : (
                          <div className={styles.session}>{record.sessionTime}</div>
                        )}
                      </div>

                      <div className={styles.col3}>
                        <span
                          className={styles.statusBadge}
                          style={{
                            color: getStatusColor(record.status),
                            borderColor: getStatusColor(record.status),
                          }}
                        >
                          {getStatusLabel(record.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
