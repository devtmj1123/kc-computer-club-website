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
  status: 'confirmed' | 'pending' | 'cancelled';
  grade: string;
}
export default function AdminSignups() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [filteredSignups, setFilteredSignups] = useState<Signup[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [selectedSignups, setSelectedSignups] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isLoading && !user) {
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
      const activitiesRes = await fetch('/api/activities');
      const activitiesData = await activitiesRes.json();
      const activities = activitiesData.success ? (activitiesData.activities || []) : [];
      const allSignups: Signup[] = [];
      for (const activity of activities) {
        try {
          const signupsRes = await fetch(`/api/signups?activityId=${activity.$id}`);
          const signupsData = await signupsRes.json();
          if (signupsData.success && Array.isArray(signupsData.signups)) {
            signupsData.signups.forEach((signup: Record<string, unknown>) => {
              allSignups.push({
                id: signup.$id as string,
                activityId: activity.$id,
                activityTitle: activity.title as string,
                studentId: (signup.studentId as string) || '',
                studentName: (signup.studentName as string) || '未知学生',
                studentEmail: (signup.studentEmail as string) || '',
                signupDate: new Date(signup.$createdAt as string).toLocaleDateString('zh-CN'),
                status: (signup.status as 'confirmed' | 'pending' | 'cancelled') || 'pending',
                grade: (signup.grade as string) || '',
              });
            });
          }
        } catch (err) {
          console.error(`加载活动 ${activity.$id} 的报名失败:`, err);
        }
      }
      allSignups.sort((a, b) => new Date(b.signupDate).getTime() - new Date(a.signupDate).getTime());
      setSignups(allSignups);
      setFilteredSignups(allSignups);
    } catch (err) {
      console.error('加载报名数据失败:', err);
    } finally {
      setIsLoadingData(false);
    }
  };
  const handleSelectSignup = (id: string) => {
    const newSelected = new Set(selectedSignups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSignups(newSelected);
  };
  const handleSelectAll = () => {
    if (selectedSignups.size === filteredSignups.length) {
      setSelectedSignups(new Set());
    } else {
      setSelectedSignups(new Set(filteredSignups.map((s) => s.id)));
    }
  };
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/signups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSignups((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: newStatus as 'confirmed' | 'pending' | 'cancelled' } : s
          )
        );
      }
    } catch (err) {
      console.error('更新报名状态失败:', err);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-400';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a1220]">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="material-symbols-outlined text-[#137fec] text-5xl">hourglass_bottom</span>
          </div>
          <p className="text-white">加载中...</p>
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
        <h1 className="text-3xl font-black text-white mb-2">活动报名管理</h1>
        <p className="text-gray-400">管理所有学生的活动报名申请</p>
      </div>
      <div className="mb-6 bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">搜索学生或活动</label>
            <input
              type="text"
              placeholder="输入学生名字、邮箱或活动名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f1a25] border border-[#283946] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">状态</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'confirmed' | 'pending' | 'cancelled')}
              className="w-full px-4 py-2 bg-[#0f1a25] border border-[#283946] rounded-lg text-white focus:outline-none focus:border-[#137fec]"
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
              className="w-full bg-[#137fec] hover:bg-[#0f5fcc]"
            >
              <span className="material-symbols-outlined mr-2">refresh</span>
              刷新
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">总报名数</p>
          <p className="text-3xl font-black text-white">{signups.length}</p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">待确认</p>
          <p className="text-3xl font-black text-amber-400">{signups.filter((s) => s.status === 'pending').length}</p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">已确认</p>
          <p className="text-3xl font-black text-green-400">{signups.filter((s) => s.status === 'confirmed').length}</p>
        </div>
      </div>
      <div className="bg-[#1a2632] border border-[#283946] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#283946] flex items-center gap-4">
          <input
            type="checkbox"
            checked={selectedSignups.size === filteredSignups.length && filteredSignups.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 cursor-pointer"
          />
          <h2 className="text-lg font-bold text-white flex-1">报名列表</h2>
          <span className="text-gray-400 text-sm">{filteredSignups.length} 条结果</span>
        </div>
        <div className="divide-y divide-[#283946]">
          {filteredSignups.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-600 mb-4 block">
                inbox
              </span>
              <p className="text-gray-400">没有找到匹配的报名记录</p>
            </div>
          ) : (
            filteredSignups.map((signup) => (
              <div
                key={signup.id}
                className="px-6 py-4 hover:bg-[#1f2d39] transition-colors flex items-center gap-4"
              >
                <input
                  type="checkbox"
                  checked={selectedSignups.has(signup.id)}
                  onChange={() => handleSelectSignup(signup.id)}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{signup.studentName}</h3>
                      <p className="text-gray-500 text-sm">{signup.studentEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{signup.activityTitle}</p>
                      <p className="text-gray-500 text-sm">{signup.signupDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400 text-sm">
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