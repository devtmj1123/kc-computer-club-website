'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
interface Signup {
  id: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  signupDate: string;
  createdAt: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  grade: string;
}
export default function AdminSignups() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [filteredSignups, setFilteredSignups] = useState<Signup[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin') {
      loadSignups();
    }
  }, [user]);
  useEffect(() => {
    let filtered = signups;
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.activityTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }
    setFilteredSignups(filtered);
  }, [signups, searchTerm, filterStatus]);
  const loadSignups = async () => {
    try {
      setIsLoadingData(true);
      setError('');
      const response = await fetch('/api/signups');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '加载报名数据失败');
      }
      const allSignups: Signup[] = (data.signups || []).map(
        (signup: Record<string, unknown>) => {
          const rawStatus = String(signup.status || 'pending');
          const status: Signup['status'] =
            rawStatus === 'confirmed' ||
            rawStatus === 'registered' ||
            rawStatus === 'attended'
              ? 'confirmed'
              : rawStatus === 'cancelled'
                ? 'cancelled'
                : 'pending';
          const createdAt = String(signup.createdAt || '');
          return {
            id: String(signup.id || signup.$id || ''),
            activityId: String(signup.activityId || ''),
            activityTitle: String(signup.activityTitle || ''),
            studentId: String(signup.studentId || ''),
            studentName: String(signup.studentName || '未知学生'),
            studentEmail: String(signup.studentEmail || ''),
            signupDate: createdAt
              ? new Date(createdAt).toLocaleDateString('zh-CN')
              : '',
            createdAt,
            status,
            grade: String(signup.grade || ''),
          };
        }
      );
      allSignups.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSignups(allSignups);
      setFilteredSignups(allSignups);
    } catch (err) {
      console.error('加载报名数据失败:', err);
      setError(err instanceof Error ? err.message : '加载报名数据失败');
    } finally {
      setIsLoadingData(false);
    }
  };
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/signups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '更新报名状态失败');
      }
      setSignups((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: newStatus as 'confirmed' | 'pending' | 'cancelled' } : s
        )
      );
    } catch (err) {
      console.error('更新报名状态失败:', err);
      alert(err instanceof Error ? err.message : '更新报名状态失败');
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[var(--primary)]/10 text-[var(--primary)]';
      case 'pending':
        return 'bg-[var(--warning)]/10 text-[var(--warning)]';
      case 'cancelled':
        return 'bg-[var(--error)]/10 text-[var(--error)]';
      default:
        return 'bg-[var(--surface-hover)]/10 text-[var(--text-secondary)]';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '已确认';
      case 'pending':
        return '待确认';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="material-symbols-outlined text-[var(--primary)] text-5xl">hourglass_bottom</span>
          </div>
          <p className="text-[var(--foreground)]">加载中...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <AdminLayout adminName="管理员">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">活动报名管理</h1>
        <p className="text-[var(--text-secondary)]">管理所有学生的活动报名申请</p>
      </div>
      <div className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">搜索学生或活动</label>
            <input
              type="text"
              placeholder="输入学生名字、邮箱或活动名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">状态</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'confirmed' | 'pending' | 'cancelled')}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="all">全部</option>
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={loadSignups}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
            >
              <span className="material-symbols-outlined mr-2">refresh</span>
              刷新
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-1">总报名数</p>
          <p className="text-3xl font-black text-[var(--foreground)]">{signups.length}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-1">待确认</p>
          <p className="text-3xl font-black text-[var(--warning)]">{signups.filter((s) => s.status === 'pending').length}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-1">已确认</p>
          <p className="text-3xl font-black text-[var(--primary)]">{signups.filter((s) => s.status === 'confirmed').length}</p>
        </div>
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4">
          <h2 className="text-lg font-bold text-[var(--foreground)] flex-1">报名列表</h2>
          <span className="text-[var(--text-secondary)] text-sm">{filteredSignups.length} 条结果</span>
        </div>
        {error && (
          <div className="px-6 py-3 bg-[var(--error)]/10 border-b border-[var(--error)]/20">
            <p className="text-[var(--error)] text-sm">{error}</p>
          </div>
        )}
        <div className="divide-y divide-[var(--border)]">
          {isLoadingData ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] mb-4 block animate-spin">
                hourglass_bottom
              </span>
              <p className="text-[var(--text-secondary)]">加载报名记录中...</p>
            </div>
          ) : filteredSignups.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] mb-4 block">
                inbox
              </span>
              <p className="text-[var(--text-secondary)]">没有找到匹配的报名记录</p>
            </div>
          ) : (
            filteredSignups.map((signup) => (
              <div
                key={signup.id}
                className="px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-[var(--foreground)] font-semibold">{signup.studentName}</h3>
                      <p className="text-[var(--text-secondary)] text-sm">{signup.studentEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--foreground)] font-semibold">{signup.activityTitle}</p>
                      <p className="text-[var(--text-secondary)] text-sm">{signup.signupDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[var(--text-secondary)] text-sm">
                      {signup.grade && <span>{signup.grade}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={signup.status}
                        onChange={(e) => handleStatusChange(signup.id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${getStatusColor(signup.status)}`}
                      >
                        <option value="pending">待确认</option>
                        <option value="confirmed">已确认</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}