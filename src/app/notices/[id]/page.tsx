'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ImageCarousel } from '@/components/notices/ImageCarousel';
import { CommentForm } from '@/components/comments/CommentForm';
import { CommentList } from '@/components/comments/CommentList';
import { Comment } from '@/services/comment.service';
import { Notice } from '@/services/notice.service';
import { decodeHtmlEntities } from '@/lib/utils';
const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  公告: { bg: 'bg-primary/10', text: 'text-primary' },
  比赛: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  紧急: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  维护: { bg: 'bg-red-500/10', text: 'text-red-400' },
  课程: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  工作坊: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
};
function calculateReadingTime(content: string): number {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, '');
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const englishWords = text.match(/\b[a-zA-Z]+\b/g)?.length || 0;
  const readingTime = Math.ceil((chineseChars / 300 + englishWords / 200) / 2);
  return Math.max(1, readingTime);
}
export default function NoticeDetailPage() {
  const params = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState('');
  const [relatedNotices, setRelatedNotices] = useState<Notice[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(true);
  useEffect(() => {
    const loadNotice = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch(`/api/notices/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setNotice(data.notice);
          try {
            const relatedResponse = await fetch(
              `/api/notices?category=${data.notice.category}&limit=5`
            );
            const relatedData = await relatedResponse.json();
            if (relatedData.success && relatedData.notices) {
              const filtered = relatedData.notices
                .filter((n: Notice) => n.$id !== params.id)
                .map((n: Notice) => {
                  const nWithCover = n as Notice & { coverImage?: string };
                  return {
                    ...n,
                    images: Array.isArray(n.images)
                      ? n.images
                      : nWithCover.coverImage
                        ? Array.isArray(nWithCover.coverImage)
                          ? nWithCover.coverImage
                          : typeof nWithCover.coverImage === 'string'
                            ? (() => {
                                try {
                                  const parsed = JSON.parse(nWithCover.coverImage);
                                  return Array.isArray(parsed) ? parsed : [nWithCover.coverImage];
                                } catch {
                                  return [nWithCover.coverImage];
                                }
                              })()
                            : []
                        : [],
                  };
                })
                .slice(0, 3);
              setRelatedNotices(filtered);
            }
          } catch (relatedErr) {
            console.warn('Failed to load related notices:', relatedErr);
          }
        } else {
          setError(data.error || '加载公告失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) {
      loadNotice();
    }
  }, [params.id]);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  const handlePrint = () => {
    window.print();
  };
  const loadComments = async (noticeId: string) => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/comments?contentType=notice&contentId=${noticeId}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  useEffect(() => {
    if (notice?.$id) {
      loadComments(notice.$id);
    }
  }, [notice?.$id]);
  if (isLoading) {
    return (
      <StudentLayout>
        <main
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          <Loading size="lg" text="加载公告详情..." />
        </main>
      </StudentLayout>
    );
  }
  if (!notice || error) {
    return (
      <StudentLayout>
        <main
          className="flex-1 flex flex-col items-center justify-center py-20"
          style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          <span
            className="material-symbols-outlined text-6xl mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            article_shortcut
          </span>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {error || '公告不存在'}
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            请检查链接是否正确，或返回公告列表
          </p>
          <Link href="/notices">
            <Button variant="primary" leftIcon="arrow_back">
              返回公告列表
            </Button>
          </Link>
        </main>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <main
        className="flex-1 w-full mx-auto py-8"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <article className="flex-1 min-w-0">
              <nav
                className="flex items-center text-sm mb-6 font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Link
                  href="/"
                  className="transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  首页
                </Link>
                <span className="mx-2">/</span>
                <Link
                  href="/notices"
                  className="transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  公告
                </Link>
                <span className="mx-2">/</span>
                <span style={{ color: 'var(--foreground)' }} className="truncate max-w-50">
                  {decodeHtmlEntities(notice.title)}
                </span>
              </nav>
              <header className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(notice.tags) &&
                    notice.tags.map((tag: string) => {
                      const style = TAG_STYLES[tag] || {
                        bg: 'bg-gray-500/10',
                        text: 'text-gray-400',
                      };
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} border border-current/20`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                </div>
                <h1
                  className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-4 tracking-[-0.02em]"
                  style={{ color: 'var(--foreground)' }}
                >
                  {decodeHtmlEntities(notice.title)}
                </h1>
                <div
                  className="flex items-center gap-4 text-sm flex-wrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-[#9db9ab]"></span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span>{notice.author}</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-[#9db9ab]"></span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>{calculateReadingTime(notice.content)} 分钟阅读</span>
                  </div>
                </div>
                {notice.lastEditorName && (
                  <div
                    className="mt-4 pt-4 text-xs"
                    style={{
                      borderTopColor: 'var(--border)',
                      borderTopWidth: '1px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>最后编辑：{notice.lastEditorName}</span>
                    {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                      <span> • {new Date(notice.updatedAt).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                )}
              </header>
              {notice.images && notice.images.length > 0 && (
                <div className="my-10">
                  <ImageCarousel
                    images={notice.images}
                    title={notice.title}
                    showThumbnails={true}
                  />
                </div>
              )}
              <div
                className="prose prose-lg max-w-none wrap-break-word whitespace-pre-wrap [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_strong]:font-bold [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-primary [&_p]:mb-4 [&_p]:wrap-break-word [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:wrap-break-word [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:wrap-break-word [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:wrap-break-word [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:p-4 [&_blockquote]:rounded-r-lg [&_blockquote]:my-8 [&_blockquote]:wrap-break-word"
                style={{ color: 'var(--foreground)' }}
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
              <div
                className="flex items-center justify-between pt-8 flex-wrap gap-4"
                style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}
              >
                <Link
                  href="/notices"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  返回公告列表
                </Link>
                <div className="flex gap-2 flex-wrap">
                  <button
                    title="复制链接"
                    className="p-2 rounded-full transition-colors"
                    style={{
                      color: copySuccess ? 'var(--primary)' : 'var(--text-secondary)',
                      backgroundColor: copySuccess ? 'var(--primary-light)' : 'transparent',
                    }}
                    onClick={handleCopyLink}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {copySuccess ? 'check_circle' : 'link'}
                    </span>
                  </button>
                  <button
                    title="打印公告"
                    className="p-2 rounded-full transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={handlePrint}
                  >
                    <span className="material-symbols-outlined text-[20px]">print</span>
                  </button>
                  <button
                    title="分享"
                    className="p-2 rounded-full transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      alert('分享链接：' + window.location.href);
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                </div>
              </div>
            </article>
            <aside className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-24 space-y-8">
                <div
                  className="rounded-xl border p-5 shadow-sm"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <h3
                    className="text-sm font-bold uppercase tracking-wider mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    相关公告
                  </h3>
                  <div className="space-y-4">
                    {relatedNotices.length > 0 ? (
                      relatedNotices.map((relatedNotice, index) => (
                        <div key={relatedNotice.$id}>
                          {index > 0 && (
                            <hr className="mb-4" style={{ borderColor: 'var(--border)' }} />
                          )}
                          <Link href={`/notices/${relatedNotice.$id}`} className="block group">
                            <span
                              className="text-xs mb-1 block"
                              style={{ color: 'var(--primary)' }}
                            >
                              {new Date(relatedNotice.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                            <h4
                              className="text-sm font-bold transition-colors line-clamp-2"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {relatedNotice.title}
                            </h4>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        暂无相关公告
                      </p>
                    )}
                  </div>
                  <Link
                    href="/notices"
                    className="inline-block mt-4 text-xs font-bold transition-colors"
                    style={{ color: 'var(--primary)' }}
                  >
                    查看所有公告 →
                  </Link>
                </div>
                <div
                  className="rounded-xl border p-5 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="absolute -right-4 -top-4 w-24 h-24 blur-2xl rounded-full"
                    style={{ backgroundColor: 'var(--primary) / 0.2' }}
                  ></div>
                  <h3
                    className="text-sm font-bold uppercase tracking-wider mb-4 relative z-10"
                    style={{ color: 'var(--foreground)' }}
                  >
                    近期活动
                  </h3>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined">code</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                          代码之夜
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          每周例会
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs mb-4"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      <span>周五 • 下午 6:00</span>
                    </div>
                    <Link href="/activities">
                      <Button variant="secondary" size="sm" className="w-full">
                        查看活动详情
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div
            className="mt-12 pt-8"
            style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <div className="flex items-center gap-3 p-6 md:p-8">
                <div
                  className="size-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--primary) / 0.2', color: 'var(--primary)' }}
                >
                  <span className="material-symbols-outlined">comment</span>
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  公告评论
                </h3>
                <span className="text-sm ml-auto" style={{ color: 'var(--text-secondary)' }}>
                  {comments.length} 条评论
                </span>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--primary)' }}
                  title={showComments ? '隐藏评论' : '显示评论'}
                >
                  <span className="material-symbols-outlined">
                    {showComments ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
              {showComments && (
                <>
                  {isLoadingComments ? (
                    <div className="text-center py-8 px-6 md:px-8">
                      <Loading size="md" text="加载评论..." />
                    </div>
                  ) : (
                    <div className="px-6 md:px-8 pb-6 md:pb-8">
                      <div className="mb-8">
                        <CommentList
                          comments={comments}
                          contentType="notice"
                          contentId={notice?.$id || ''}
                          onCommentDeleted={() => notice?.$id && loadComments(notice.$id)}
                        />
                      </div>
                      <div
                        className="pt-6"
                        style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}
                      >
                        <h4
                          className="text-sm font-bold mb-4 flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <span className="material-symbols-outlined text-lg">edit_note</span>
                          发表评论
                        </h4>
                        <CommentForm
                          contentType="notice"
                          contentId={notice?.$id || ''}
                          onCommentSubmitted={() => notice?.$id && loadComments(notice.$id)}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </StudentLayout>
  );
}