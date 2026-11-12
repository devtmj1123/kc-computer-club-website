'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { DetailPageSkeleton, SectionSkeleton } from '@/components/ui/PageSkeletons';
import { ImageCarousel } from '@/components/notices/ImageCarousel';
import { CommentForm } from '@/components/comments/CommentForm';
import { CommentList } from '@/components/comments/CommentList';
import { Comment } from '@/services/comment.service';
import { Notice } from '@/services/notice.service';
import { decodeHtmlEntities } from '@/lib/utils';

function calculateReadingTime(content: string): number {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, '');
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const englishWords = text.match(/\b[a-zA-Z]+\b/g)?.length || 0;
  const readingTime = Math.ceil((chineseChars / 300 + englishWords / 200) / 2);
  return Math.max(1, readingTime);
}

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function sanitizeHtmlContent(html: string): string {
  if (!html) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html
      .replace(/<\/?(?:script|style|iframe|object|embed|link|meta|form|input|button|textarea|select|option|svg|math)[^>]*>/gi, '')
      .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s(?:href|src)=("|')\s*javascript:[^"']*\1/gi, '')
      .replace(/\s(?:href|src)=("|')\s*data:(?!image\/)[^"']*\1/gi, '');
  }

  const allowedTags = new Set([
    'a', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'span', 'div', 'section', 'article',
    'blockquote', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
  ]);
  const allowedAttributes: Record<string, Set<string>> = {
    a: new Set(['href', 'title', 'target', 'rel']),
    img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding']),
    th: new Set(['colspan', 'rowspan']),
    td: new Set(['colspan', 'rowspan']),
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const cleanElement = (element: Element) => {
    for (const child of Array.from(element.children)) {
      cleanElement(child);
    }

    const tagName = element.tagName.toLowerCase();
    if (!allowedTags.has(tagName)) {
      const parent = element.parentElement;
      if (parent) {
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
      return;
    }

    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      const allowedForTag = allowedAttributes[tagName];
      const isAllowed = allowedForTag?.has(attributeName) || false;

      if (attributeName.startsWith('on') || attributeName === 'style' || !isAllowed) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === 'a') {
      const href = element.getAttribute('href') || '';
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) {
        element.removeAttribute('href');
      } else {
        element.setAttribute('rel', 'noreferrer noopener');
      }
    }

    if (tagName === 'img') {
      const src = element.getAttribute('src') || '';
      if (!/^(https?:|\/|data:image\/)/i.test(src)) {
        element.removeAttribute('src');
      }
      element.setAttribute('loading', 'lazy');
      element.setAttribute('decoding', 'async');
    }
  };

  for (const child of Array.from(doc.body.children)) {
    cleanElement(child);
  }

  return doc.body.innerHTML;
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
        <DetailPageSkeleton />
      </StudentLayout>
    );
  }

  if (!notice || error) {
    return (
      <StudentLayout>
        <main className="mx-auto flex w-full max-w-[1200px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
          <div className="eyebrow">404 · NOT FOUND</div>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.04em] text-[var(--foreground)]">
            {error || '公告不存在'}
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-[var(--text-secondary)]">
            请检查链接是否正确，或返回公告列表浏览其他内容。
          </p>
          <Link
            href="/notices"
            className="mt-8 inline-flex items-center gap-3 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="text-[13px] leading-none">←</span>
            返回公告列表
          </Link>
        </main>
      </StudentLayout>
    );
  }

  const title = decodeHtmlEntities(notice.title);

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <Link href="/notices" className="transition-colors hover:text-[var(--foreground)]">
            公告
          </Link>
          <span>/</span>
          <span className="truncate text-[var(--foreground)]">{title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0">
            <header className="border-b border-[var(--rule-strong)] pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-[var(--primary)]/40 bg-[var(--primary-light)] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
                  {notice.category || '公告'}
                </span>
                {Array.isArray(notice.tags) &&
                  notice.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="border border-[var(--border)] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                {notice.pinned && (
                  <span className="inline-flex items-center gap-1 border border-[var(--primary)]/40 px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--primary)]">
                    <span className="material-symbols-outlined text-[12px]">push_pin</span>
                    置顶
                  </span>
                )}
              </div>

              <h1 className="mt-6 font-display text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.04em] text-[var(--foreground)]">
                {title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                  {formatDate(notice.publishedAt || notice.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {notice.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                  {calculateReadingTime(notice.content)} 分钟阅读
                </span>
              </div>

              {notice.lastEditorName && (
                <p className="mt-4 border-t border-[var(--border)] pt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  最后编辑：{notice.lastEditorName}
                  {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                    <span> · {formatDate(notice.updatedAt)}</span>
                  )}
                </p>
              )}
            </header>

            {notice.images && notice.images.length > 0 && (
              <div className="my-10">
                <ImageCarousel images={notice.images} title={notice.title} showThumbnails={true} />
              </div>
            )}

            <div
              className="prose-editorial mt-10 max-w-none wrap-break-word"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(notice.content) }}
            />

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rule-strong)] pt-6">
              <Link
                href="/notices"
                className="inline-flex items-center gap-2 border-b border-transparent pb-0.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                返回公告列表
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="复制链接"
                  onClick={handleCopyLink}
                  className="inline-flex h-9 items-center gap-2 border border-[var(--border)] px-3 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copySuccess ? 'check' : 'link'}
                  </span>
                  {copySuccess ? '已复制' : '复制链接'}
                </button>
                <button
                  type="button"
                  title="打印公告"
                  onClick={handlePrint}
                  className="inline-flex size-9 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  <span className="material-symbols-outlined text-[15px]">print</span>
                </button>
              </div>
            </div>

            <section className="mt-12 border-t border-[var(--rule-strong)] pt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--primary)]">
                    COMMENTS
                  </span>
                  <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">
                    公告评论
                  </h2>
                  <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
                    {String(comments.length).padStart(2, '0')} 条
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComments(!showComments)}
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
                >
                  {showComments ? '收起' : '展开'}
                  <span className="material-symbols-outlined text-[15px]">
                    {showComments ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>

              {showComments && (
                <div className="pt-6">
                  {isLoadingComments ? (
                    <div className="py-4">
                      <SectionSkeleton rows={3} />
                    </div>
                  ) : (
                    <>
                      <CommentList
                        comments={comments}
                        contentType="notice"
                        contentId={notice?.$id || ''}
                        onCommentDeleted={() => notice?.$id && loadComments(notice.$id)}
                      />

                      <div className="mt-8 border-t border-[var(--border)] pt-6">
                        <h3 className="mb-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                          <span className="material-symbols-outlined text-[15px] text-[var(--primary)]">
                            edit_note
                          </span>
                          发表评论
                        </h3>
                        <CommentForm
                          contentType="notice"
                          contentId={notice?.$id || ''}
                          onCommentSubmitted={() => notice?.$id && loadComments(notice.$id)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[98px] border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>RELATED / 相关公告</span>
                <span className="text-[var(--primary)]">
                  {String(relatedNotices.length).padStart(2, '0')}
                </span>
              </div>

              {relatedNotices.length > 0 ? (
                relatedNotices.map((relatedNotice, index) => (
                  <Link
                    key={relatedNotice.$id}
                    href={`/notices/${relatedNotice.$id}`}
                    className="group grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-[var(--border)] px-4 py-4 transition-colors hover:bg-[var(--primary-light)]"
                  >
                    <span className="pt-0.5 font-mono text-[12px] text-[var(--primary)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[14px] font-semibold leading-[1.5] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                        {decodeHtmlEntities(relatedNotice.title)}
                      </span>
                      <span className="mt-1.5 block font-mono text-[12px] tracking-[0.06em] text-[var(--text-tertiary)]">
                        {formatDate(relatedNotice.publishedAt || relatedNotice.createdAt)}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-8 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  暂无相关公告。
                </p>
              )}

              <Link
                href="/notices"
                className="flex items-center justify-between px-4 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)]"
              >
                查看所有公告
                <span>→</span>
              </Link>
            </div>

            <Link
              href="/activities"
              className="group mt-5 block border border-[var(--rule-strong)] p-4 transition-colors hover:bg-[var(--primary-light)]"
            >
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
                UPCOMING / 近期活动
              </span>
              <span className="mt-3 block font-display text-[17px] font-semibold leading-[1.4] text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                查看最新活动与报名信息 →
              </span>
            </Link>
          </aside>
        </div>
      </main>
    </StudentLayout>
  );
}
