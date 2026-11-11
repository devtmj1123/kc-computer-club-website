'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { decodeHtmlEntities } from '@/lib/utils';

interface NormalizedNotice {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date?: string;
  isPinned: boolean;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<NormalizedNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    const loadNotices = async () => {
      try {
        setIsLoading(true);
        const visibility = user ? 'all' : 'public';
        const response = await fetch(`/api/notices?onlyPublished=true&visibility=${visibility}`);
        const data = await response.json();
        if (data.success && data.notices) {
          const normalizedNotices = data.notices.map((notice: Record<string, unknown>) => {
            const rawContent = typeof notice.content === 'string' ? notice.content : '';
            return {
              id: String(notice.$id || notice.id || ''),
              title: decodeHtmlEntities(String(notice.title || '')),
              excerpt: decodeHtmlEntities(stripHtml(rawContent)).slice(0, 180),
              category: String(notice.category || '其他'),
              author: String(notice.author || '电脑学会'),
              date: (notice.publishedAt || notice.createdAt || notice.$createdAt) as
                | string
                | undefined,
              isPinned: Boolean(notice.pinned),
            };
          });
          setNotices(normalizedNotices.filter((notice: NormalizedNotice) => notice.id));
        }
      } catch (err) {
        console.error('加载公告失败:', err);
        setNotices([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadNotices();
  }, [user]);

  const categoryOptions = [
    { value: 'all', label: '所有分类' },
    ...Array.from(new Set(notices.map((notice) => notice.category))).map((category) => ({
      value: category,
      label: category,
    })),
  ];

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotices = filteredNotices.filter((notice) => notice.isPinned);
  const regularNotices = filteredNotices.filter((notice) => !notice.isPinned);

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">公告</span>
        </nav>

        <header className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">PUBLIC NOTICES · 公告中心</div>
            <h1 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
              了解社团的
              <br />
              <span className="text-[var(--primary)]">最新动态。</span>
            </h1>
            <p className="mt-5 max-w-xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
              活动通知、社团安排与重要公告都会在这里发布。可按关键词或分类筛选。
            </p>
          </div>
          <div className="shrink-0 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {String(filteredNotices.length).padStart(2, '0')} 条公告
          </div>
        </header>

        <div className="flex flex-col gap-3 border-b border-[var(--border)] py-5 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="搜索公告标题或内容…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon="search"
            />
          </div>
          <div className="w-full sm:w-44">
            <NeumorphicSelect
              options={categoryOptions}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Loading notices…
            </span>
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon="article"
            title="暂无公告"
            description="没有找到符合条件的公告，请尝试调整搜索或分类条件。"
            className="mt-10"
          />
        ) : (
          <div className="mt-10 space-y-10">
            {pinnedNotices.length > 0 && (
              <section>
                <div className="mb-1 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--primary)]">
                  <span className="material-symbols-outlined text-[13px]">push_pin</span>
                  置顶公告
                </div>
                {pinnedNotices.map((notice) => (
                  <NoticeRow key={notice.id} notice={notice} featured />
                ))}
              </section>
            )}

            {regularNotices.length > 0 && (
              <section>
                {pinnedNotices.length > 0 && (
                  <div className="mb-1 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    全部公告
                  </div>
                )}
                {regularNotices.map((notice) => (
                  <NoticeRow key={notice.id} notice={notice} />
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </StudentLayout>
  );
}

function NoticeRow({ notice, featured = false }: { notice: NormalizedNotice; featured?: boolean }) {
  return (
    <Link
      href={`/notices/${notice.id}`}
      className={`group grid grid-cols-[1fr_auto] gap-x-5 gap-y-2 border-b border-[var(--border)] py-6 transition-colors hover:bg-[var(--primary-light)] sm:grid-cols-[88px_minmax(0,1fr)_110px_18px] sm:items-start sm:px-3 ${
        featured ? 'border-l-2 border-l-[var(--primary)] pl-4 sm:pl-5' : ''
      }`}
    >
      <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--primary)]">
        {notice.category}
      </span>

      <span className="text-right font-mono text-[12px] tracking-[0.06em] text-[var(--text-tertiary)] sm:hidden">
        {formatDate(notice.date)}
      </span>

      <span className="col-span-2 min-w-0 sm:col-span-1">
        <span className="block font-display text-[19px] font-semibold leading-[1.45] tracking-[-0.01em] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)] sm:text-[21px]">
          {notice.title}
        </span>
        {notice.excerpt && (
          <span className="mt-2 line-clamp-2 block max-w-3xl text-[12px] leading-[1.8] text-[var(--text-secondary)]">
            {notice.excerpt}
          </span>
        )}
        <span className="mt-2 block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          {notice.author}
        </span>
      </span>

      <span className="hidden pt-1 font-mono text-[12px] tracking-[0.06em] text-[var(--text-tertiary)] sm:block">
        {formatDate(notice.date)}
      </span>

      <span className="hidden pt-0.5 text-[13px] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--primary)] sm:block">
        ↗
      </span>
    </Link>
  );
}
