'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
export default function TakeAttendancePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
          <p className="text-white/50 text-xs font-medium uppercase mb-2">Total Members</p>
          <p className="text-3xl font-bold text-white">45</p>
        </div>
        <div className="bg-surface-dark border border-blue-600/20 rounded-xl p-6 shadow-[0_0_15px_rgba(37,99,235,0.05)]">
          <p className="text-blue-400 text-xs font-medium uppercase mb-2">Present</p>
          <p className="text-3xl font-bold text-blue-400">32</p>
        </div>
        <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
          <p className="text-white/50 text-xs font-medium uppercase mb-2">Absent</p>
          <p className="text-3xl font-bold text-white">13</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">
            search
          </span>
          <input
            className="w-full bg-surface-dark border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Search by name or ID..."
            type="text"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm transition hover:opacity-90">
            All Members
          </button>
          <button className="px-4 py-2 rounded-lg bg-surface-dark text-white font-medium text-sm border border-white/5 hover:bg-white/5 transition">
            Students
          </button>
          <button className="px-4 py-2 rounded-lg bg-surface-dark text-white font-medium text-sm border border-white/5 hover:bg-white/5 transition">
            Mentors
          </button>
        </div>
      </div>
      <div className="bg-surface-dark border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-medium text-white/40 uppercase tracking-wider bg-black/20">
          <div className="col-span-4">Member Details</div>
          <div className="col-span-3">Check-in Time</div>
          <div className="col-span-5 text-right">Status</div>
        </div>
        <div className="divide-y divide-white/5">
          {[
            {
              name: 'Sarah Jenkins',
              id: '#ST-4092',
              role: 'Student',
              time: '17:59 PM',
              status: 'Present',
              statusColor: 'bg-blue-600',
            },
            {
              name: 'Marcus Johnson',
              id: '#MT-1022',
              role: 'Mentor',
              time: '16:15 PM',
              status: 'Late',
              statusColor: 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-500',
            },
            {
              name: 'Elena Rodriguez',
              id: '#ST-4291',
              role: 'Student',
              time: '17:48 PM',
              status: 'Present',
              statusColor: 'bg-blue-600',
            },
          ].map((member, idx) => (
            <div
              key={idx}
              className="group hover:bg-white/5 transition-colors grid grid-cols-12 gap-4 px-6 py-4 items-center"
            >
              <div className="col-span-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-medium">{member.name}</h3>
                  <p className="text-blue-400 text-xs">{member.id} • {member.role}</p>
                </div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="material-symbols-outlined text-base text-blue-400">
                    schedule
                  </span>
                  {member.time}
                </div>
              </div>
              <div className="col-span-5 flex justify-end gap-2">
                <button
                  className={`px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all ${
                    member.status === 'Present'
                      ? `${member.statusColor} text-white`
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Present
                </button>
                <button
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    member.status === 'Late'
                      ? member.statusColor
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Late
                </button>
                <button
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    member.status === 'Absent'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-500'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 right-0 left-0 border-t border-white/5 bg-background-dark/80 backdrop-blur px-8 py-4 flex justify-between items-center">
        <p className="text-white/60 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-blue-400">info</span>
          Please verify all statuses before submitting.
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-2 rounded-lg bg-surface-dark text-white font-medium border border-white/5 hover:bg-white/5 transition">
            Cancel
          </button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg">
            <span className="material-symbols-outlined align-middle mr-2">check_circle</span>
            Submit Attendance
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}