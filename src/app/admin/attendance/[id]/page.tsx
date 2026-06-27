'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
interface Attendee {
  id: string;
  name: string;
  studentId: string;
  email: string;
  avatar: string;
  status: 'present' | 'absent' | 'late' | 'pending';
  checkInTime?: string;
  notes?: string; 
}
interface SessionInfo {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  totalRegistered: number;
}
export default function TakeAttendancePage() {
  const params = useParams();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotes, setEditingNotes] = useState<{ attendeeId: string; notes: string } | null>(null);
  const filteredAttendees = attendees.filter((attendee) => {
    const matchesFilter = filter === 'all' || attendee.status === filter;
    const matchesSearch = 
      attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const stats = {
    present: attendees.filter((a) => a.status === 'present').length,
    absent: attendees.filter((a) => a.status === 'absent').length,
    late: attendees.filter((a) => a.status === 'late').length,
    pending: attendees.filter((a) => a.status === 'pending').length,
  };
  const statusLabels: Record<string, string> = {
    present: '出席',
    absent: '缺席',
    late: '迟到',
    pending: '未点名',
  };
  const statusColors: Record<string, string> = {
    present: 'bg-green-900/30 text-green-400',
    absent: 'bg-red-900/30 text-red-400',
    late: 'bg-amber-900/30 text-amber-400',
    pending: 'bg-gray-800 text-gray-400',
  };
  const handleStatusChange = (attendeeId: string, newStatus: Attendee['status']) => {
    setAttendees(attendees.map((a) => {
      if (a.id === attendeeId) {
        return {
          ...a,
          status: newStatus,
          checkInTime: newStatus === 'present' || newStatus === 'late' 
            ? new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            : undefined,
        };
      }
      return a;
    }));
  };
  const markAllPresent = () => {
    const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setAttendees(attendees.map((a) => ({
      ...a,
      status: 'present',
      checkInTime: a.checkInTime || currentTime,
    })));
  };
  const markAllPendingAbsent = () => {
    setAttendees(attendees.map((a) => ({
      ...a,
      status: a.status === 'pending' ? 'absent' : a.status,
    })));
  };
  const handleSaveNotes = (attendeeId: string, notes: string) => {
    setAttendees(attendees.map((a) => {
      if (a.id === attendeeId) {
        return {
          ...a,
          notes: notes.trim(),
        };
      }
      return a;
    }));
    setEditingNotes(null);
  };
  if (!session) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="text-[#8ba9c8] text-sm">正在加载点名信息...</div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/attendance"
              className="p-2 hover:bg-[#1e3a5f] rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[#8ba9c8]">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{session?.title || '考勤管理'}</h1>
              <div className="flex items-center gap-4 text-sm text-[#8ba9c8] mt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  {session?.date || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  {session?.time || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  {session?.location || '-'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllPresent}
              className="flex items-center gap-2 h-10 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              全部出席
            </button>
            <button
              onClick={markAllPendingAbsent}
              className="flex items-center gap-2 h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              未到标缺席
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a2632] rounded-xl p-4 border border-[#2a3c54]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.present}</p>
                <p className="text-sm text-[#8ba9c8]">出席</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400">check_circle</span>
              </div>
            </div>
          </div>
          <div className="bg-[#1a2632] rounded-xl p-4 border border-[#2a3c54]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-400">{stats.late}</p>
                <p className="text-sm text-[#8ba9c8]">迟到</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-400">schedule</span>
              </div>
            </div>
          </div>
          <div className="bg-[#1a2632] rounded-xl p-4 border border-[#2a3c54]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
                <p className="text-sm text-[#8ba9c8]">缺席</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">cancel</span>
              </div>
            </div>
          </div>
          <div className="bg-[#1a2632] rounded-xl p-4 border border-[#2a3c54]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-400">{stats.pending}</p>
                <p className="text-sm text-[#8ba9c8]">未点名</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400">pending</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-[#1a2632] rounded-xl border border-[#2a3c54]">
            {(['all', 'pending', 'present', 'late', 'absent'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#137fec] text-white'
                    : 'text-[#8ba9c8] hover:text-white'
                }`}
              >
                {status === 'all' ? '全部' : statusLabels[status]}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-50 max-w-md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6188a9]">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索姓名或学号..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#1a2632] border border-[#2a3c54] text-sm text-white placeholder:text-[#6188a9] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
              />
            </div>
          </div>
        </div>
        <div className="bg-[#1a2632] rounded-xl border border-[#2a3c54] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a3c54]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8ba9c8]">学生</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8ba9c8]">学号</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8ba9c8]">邮箱</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#8ba9c8]">签到时间</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#8ba9c8]">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8ba9c8]">备注</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#8ba9c8]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="border-b border-[#2a3c54] last:border-0 hover:bg-[#0d1f33]/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#137fec] to-[#0d5bc4] flex items-center justify-center text-white font-bold">
                          {attendee.avatar}
                        </div>
                        <span className="font-medium text-white">{attendee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8ba9c8]">{attendee.studentId}</td>
                    <td className="px-6 py-4 text-sm text-[#8ba9c8]">{attendee.email}</td>
                    <td className="px-6 py-4 text-center text-sm text-white">
                      {attendee.checkInTime || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[attendee.status]}`}>
                        {statusLabels[attendee.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8ba9c8]">
                      {attendee.notes ? (
                        <div className="flex items-center gap-2 group">
                          <span className="text-xs text-[#6188a9] line-clamp-1">{attendee.notes}</span>
                          {attendee.status === 'late' && (
                            <button
                              onClick={() => setEditingNotes({ attendeeId: attendee.id, notes: attendee.notes || '' })}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a3c54] rounded transition-all"
                              title="编辑备注"
                            >
                              <span className="material-symbols-outlined text-sm text-[#6188a9]">edit</span>
                            </button>
                          )}
                        </div>
                      ) : attendee.status === 'late' ? (
                        <button
                          onClick={() => setEditingNotes({ attendeeId: attendee.id, notes: '' })}
                          className="text-xs text-[#6188a9] hover:text-[#137fec] transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm align-middle">add_note</span> 添加备注
                        </button>
                      ) : (
                        <span className="text-xs text-[#2a3c54]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStatusChange(attendee.id, 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            attendee.status === 'present' 
                              ? 'bg-green-600 text-white' 
                              : 'hover:bg-green-600/20 text-green-400'
                          }`}
                          title="标记出席"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(attendee.id, 'late')}
                          className={`p-2 rounded-lg transition-colors ${
                            attendee.status === 'late' 
                              ? 'bg-amber-600 text-white' 
                              : 'hover:bg-amber-600/20 text-amber-400'
                          }`}
                          title="标记迟到"
                        >
                          <span className="material-symbols-outlined text-lg">schedule</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(attendee.id, 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            attendee.status === 'absent' 
                              ? 'bg-red-600 text-white' 
                              : 'hover:bg-red-600/20 text-red-400'
                          }`}
                          title="标记缺席"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAttendees.length === 0 && (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#2a3c54] mb-4">person_search</span>
              <p className="text-[#8ba9c8]">没有找到匹配的学生</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-[#1a2632] rounded-xl border border-[#2a3c54]">
          <div className="text-sm text-[#8ba9c8]">
            共 {attendees.length} 名学生，已点名 {attendees.filter((a) => a.status !== 'pending').length} 人
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 h-10 px-4 bg-[#0d1f33] hover:bg-[#1e3a5f] text-white rounded-lg transition-colors">
              <span className="material-symbols-outlined text-lg">download</span>
              导出记录
            </button>
            <button className="flex items-center gap-2 h-10 px-4 bg-[#137fec] hover:bg-[#0d5bc4] text-white font-bold rounded-lg transition-colors">
              <span className="material-symbols-outlined text-lg">save</span>
              保存考勤
            </button>
          </div>
        </div>
        {editingNotes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2632] rounded-xl border border-[#2a3c54] max-w-md w-full p-6 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  添加迟到原因备注
                </h2>
                <p className="text-sm text-[#8ba9c8]">
                  学生：{attendees.find((a) => a.id === editingNotes.attendeeId)?.name}
                </p>
              </div>
              <textarea
                value={editingNotes.notes}
                onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                placeholder="请输入迟到原因...（如：车迟到、突发事件等）"
                className="w-full h-24 p-3 rounded-lg bg-[#0d1f33] border border-[#2a3c54] text-sm text-white placeholder:text-[#6188a9] focus:outline-none focus:ring-2 focus:ring-[#137fec] resize-none"
              />
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setEditingNotes(null)}
                  className="flex-1 h-10 px-4 bg-[#0d1f33] hover:bg-[#1e3a5f] text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSaveNotes(editingNotes.attendeeId, editingNotes.notes)}
                  className="flex-1 h-10 px-4 bg-[#137fec] hover:bg-[#0d5bc4] text-white font-bold rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}