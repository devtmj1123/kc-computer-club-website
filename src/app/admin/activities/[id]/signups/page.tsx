'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
interface Signup {
  $id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  signedUpAt: string;
  status: 'attended' | 'registered' | 'cancelled' | 'pending' | 'confirmed';
}
interface Activity {
  $id: string;
  title: string;
  description?: string;
}
const statusLabels: Record<string, string> = {
  attended: '已参加',
  registered: '已注册',
  cancelled: '已取消',
  pending: '待确认',
  confirmed: '已确认',
};
const statusBgColors: Record<string, string> = {
  attended: 'bg-green-500/10 text-green-400',
  registered: 'bg-blue-500/10 text-blue-400',
  cancelled: 'bg-red-500/10 text-red-400',
  pending: 'bg-amber-500/10 text-amber-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
};
export default function ActivitySignups() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignups, setSelectedSignups] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!authLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);
  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin' && activityId) {
      loadActivityAndSignups();
    }
  }, [user, activityId]);
  const loadActivityAndSignups = async () => {
    try {
      setIsLoading(true);
      const activityRes = await fetch(`/api/activities/${activityId}`);
      const activityData = await activityRes.json();
      if (activityData.success && activityData.activity) {
        setActivity({
          $id: activityData.activity.$id,
          title: activityData.activity.title,
          description: activityData.activity.description,
        });
      }
      const signupsRes = await fetch(`/api/signups?activityId=${activityId}`);
      const signupsData = await signupsRes.json();
      if (signupsData.success && signupsData.signups) {
        const formatted = (signupsData.signups as unknown[]).map((s: unknown) => {
          const signup = s as Record<string, unknown>;
          return {
            $id: (signup.$id as string) || '',
            id: (signup.$id as string) || '',
            name: (signup.studentName as string) || '',
            email: (signup.email as string) || '',
            phone: (signup.phone as string) || '',
            signedUpAt: new Date(signup.createdAt as string).toLocaleDateString('zh-CN'),
            status: (signup.status as 'attended' | 'registered' | 'cancelled' | 'pending' | 'confirmed') || 'pending',
          };
        });
        setSignups(formatted);
      } else {
        setSignups([]);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setSignups([]);
    } finally {
      setIsLoading(false);
    }
  };
  const toggleSelectSignup = (id: string) => {
    const newSelected = new Set(selectedSignups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSignups(newSelected);
  };
  const toggleSelectAll = () => {
    if (selectedSignups.size === signups.length) {
      setSelectedSignups(new Set());
    } else {
      setSelectedSignups(new Set(signups.map((s) => s.id)));
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此报名吗？')) {
      return;
    }
    try {
      const response = await fetch(`/api/signups/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSignups(signups.filter((s) => s.$id !== id));
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除报名失败:', err);
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };
  return (
    <AdminLayout adminName="管理员">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            报名管理 - {activity?.title || '加载中...'}
          </h1>
          <p className="text-gray-400">管理参与者的报名信息。</p>
        </div>
        <Link href="/admin/activities">
          <button className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </Link>
      </div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">总报名人数</p>
          <p className="text-2xl font-bold text-white">{signups.length}</p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">已确认</p>
          <p className="text-2xl font-bold text-blue-400">
            {signups.filter((s) => s.status === 'registered' || s.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">已参加</p>
          <p className="text-2xl font-bold text-green-400">
            {signups.filter((s) => s.status === 'attended').length}
          </p>
        </div>
        <div className="bg-[#1a2632] border border-[#283946] rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">已取消</p>
          <p className="text-2xl font-bold text-red-400">
            {signups.filter((s) => s.status === 'cancelled').length}
          </p>
        </div>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a2632] hover:bg-[#1f2d39] text-gray-400 rounded-lg border border-[#283946] transition-colors">
          <span className="material-symbols-outlined">download</span>
          导出为 Excel
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1a2632] hover:bg-[#1f2d39] text-gray-400 rounded-lg border border-[#283946] transition-colors">
          <span className="material-symbols-outlined">mail</span>
          群发邮件
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
          <span className="material-symbols-outlined">delete</span>
          批量删除
        </button>
      </div>
      <div className="bg-[#1a2632] border border-[#283946] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-600 block mb-3 animate-spin">
              hourglass_bottom
            </span>
            <p className="text-gray-400">加载报名信息中...</p>
          </div>
        ) : signups.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-[#283946] flex items-center justify-between bg-[#1f2d39]">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedSignups.size === signups.length}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
                <span className="text-gray-400 text-sm">
                  已选择 {selectedSignups.size} 条记录
                </span>
              </div>
            </div>
            <div className="divide-y divide-[#283946]">
              {signups.map((signup) => (
                <div
                  key={signup.id}
                  className="px-6 py-4 hover:bg-[#1f2d39] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedSignups.has(signup.id)}
                      onChange={() => toggleSelectSignup(signup.id)}
                      className="cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1">{signup.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            mail
                          </span>
                          {signup.email}
                        </span>
                        {signup.phone && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                              phone
                            </span>
                            {signup.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            calendar_today
                          </span>
                          {signup.signedUpAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                        statusBgColors[signup.status]
                      }`}
                    >
                      {statusLabels[signup.status]}
                    </span>
                    <button 
                      onClick={() => handleDelete(signup.$id || signup.id)}
                      className="p-2 hover:bg-[#283946] rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-600 block mb-3">
              person
            </span>
            <p className="text-gray-400">暂无报名信息</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}