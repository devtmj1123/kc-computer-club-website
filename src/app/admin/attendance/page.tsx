'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import AttendanceRecords from '@/components/attendance/AttendanceRecords';
export default function AdminAttendancePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">bar_chart</span>
            点名管理
          </h1>
          <p className="text-gray-400 mt-2">查看社团成员的出席情况和参与趋势</p>
        </div>
        <AttendanceRecords />
      </div>
    </AdminLayout>
  );
}