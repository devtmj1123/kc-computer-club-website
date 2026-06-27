'use client';

import { useState, useEffect } from 'react';
import { ProjectChecklist, ChecklistItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectChecklistProps {
  projectId: string;
  checklist?: ProjectChecklist;
  isReadOnly?: boolean;
  onChecklistUpdate?: (updatedChecklist: ProjectChecklist) => void;
  projectMembers?: Array<{ email: string; role?: string }>;
  leaderEmail?: string;
}

export function ProjectChecklistComponent({
  projectId,
  checklist: initialChecklist,
  isReadOnly = false,
  onChecklistUpdate,
  projectMembers = [],
  leaderEmail,
}: ProjectChecklistProps) {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ProjectChecklist | null>(initialChecklist || null);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  const isUserMember = (): boolean => {
    if (!user?.email) return false;
    const userEmail = user.email.toLowerCase().trim();

    if (leaderEmail && leaderEmail.toLowerCase().trim() === userEmail) {
      return true;
    }

    return projectMembers.some(m =>
      m.email && m.email.toLowerCase().trim() === userEmail
    );
  };

  const effectiveReadOnly = isReadOnly || !isUserMember();

  const calculateProgress = (items: ChecklistItem[]): number => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const handleToggleItem = async (itemId: string) => {
    if (effectiveReadOnly || !checklist || !user?.email) return;

    setIsLoading(true);
    try {
      const updatedItems = checklist.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : undefined,
            }
          : item
      );

      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/projects/${projectId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems, userEmail: user.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新检查清单失败');
      }

      setChecklist(updatedChecklist);
      onChecklistUpdate?.(updatedChecklist);
    } catch (err) {
      console.error('更新检查清单失败:', err);
      alert(err instanceof Error ? err.message : '更新检查清单失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !checklist || !user?.email) return;

    setIsLoading(true);
    try {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        title: newItemTitle,
        description: newItemDescription || undefined,
        completed: false,
      };

      const updatedItems = [...checklist.items, newItem];
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/projects/${projectId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems, userEmail: user.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '添加项目失败');
      }

      setChecklist(updatedChecklist);
      setNewItemTitle('');
      setNewItemDescription('');
      onChecklistUpdate?.(updatedChecklist);
    } catch (err) {
      console.error('添加项目失败:', err);
      alert(err instanceof Error ? err.message : '添加项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (effectiveReadOnly || !checklist || !user?.email) return;

    setIsLoading(true);
    try {
      const updatedItems = checklist.items.filter(item => item.id !== itemId);
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/projects/${projectId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems, userEmail: user.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除项目失败');
      }

      setChecklist(updatedChecklist);
      onChecklistUpdate?.(updatedChecklist);
    } catch (err) {
      console.error('删除项目失败:', err);
      alert(err instanceof Error ? err.message : '删除项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!checklist || !checklist.items || checklist.items.length === 0) {
    return (
      <div className="bg-[var(--nm-bg)] rounded-[28px] p-6 lg:p-8 shadow-[var(--nm-raised)]">
        <h3 className="text-lg font-bold mb-4">项目检查清单</h3>
        {effectiveReadOnly && !isUserMember() ? (
          <p className="text-gray-400 mb-6">你不是此项目的成员，无法编辑检查清单</p>
        ) : (
          <p className="text-gray-400 mb-6">还没有检查清单项目</p>
        )}

        {!effectiveReadOnly && (
          <div className="space-y-4">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="输入任务标题..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none"
              disabled={isLoading}
            />
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="输入任务描述（可选）..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleAddItem}
              disabled={isLoading || !newItemTitle.trim()}
              className="w-full px-4 py-2 bg-[#13ec80] hover:bg-[#0fd673] text-[#102219] font-bold rounded-2xl shadow-[var(--nm-raised-sm)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '添加中...' : '添加第一个任务'}
            </button>
          </div>
        )}
      </div>
    );
  }

  const progress = calculateProgress(checklist.items);

  return (
    <div className="bg-[var(--nm-bg)] rounded-[28px] p-6 lg:p-8 shadow-[var(--nm-raised)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">项目检查清单</h3>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-black text-[#13ec80]">{progress}%</p>
            <p className="text-xs text-gray-400">进度</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden shadow-[var(--nm-inset-sm)]">
          <div
            className="h-full bg-[#13ec80] transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {checklist.items.filter(item => item.completed).length} / {checklist.items.length} 已完成
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {checklist.items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset-sm)] group"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggleItem(item.id)}
              disabled={effectiveReadOnly || isLoading}
              className="mt-1 w-5 h-5 rounded cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium transition-all ${
                  item.completed
                    ? 'text-[var(--text-secondary)] line-through'
                    : 'text-[var(--foreground)]'
                }`}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">{item.description}</p>
              )}
              {item.completedAt && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  ✓ 完成于 {new Date(item.completedAt).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
            {!effectiveReadOnly && (
              <button
                onClick={() => handleDeleteItem(item.id)}
                disabled={isLoading}
                className="shrink-0 p-1 text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {!effectiveReadOnly && (
        <div className="pt-4 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="输入新任务..."
            className="w-full px-3 py-2 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] text-sm focus:outline-none"
            disabled={isLoading}
          />
          <textarea
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
            placeholder="任务描述（可选）..."
            rows={2}
            className="w-full px-3 py-2 rounded-2xl bg-[var(--nm-bg)] shadow-[var(--nm-inset)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] text-sm focus:outline-none resize-none"
            disabled={isLoading}
          />
          <button
            onClick={handleAddItem}
            disabled={isLoading || !newItemTitle.trim()}
            className="w-full px-3 py-2 bg-[#13ec80] hover:bg-[#0fd673] text-[#102219] font-bold rounded-2xl shadow-[var(--nm-raised-sm)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? '添加中...' : '添加任务'}
          </button>
        </div>
      )}
    </div>
  );
}
