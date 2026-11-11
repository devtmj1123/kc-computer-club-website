'use client';

import { useState } from 'react';
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
  const [errorMessage, setErrorMessage] = useState('');

  const isUserMember = (): boolean => {
    if (!user?.email) return false;
    const userEmail = user.email.toLowerCase().trim();

    if (leaderEmail && leaderEmail.toLowerCase().trim() === userEmail) {
      return true;
    }

    return projectMembers.some((m) => m.email && m.email.toLowerCase().trim() === userEmail);
  };

  const effectiveReadOnly = isReadOnly || !isUserMember();

  const calculateProgress = (items: ChecklistItem[]): number => {
    if (items.length === 0) return 0;
    const completed = items.filter((item) => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const saveItems = async (updatedItems: ChecklistItem[], errorPrefix: string) => {
    if (!checklist || !user?.email) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/projects/${projectId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          userEmail: user.email,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || errorPrefix);
      }

      setChecklist(updatedChecklist);
      onChecklistUpdate?.(updatedChecklist);
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : errorPrefix);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (effectiveReadOnly || !checklist || !user?.email) return;

    const updatedItems = checklist.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : undefined,
          }
        : item
    );

    await saveItems(updatedItems, '更新检查清单失败');
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !checklist || !user?.email) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
      completed: false,
    };

    const saved = await saveItems([...checklist.items, newItem], '添加任务失败');
    if (saved) {
      setNewItemTitle('');
      setNewItemDescription('');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (effectiveReadOnly || !checklist || !user?.email) return;
    await saveItems(
      checklist.items.filter((item) => item.id !== itemId),
      '删除任务失败'
    );
  };

  const AddItemForm = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? 'space-y-3' : 'space-y-3'}>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          任务标题
        </label>
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="输入任务标题…"
          className="h-10 w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-[12px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)]"
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          描述（可选）
        </label>
        <textarea
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          placeholder="输入任务描述…"
          rows={2}
          className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)]"
          disabled={isLoading}
        />
      </div>
      <button
        type="button"
        onClick={handleAddItem}
        disabled={isLoading || !newItemTitle.trim()}
        className="inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-[15px]">
              hourglass_empty
            </span>
            保存中…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[15px]">add</span>
            添加任务
          </>
        )}
      </button>
    </div>
  );

  if (!checklist || !checklist.items || checklist.items.length === 0) {
    return (
      <div className="border border-[var(--rule-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          <span>CHECKLIST / 检查清单</span>
          <span className="text-[var(--primary)]">00</span>
        </div>
        <div className="p-5">
          {errorMessage && (
            <div className="mb-4 border border-[var(--error)]/30 bg-[var(--error-light)] px-3.5 py-2.5">
              <p className="text-[12px] text-[var(--error)]">{errorMessage}</p>
            </div>
          )}

          <p className="text-[12px] leading-[1.9] text-[var(--text-secondary)]">
            {effectiveReadOnly && !isUserMember()
              ? '你不是此项目的成员，无法编辑检查清单。'
              : '还没有检查清单任务。添加第一项，开始跟踪项目进度。'}
          </p>

          {!effectiveReadOnly && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <AddItemForm />
            </div>
          )}
        </div>
      </div>
    );
  }

  const progress = calculateProgress(checklist.items);
  const completedCount = checklist.items.filter((item) => item.completed).length;

  return (
    <div className="border border-[var(--rule-strong)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        <span>CHECKLIST / 检查清单</span>
        <span className="text-[var(--primary)]">
          {String(completedCount).padStart(2, '0')} / {String(checklist.items.length).padStart(2, '0')}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              PROGRESS / 完成进度
            </p>
            <p className="mt-1 font-display text-[30px] font-bold leading-none tracking-[-0.03em] text-[var(--foreground)]">
              {progress}
              <span className="ml-1 font-mono text-[12px] font-normal text-[var(--text-tertiary)]">
                %
              </span>
            </p>
          </div>
          <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
            {completedCount} / {checklist.items.length} 已完成
          </span>
        </div>

        <div className="mt-3 h-[3px] w-full bg-[var(--border)]">
          <div
            className="h-full bg-[var(--primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {errorMessage && (
          <div className="mt-4 border border-[var(--error)]/30 bg-[var(--error-light)] px-3.5 py-2.5">
            <p className="text-[12px] text-[var(--error)]">{errorMessage}</p>
          </div>
        )}

        <div className="mt-5 border-t border-[var(--border)]">
          {checklist.items.map((item, index) => (
            <div
              key={item.id}
              className="group grid grid-cols-[24px_minmax(0,1fr)_24px] items-start gap-3 border-b border-[var(--border)] py-3.5"
            >
              <span className="pt-0.5 font-mono text-[12px] text-[var(--text-tertiary)]">
                {String(index + 1).padStart(2, '0')}
              </span>

              <label className="flex min-w-0 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleItem(item.id)}
                  disabled={effectiveReadOnly || isLoading}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed"
                />
                <span className="min-w-0">
                  <span
                    className={`block text-[12px] font-medium leading-[1.6] transition-colors ${
                      item.completed
                        ? 'text-[var(--text-tertiary)] line-through'
                        : 'text-[var(--foreground)]'
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="mt-1 block text-[12px] leading-[1.8] text-[var(--text-secondary)]">
                      {item.description}
                    </span>
                  )}
                  {item.completedAt && (
                    <span className="mt-1 block font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                      完成于 {new Date(item.completedAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </span>
              </label>

              {!effectiveReadOnly ? (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isLoading}
                  className="shrink-0 text-[var(--text-tertiary)] opacity-0 transition-all hover:text-[var(--error)] group-hover:opacity-100 disabled:opacity-50"
                  title="删除任务"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>

        {!effectiveReadOnly && (
          <div className="mt-5 border-t border-[var(--rule-strong)] pt-5">
            <AddItemForm compact />
          </div>
        )}
      </div>
    </div>
  );
}
