'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import AttendanceRecords from '@/components/attendance/AttendanceRecords';

export default function AdminAttendancePage() {
  return (
    <AdminLayout>
      <div className="mb-7">
        <div className="eyebrow">Attendance Ledger · 出席记录</div>
        <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
          点名管理
        </h1>
        <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
          查看社团成员各周出席情况、点名验证码与参与趋势。
        </p>
      </div>

      <AttendanceRecords />
    </AdminLayout>
  );
}
