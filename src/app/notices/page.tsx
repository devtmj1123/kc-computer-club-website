'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
interface NormalizedNotice {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date?: string;
  status?: string;
  imageUrl?: string;
  readTime?: string;
  isPinned: boolean;
  $id?: string;
  content?: string;
  createdAt?: string;
  images?: string[];
  tags?: string[];
}
const CATEGORY_OPTIONS = [
  { value: 'all', label: '所有分类' },
  { value: 'general', label: '常规公告' },
  { value: 'event', label: '活动通知' },
  { value: 'urgent', label: '紧急通知' },
];
const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  general: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: '常规' },
  event: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: '活动' },
  urgent: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: '紧急' },
};
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
            let imageUrl =
              'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=450&fit=crop';
            if (notice.images && Array.isArray(notice.images) && notice.images.length > 0) {
              const firstImage = notice.images[0];
              if (firstImage && typeof firstImage === 'string' && firstImage.trim().length > 0) {
                imageUrl = firstImage.trim();
              }
            }
            else if (notice.coverImage) {
              try {
                const parsed = JSON.parse(notice.coverImage as string);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const first = parsed[0];
                  if (first && typeof first === 'string' && first.trim().length > 0) {
                    imageUrl = first.trim();
                  }
                }
              } catch {
                if (typeof notice.coverImage === 'string' && notice.coverImage.trim().length > 0) {
                  imageUrl = notice.coverImage.trim();
                }
              }
            }
            return {
              ...notice,
              id: notice.$id,
              excerpt:
                typeof notice.content === 'string' ? notice.content.substring(0, 150) + '...' : '',
              imageUrl: imageUrl,
              tags: Array.isArray(notice.tags)
                ? notice.tags
                : notice.tags && typeof notice.tags === 'string'
                  ? JSON.parse(notice.tags)
                  : [],
              isPinned: !!notice.pinned,
            };
          });
          setNotices(normalizedNotices);
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
  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const pinnedNotices = filteredNotices.filter((n) => n.isPinned);
  const regularNotices = filteredNotices.filter((n) => !n.isPinned);
  return (
    <StudentLayout>
      <main
        className="flex-1 w-full max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <nav
          className="flex items-center text-sm mb-6 font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Link
            href="/"
            className="hover:text-primary transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            首页
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: 'var(--foreground)' }}>公告</span>
        </nav>
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            公告中心
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>了解俱乐部最新动态、活动通知和重要公告</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="搜索公告标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<span className="material-symbols-outlined text-[20px]">search</span>}
            />
          </div>
          <div className="w-full sm:w-48">
            <NeumorphicSelect
              options={CATEGORY_OPTIONS}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loading size="lg" text="加载公告中..." />
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon="article"
            title="暂无公告"
            description="没有找到符合条件的公告，请尝试调整搜索条件"
          />
        ) : (
          <div className="space-y-8">
            {pinnedNotices.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#13ec80]">push_pin</span>
                  置顶公告
                </h2>
                <div className="grid gap-6">
                  {pinnedNotices.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} featured />
                  ))}
                </div>
              </div>
            )}
            {regularNotices.length > 0 && (
              <div>
                {pinnedNotices.length > 0 && (
                  <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#9db9ab]">article</span>
                    全部公告
                  </h2>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {regularNotices.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {filteredNotices.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)')
              }
            >
              上一页
            </button>
            <button
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              1
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)')
              }
            >
              2
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)')
              }
            >
              3
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)')
              }
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
interface NoticeCardProps {
  notice: NormalizedNotice;
  featured?: boolean;
}
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/​/g, '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function NoticeCard({ notice, featured = false }: NoticeCardProps) {
  const categoryStyle = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.general;
  const decodedTitle = decodeHtmlEntities(notice.title);
  const decodedExcerpt = decodeHtmlEntities(notice.excerpt);
  if (featured) {
    return (
      <Link
        href={`/notices/${notice.id}`}
        className="group block overflow-hidden transition-all"
        style={{
          background: 'var(--nm-bg)',
          boxShadow: 'var(--nm-raised)',
          borderRadius: 22,
          border: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--nm-raised-lg)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--nm-raised)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-80 h-48 md:h-auto relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transform transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${notice.imageUrl})` }}
            />
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: 'linear-gradient(to right, var(--card-bg) 0%, transparent 100%)',
              }}
            />
          </div>
          <div className="flex-1 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant="primary"
                className="bg-primary/10 text-primary border border-primary/20"
              >
                置顶
              </Badge>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${categoryStyle.bg} ${categoryStyle.text} border border-current/20`}
              >
                {categoryStyle.label}
              </span>
            </div>
            {notice.tags && notice.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {notice.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: 'var(--tag-bg)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--tag-border)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h3
              className="text-xl font-bold mb-2 transition-colors line-clamp-2 group-hover:text-primary"
              style={{ color: 'var(--foreground)' }}
            >
              {decodedTitle}
            </h3>
            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {decodedExcerpt}
            </p>
            <div
              className="flex items-center gap-4 text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{notice.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>{notice.author}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>{notice.readTime}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href={`/notices/${notice.id}`}
      className="group block overflow-hidden transition-all"
      style={{
        background: 'var(--nm-bg)',
        boxShadow: 'var(--nm-raised)',
        borderRadius: 22,
        border: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--nm-raised-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--nm-raised)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transform transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${notice.imageUrl})` }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: 'linear-gradient(to top, var(--card-bg) 0%, transparent 100%)' }}
        />
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${categoryStyle.bg} ${categoryStyle.text} backdrop-blur-sm`}
          >
            {categoryStyle.label}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3
          className="text-base font-bold mb-2 transition-colors line-clamp-2 group-hover:text-primary"
          style={{ color: 'var(--foreground)' }}
        >
          {decodedTitle}
        </h3>
        {notice.tags && notice.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {notice.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--tag-bg)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--tag-border)',
                }}
              >
                {tag}
              </span>
            ))}
            {notice.tags.length > 2 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--tag-bg)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--tag-border)',
                }}
              >
                +{notice.tags.length - 2}
              </span>
            )}
          </div>
        )}
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {decodedExcerpt}
        </p>
        <div
          className="flex items-center justify-between text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>{notice.date}</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: 'var(--primary)' }}>
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{notice.readTime}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}