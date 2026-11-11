'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { useAuth } from '@/contexts/AuthContext';
import { Notice } from '@/services/notice.service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  use,
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';

interface NoticeFormData {
  title: string;
  category: string;
  content: string;
  status: 'draft' | 'published';
  visibility: 'public' | 'internal';
  tags: string;
  images: string[];
}

const categories = ['活动通知', '课程公告', '会议通知', '其他'];

function EditorSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[var(--rule-strong)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--border)] px-4 py-2.5 sm:px-5">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {title}
        </h2>
        <span className="font-mono text-[12px] tracking-[0.08em] text-[var(--text-tertiary)]">
          {index}
        </span>
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function ChoiceRow({
  id,
  name,
  value,
  label,
  note,
  checked,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  label: string;
  note: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center justify-between border px-3 py-2.5 transition-colors ${
        checked
          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
          : 'border-[var(--border)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="size-3.5 accent-[var(--primary)]"
        />
        <span className="text-[12px] text-[var(--foreground)]">{label}</span>
      </span>
      <span
        className={`font-mono text-[12px] uppercase tracking-[0.08em] ${
          checked ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
        }`}
      >
        {note}
      </span>
    </label>
  );
}

export default function EditNotice({ params }: { params: Promise<{ id: string }> }) {
  const { id: noticeId } = use(params);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isLoadingNotice, setIsLoadingNotice] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [imageInputType, setImageInputType] = useState<'upload' | 'link'>('upload');
  const [newImageLink, setNewImageLink] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramImporting, setInstagramImporting] = useState(false);
  const [instagramError, setInstagramError] = useState('');
  const [instagramHint, setInstagramHint] = useState<string | null>(null);
  const [instagramPreview, setInstagramPreview] = useState<{
    image?: string | null;
    images?: string[];
    caption?: string;
    sourceUrl?: string;
  } | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    category: '活动通知',
    content: '',
    status: 'draft',
    visibility: 'public',
    tags: '',
    images: [],
  });

  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  const loadNotice = useCallback(async (id: string) => {
    try {
      setIsLoadingNotice(true);
      setError('');
      const response = await fetch(`/api/notices/${id}`);
      const data = await response.json();
      if (data.success) {
        const notice: Notice = data.notice;
        setIsPinned(!!notice.pinned);
        setFormData({
          title: notice.title,
          category: notice.category,
          content: notice.content,
          status: notice.status as 'draft' | 'published',
          visibility: (notice.visibility as 'public' | 'internal') || 'public',
          tags: Array.isArray(notice.tags) ? notice.tags.join(', ') : '',
          images: notice.images || [],
        });
      } else {
        throw new Error(data.error || '加载公告失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoadingNotice(false);
    }
  }, []);

  useEffect(() => {
    if (user && 'role' in user && user.role === 'admin' && noticeId) {
      loadNotice(noticeId);
    }
  }, [user, noticeId, loadNotice]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (!formData.title.trim()) {
        throw new Error('请输入公告标题');
      }
      if (!formData.content.trim()) {
        throw new Error('请输入公告内容');
      }
      if (!noticeId) {
        throw new Error('公告ID未找到');
      }
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          status: formData.status,
          visibility: formData.visibility,
          images: formData.images,
          tags: formData.tags
            ? formData.tags
                .split(/[,，]/)
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : [],
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push('/admin/notices');
      } else {
        throw new Error(data.error || '更新公告失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setIsSaving(true);
    try {
      if (!noticeId) {
        throw new Error('公告ID未找到');
      }
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        router.push('/admin/notices');
      } else {
        throw new Error(data.error || '删除公告失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsSaving(false);
      setDeleteConfirm(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) {
      const file = files[i];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      try {
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formDataUpload,
        });
        const data = await response.json();
        if (data.url) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.url],
          }));
        }
      } catch (err) {
        console.error('上传失败:', err);
      }
    }
    e.target.value = '';
  };

  const handleAddImageLink = () => {
    if (newImageLink.trim() && formData.images.length < 5) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImageLink.trim()],
      }));
      setNewImageLink('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleImportInstagram = async () => {
    if (!instagramUrl.trim()) return;
    setInstagramImporting(true);
    setInstagramError('');
    setInstagramHint(null);
    setInstagramPreview(null);
    try {
      const res = await fetch('/api/notices/import-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInstagramPreview({
          image: data.image,
          images: data.images,
          caption: data.caption,
          sourceUrl: data.sourceUrl,
        });
      } else {
        setInstagramError(data.error || '导入失败');
        setInstagramHint(data.hint || null);
      }
    } catch {
      setInstagramError('网络错误，请重试');
    } finally {
      setInstagramImporting(false);
    }
  };

  const handleTogglePin = async () => {
    setIsPinning(true);
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !isPinned }),
      });
      const data = await response.json();
      if (data.success) {
        setIsPinned(!isPinned);
      } else {
        setError(data.error || '设置置顶失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '设置置顶失败');
    } finally {
      setIsPinning(false);
    }
  };

  const handleApplyInstagram = () => {
    if (!instagramPreview) return;
    const imgsToAdd =
      instagramPreview.images && instagramPreview.images.length > 0
        ? instagramPreview.images
        : instagramPreview.image
          ? [instagramPreview.image]
          : [];
    if (imgsToAdd.length > 0) {
      const remaining = 5 - formData.images.length;
      const toAdd = imgsToAdd.slice(0, remaining);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...toAdd] }));
    }
    if (instagramPreview.caption) {
      setFormData((prev) => ({
        ...prev,
        content: prev.content
          ? prev.content + '\n\n' + instagramPreview.caption
          : instagramPreview.caption!,
      }));
    }
    setInstagramPreview(null);
    setInstagramUrl('');
  };

  if (isLoading || !user || isLoadingNotice) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] px-8 py-6 text-center">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Loading notice
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--primary)]">
            Content · Notices · Edit
          </p>
          <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            编辑公告
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            修改公告内容并保存更改。
            {isPinned && (
              <span className="ml-2 border border-[var(--warning)]/40 bg-[var(--warning-light)] px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--warning)]">
                已置顶
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/notices"
          aria-label="返回公告管理"
          className="flex size-9 shrink-0 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--rule-strong)] hover:text-[var(--foreground)]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl">
        {error && (
          <div className="mb-4 flex items-start gap-2 border border-[var(--error)]/40 bg-[var(--error-light)] px-4 py-3">
            <span className="material-symbols-outlined text-[16px] text-[var(--error)]">
              error
            </span>
            <p className="text-[12px] leading-relaxed text-[var(--error)]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <EditorSection index="01" title="标题">
              <Input
                id="title"
                name="title"
                label="公告标题"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="输入公告标题…"
                hint="标题字数建议 10–100 字"
              />
            </EditorSection>

            <EditorSection index="02" title="分类">
              <NeumorphicSelect
                label="公告分类"
                options={categories.map((cat) => ({ value: cat, label: cat }))}
                value={formData.category}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              />
            </EditorSection>

            <EditorSection index="03" title="正文">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="content"
                  className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]"
                >
                  公告内容 <span className="text-[var(--error)]">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="输入公告内容…支持 Markdown 格式"
                  required
                  rows={12}
                  className="w-full resize-y rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-[13px] leading-7 text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                />
                <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-tertiary)]">
                  支持标题、列表、链接等 Markdown 语法
                </p>
              </div>
            </EditorSection>

            <EditorSection index="04" title="Import / Instagram">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)]">
                  <span className="material-symbols-outlined text-[18px]">
                    photo_camera
                  </span>
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--foreground)]">
                    从 Instagram 导入
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    粘贴 Instagram 帖子链接，自动提取图片和说明文字。
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleImportInstagram();
                    }
                  }}
                  placeholder="https://www.instagram.com/p/…"
                  containerClassName="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleImportInstagram}
                  isLoading={instagramImporting}
                  disabled={instagramImporting || !instagramUrl.trim()}
                  className="sm:w-24"
                >
                  导入
                </Button>
              </div>

              {instagramError && (
                <div className="mt-3 border border-[var(--error)]/40 bg-[var(--error-light)] px-3 py-2.5 text-[12px] text-[var(--error)]">
                  {instagramError}
                  {instagramHint === 'setup_required' && (
                    <div className="mt-2 space-y-1 border-t border-[var(--error)]/30 pt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      <p className="font-semibold text-[var(--text-secondary)]">
                        手动导入方法：
                      </p>
                      <p>1. 在 Instagram 打开帖子，右键点击图片 → “复制图片地址”</p>
                      <p>2. 在下方「图片链接」中粘贴 URL 并添加</p>
                      <p>3. 复制帖子说明文字粘贴到「公告内容」</p>
                      <p>4. 轮播帖子请逐张复制每张图片的地址</p>
                    </div>
                  )}
                </div>
              )}

              {instagramPreview && (
                <div className="mt-4 border border-[var(--border)] p-3">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    Preview
                    {instagramPreview.images && instagramPreview.images.length > 1
                      ? ` · ${instagramPreview.images.length} 张图片`
                      : ''}
                  </p>
                  {instagramPreview.images && instagramPreview.images.length > 0 ? (
                    <div
                      className={
                        instagramPreview.images.length > 1
                          ? 'mt-3 grid grid-cols-2 gap-2'
                          : 'mt-3'
                      }
                    >
                      {instagramPreview.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Instagram 图片 ${idx + 1}`}
                          className="max-h-48 w-full border border-[var(--border)] object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  ) : instagramPreview.image ? (
                    <img
                      src={instagramPreview.image}
                      alt="Instagram 图片"
                      className="mt-3 max-h-48 w-full border border-[var(--border)] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {instagramPreview.caption && (
                    <p className="mt-3 line-clamp-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {instagramPreview.caption}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleApplyInstagram}
                    className="mt-3 w-full"
                  >
                    应用到公告（添加 {instagramPreview.images?.length || 1} 张图片 + 说明文字）
                  </Button>
                </div>
              )}
            </EditorSection>

            <EditorSection index="05" title="配图">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  配图（最多 5 张）
                </p>
                <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
                  {formData.images.length} / 5
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                建议图片大小 1200×600px 或 1920×1080px，支持 JPG、PNG 格式。
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:w-64">
                <button
                  type="button"
                  onClick={() => setImageInputType('upload')}
                  className={`flex h-9 items-center justify-center gap-1.5 border text-[12px] font-medium transition-colors ${
                    imageInputType === 'upload'
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">upload</span>
                  上传图片
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('link')}
                  className={`flex h-9 items-center justify-center gap-1.5 border text-[12px] font-medium transition-colors ${
                    imageInputType === 'link'
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  图片链接
                </button>
              </div>

              {imageInputType === 'upload' ? (
                <div className="mt-3 border border-dashed border-[var(--rule-strong)] px-4 py-7 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="block cursor-pointer">
                    <span className="material-symbols-outlined block text-[26px] text-[var(--text-tertiary)]">
                      image
                    </span>
                    <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                      点击选择图片上传
                    </p>
                    <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      最多 5 张
                    </p>
                  </label>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="url"
                    value={newImageLink}
                    onChange={(e) => setNewImageLink(e.target.value)}
                    placeholder="输入图片链接 URL"
                    containerClassName="flex-1"
                    disabled={formData.images.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddImageLink}
                    disabled={formData.images.length >= 5 || !newImageLink.trim()}
                    className="sm:w-24"
                  >
                    添加
                  </Button>
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    已选择
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="group relative">
                        <img
                          src={img}
                          alt={`图片 ${idx + 1}`}
                          className="h-24 w-full border border-[var(--border)] object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23999"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          aria-label={`移除图片 ${idx + 1}`}
                          className="absolute right-1 top-1 flex size-6 items-center justify-center bg-[var(--error)] text-[var(--error-contrast)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </EditorSection>

            <EditorSection index="06" title="标签">
              <Input
                id="tags"
                name="tags"
                label="标签"
                value={formData.tags}
                onChange={handleChange}
                placeholder="例如：重要, 新闻, 活动"
                hint="用逗号或中文逗号分隔"
              />
            </EditorSection>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="border border-[var(--rule-strong)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
                <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Preview
                </h2>
                {isPinned && (
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--warning)]">
                    Pinned
                  </span>
                )}
              </div>
              <div className="px-4 py-4">
                {formData.images.length > 0 && (
                  <div className="mb-3">
                    <img
                      src={formData.images[0]}
                      alt="预览"
                      className="h-32 w-full border border-[var(--border)] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {formData.images.length > 1 && (
                      <p className="mt-1 font-mono text-[12px] text-[var(--text-tertiary)]">
                        +{formData.images.length - 1} 张图片
                      </p>
                    )}
                  </div>
                )}
                <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <h3 className="font-display text-[15px] font-bold leading-snug text-[var(--foreground)]">
                    {formData.title || '未命名公告'}
                  </h3>
                  <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    {formData.category}
                  </p>
                  <p className="mt-2 line-clamp-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    {formData.content
                      ? formData.content.replace(/[#*`]/g, '')
                      : '公告摘要会显示在这里。'}
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-[var(--rule-strong)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-4 py-2.5">
                <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Publishing
                </h2>
              </div>
              <div className="space-y-5 px-4 py-4">
                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    发布状态
                  </p>
                  <ChoiceRow
                    id="draft"
                    name="status"
                    value="draft"
                    label="保存为草稿"
                    note="Draft"
                    checked={formData.status === 'draft'}
                    onChange={handleChange}
                  />
                  <ChoiceRow
                    id="published"
                    name="status"
                    value="published"
                    label="立即发布"
                    note="Live"
                    checked={formData.status === 'published'}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    可见范围
                  </p>
                  <ChoiceRow
                    id="public"
                    name="visibility"
                    value="public"
                    label="公开（所有人）"
                    note="Public"
                    checked={formData.visibility === 'public'}
                    onChange={handleChange}
                  />
                  <ChoiceRow
                    id="internal"
                    name="visibility"
                    value="internal"
                    label="内部（仅学生）"
                    note="Internal"
                    checked={formData.visibility === 'internal'}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2 border-t border-[var(--border)] pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSaving}
                    disabled={
                      isSaving || !formData.title || !formData.content
                    }
                  >
                    保存修改
                  </Button>
                  <Link
                    href="/admin/notices"
                    className="flex h-10 w-full items-center justify-center border border-[var(--border)] text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  >
                    取消
                  </Link>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    disabled={isPinning}
                    className={`flex w-full items-center justify-between border px-3 py-2.5 text-[12px] transition-colors disabled:opacity-50 ${
                      isPinned
                        ? 'border-[var(--warning)] bg-[var(--warning-light)] text-[var(--warning)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--rule-strong)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">
                        {isPinning ? 'hourglass_bottom' : 'push_pin'}
                      </span>
                      {isPinning ? '设置中…' : isPinned ? '已置顶（点击取消）' : '置顶此公告'}
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.06em]">
                      {isPinned ? 'Pinned' : 'Pin'}
                    </span>
                  </button>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  {deleteConfirm ? (
                    <div className="space-y-2 border border-[var(--error)]/40 bg-[var(--error-light)] p-3">
                      <p className="text-[12px] leading-relaxed text-[var(--error)]">
                        确定删除此公告？此操作无法撤销。
                      </p>
                      <Button
                        type="button"
                        variant="danger"
                        className="w-full"
                        isLoading={isSaving}
                        onClick={handleDelete}
                      >
                        确认删除
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="h-9 w-full border border-[var(--border)] text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="h-9 w-full border border-[var(--error)]/40 text-[12px] text-[var(--error)] transition-colors hover:bg-[var(--error-light)]"
                    >
                      删除公告
                    </button>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </AdminLayout>
  );
}
