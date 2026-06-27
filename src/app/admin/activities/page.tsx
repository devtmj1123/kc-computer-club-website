'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
interface Activity {
  $id: string;
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  currentParticipants: number;
  maxParticipants?: number;
  signupDeadline: string;
  status: 'published' | 'draft' | 'cancelled' | 'ongoing' | 'completed';
}
const statuses = ['全部', 'published', 'draft', 'cancelled'];
const statusLabels: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  cancelled: '已取消',
};
export default function AdminActivities() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  useEffect(() => {
    if (!authLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/activities');
        const data = await response.json();
        if (data.success && data.activities) {
          const formatted = data.activities.map((a: Record<string, unknown>) => ({
            ...a,
            id: a.$id,
          }));
          setActivities(formatted);
        } else {
          setActivities([]);
        }
      } catch (err) {
        console.error('加载活动失败:', err);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (user && 'role' in user && user.role === 'admin') {
      loadActivities();
    }
  }, [user]);
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setActivities(activities.filter((a) => a.$id !== id));
        setDeleteId(null);
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };
  const filteredActivities = activities.filter((activity) => {
    const matchSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location.includes(searchTerm);
    const matchStatus = selectedStatus === '全部' || activity.status === selectedStatus;
    return matchSearch && matchStatus;
  });
  return (
    <AdminLayout adminName="管理员">
      <div style={{ backgroundColor: '#101922', color: 'white', minHeight: '100vh' }} className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 text-white">活动管理</h1>
          <p className="text-[#8ba3a6]">管理社团的所有活动，支持创建、编辑和取消活动。</p>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1">
            <Input
              placeholder="搜索活动名称或地点..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon="search"
            />
          </div>
          <Link href="/admin/activities/create">
            <Button 
              variant="primary" 
              leftIcon="add"
              style={{ backgroundColor: '#137fec', color: 'white' }}
            >
              创建活动
            </Button>
          </Link>
        </div>
        <div className="mb-6 flex gap-2 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all`}
              style={{
                backgroundColor: selectedStatus === status ? '#137fec' : '#1a2632',
                color: selectedStatus === status ? 'white' : '#8ba3a6',
                border: `1px solid ${selectedStatus === status ? '#137fec' : '#2a3c4a'}`,
              }}
            >
              {status === '全部' ? '全部' : statusLabels[status]}
            </button>
          ))}
        </div>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 border border-[#2a3c4a]" style={{ backgroundColor: '#1a2632' }}>
            <p className="text-sm mb-1 text-[#8ba3a6]">活动总数</p>
            <p className="text-2xl font-bold text-[#137fec]">{activities.length}</p>
          </div>
          <div className="rounded-xl p-4 border border-[#2a3c4a]" style={{ backgroundColor: '#1a2632' }}>
            <p className="text-sm mb-1 text-[#8ba3a6]">已发布</p>
            <p className="text-2xl font-bold text-[#137fec]">
              {activities.filter((a) => a.status === 'published').length}
            </p>
          </div>
          <div className="rounded-xl p-4 border border-[#2a3c4a]" style={{ backgroundColor: '#1a2632' }}>
            <p className="text-sm mb-1 text-[#8ba3a6]">草稿中</p>
            <p className="text-2xl font-bold text-[#137fec]">
              {activities.filter((a) => a.status === 'draft').length}
            </p>
          </div>
          <div className="rounded-xl p-4 border border-[#2a3c4a]" style={{ backgroundColor: '#1a2632' }}>
            <p className="text-sm mb-1 text-[#8ba3a6]">参与人数</p>
            <p className="text-2xl font-bold text-[#137fec]">
              {activities.reduce((sum, a) => sum + (a.currentParticipants || 0), 0)}
            </p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-[#2a3c4a]" style={{ backgroundColor: '#1a2632' }}>
          {isLoading ? (
            <div className="px-6 py-12 flex justify-center">
              <Loading size="sm" text="加载活动中..." />
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="divide-y divide-[#2a3c4a]">
              {filteredActivities.map((activity) => {
                let statusBg = '';
                let statusText = '';
                let statusLabel = '';
                if (activity.status === 'published') {
                  statusBg = 'bg-green-900/30';
                  statusText = 'text-green-400';
                  statusLabel = '已发布';
                } else if (activity.status === 'draft') {
                  statusBg = 'bg-amber-900/30';
                  statusText = 'text-amber-400';
                  statusLabel = '草稿';
                } else {
                  statusBg = 'bg-red-900/30';
                  statusText = 'text-red-400';
                  statusLabel = '已取消';
                }
                return (
                  <div
                    key={activity.id}
                    className="px-6 py-4 transition-colors flex items-center justify-between"
                    style={{ backgroundColor: '#1a2632', color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#243342'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a2632'}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold truncate flex-1 text-white">
                          {activity.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${statusBg} ${statusText}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-wrap text-[#8ba3a6]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            calendar_today
                          </span>
                          {new Date(activity.startTime).toLocaleDateString('zh-CN')} {new Date(activity.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {activity.location}
                        </span>
                        {activity.status === 'published' && (
                          <>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">group</span>
                              {activity.currentParticipants}/{activity.maxParticipants || '无限'} 人已报名
                            </span>
                            {activity.maxParticipants && (
                              <span className="text-blue-600 font-medium">
                                {Math.round((activity.currentParticipants / activity.maxParticipants) * 100)}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2 shrink-0">
                      <Link href={`/admin/activities/${activity.id}/edit`}>
                        <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-[#137fec] transition-colors" title="编辑">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </Link>
                      <Link href={`/admin/activities/${activity.id}/signups`}>
                        <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-[#137fec] transition-colors" title="查看报名">
                          <span className="material-symbols-outlined">group</span>
                        </button>
                      </Link>
                      <button 
                        onClick={() => setDeleteId(activity.$id)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500 transition-colors" 
                        title="删除"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-6xl text-[#2a3c4a] block mb-3">
                event
              </span>
              <p className="text-[#8ba3a6] mb-4">没有找到活动</p>
              <Link href="/admin/activities/create">
                <Button 
                  variant="primary"
                  style={{ backgroundColor: '#137fec', color: 'white' }}
                >
                  创建第一个活动
                </Button>
              </Link>
            </div>
          )}
        </div>
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a2632] border border-[#2a3c4a] rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-white font-bold text-lg mb-2">确定删除此活动？</h3>
              <p className="text-[#8ba3a6] text-sm mb-6">
                删除后将无法恢复，该活动的所有报名数据也将被清除。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-[#283039] text-[#8ba3a6] rounded-lg hover:bg-[#343d48] transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting && (
                    <span className="material-symbols-outlined animate-spin text-sm">
                      hourglass_bottom
                    </span>
                  )}
                  {isDeleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}