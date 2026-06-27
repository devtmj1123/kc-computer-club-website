'use client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
export default function CreateNotice() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    category: '活动通知',
    content: '',
    status: 'draft',
    visibility: 'public',
    tags: '',
    images: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageInputType, setImageInputType] = useState<'upload' | 'link'>('upload');
  const [newImageLink, setNewImageLink] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramImporting, setInstagramImporting] = useState(false);
  const [instagramError, setInstagramError] = useState('');
  const [instagramPreview, setInstagramPreview] = useState<{ image?: string | null; caption?: string; sourceUrl?: string } | null>(null);
  useEffect(() => {
    if (!isLoading && (!user || !('role' in user) || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);
  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          status: formData.status,
          visibility: formData.visibility,
          author: user?.name || '管理员',
          authorId: user?.id || '',
          images: formData.images.length > 0 ? formData.images : undefined,
          tags: formData.tags
            ? formData.tags.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag)
            : [],
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push('/admin/notices');
      } else {
        throw new Error(data.error || '创建公告失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsSaving(false);
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setInstagramPreview(null);
    try {
      const res = await fetch('/api/notices/import-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInstagramPreview({ image: data.image, caption: data.caption, sourceUrl: data.sourceUrl });
      } else {
        setInstagramError(data.error || '导入失败');
      }
    } catch {
      setInstagramError('网络错误，请重试');
    } finally {
      setInstagramImporting(false);
    }
  };
  const handleApplyInstagram = () => {
    if (!instagramPreview) return;
    if (instagramPreview.image && formData.images.length < 5) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, instagramPreview.image!] }));
    }
    if (instagramPreview.caption) {
      setFormData((prev) => ({ ...prev, content: prev.content ? prev.content + '\n\n' + instagramPreview.caption : instagramPreview.caption! }));
    }
    setInstagramPreview(null);
    setInstagramUrl('');
  };
  if (isLoading || !user) {
    return (
      <AdminLayout adminName={user?.name || '管理员'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <span className="material-symbols-outlined text-[#137fec] text-5xl">
                hourglass_bottom
              </span>
            </div>
            <p className="text-white">加载中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout adminName={user?.name || '管理员'}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">发布新公告</h1>
          <p className="text-gray-400">填写公告信息，支持Markdown格式。</p>
        </div>
        <Link href="/admin/notices">
          <button className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label htmlFor="title" className="block text-white font-semibold mb-3">
                公告标题 *
              </label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="输入公告标题..."
                required
                className="w-full px-4 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec]"
              />
              <p className="text-gray-500 text-sm mt-2">标题字数建议 10-100 字</p>
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label htmlFor="category" className="block text-white font-semibold mb-3">
                公告分类 *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#1f2d39] border border-[#283946] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#137fec] transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label htmlFor="content" className="block text-white font-semibold mb-3">
                公告内容 *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="输入公告内容...支持 Markdown 格式"
                required
                rows={10}
                className="w-full bg-[#1f2d39] border border-[#283946] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#137fec] transition-colors resize-none"
              />
              <p className="text-gray-500 text-sm mt-2">
                支持 Markdown 格式，包括标题、列表、链接等
              </p>
            </div>
            <div className="bg-[#1a2632] border border-[#e1306c]/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
                  <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)"/>
                  <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
                </svg>
                <h3 className="text-white font-semibold">从 Instagram 导入</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">粘贴 Instagram 帖子链接，自动提取图片和说明文字</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImportInstagram())}
                  placeholder="https://www.instagram.com/p/..."
                  className="flex-1 px-4 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e1306c] text-sm"
                />
                <button
                  type="button"
                  onClick={handleImportInstagram}
                  disabled={instagramImporting || !instagramUrl.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-lg font-medium disabled:opacity-50 transition-opacity text-sm whitespace-nowrap"
                >
                  {instagramImporting ? '导入中...' : '导入'}
                </button>
              </div>
              {instagramError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-3">
                  {instagramError}
                </div>
              )}
              {instagramPreview && (
                <div className="border border-[#e1306c]/30 rounded-xl p-4 space-y-3">
                  <p className="text-[#e1306c] text-xs font-semibold uppercase tracking-wide">预览</p>
                  {instagramPreview.image && (
                    <img
                      src={instagramPreview.image}
                      alt="Instagram 图片"
                      className="w-full max-h-48 object-cover rounded-lg border border-[#283946]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  {instagramPreview.caption && (
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{instagramPreview.caption}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyInstagram}
                    className="w-full py-2 bg-[#e1306c] hover:bg-[#c62a60] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    应用到公告（添加图片 + 说明文字）
                  </button>
                </div>
              )}
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label className="block text-white font-semibold mb-3">
                配图（最多 5 张）{formData.images.length > 0 && `(${formData.images.length}/5)`}
              </label>
              <p className="text-gray-500 text-sm mb-4">建议图片大小：1200x600px 或 1920x1080px，支持 JPG、PNG 格式</p>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setImageInputType('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    imageInputType === 'upload'
                      ? 'bg-[#137fec] text-white'
                      : 'bg-[#1f2d39] text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  上传图片
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('link')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    imageInputType === 'link'
                      ? 'bg-[#137fec] text-white'
                      : 'bg-[#1f2d39] text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  图片链接
                </button>
              </div>
              {imageInputType === 'upload' ? (
                <div className="border-2 border-dashed border-[#283946] rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <span className="material-symbols-outlined text-4xl text-gray-500 block mb-2">
                      image
                    </span>
                    <p className="text-gray-400 text-sm">
                      点击选择或拖拽图片上传
                    </p>
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageLink}
                    onChange={(e) => setNewImageLink(e.target.value)}
                    placeholder="输入图片链接 URL"
                    className="flex-1 px-4 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec]"
                    disabled={formData.images.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageLink}
                    disabled={formData.images.length >= 5 || !newImageLink.trim()}
                    className="px-4 py-3 bg-[#137fec] text-white rounded-lg hover:bg-[#0f6ecf] disabled:opacity-50 transition-colors"
                  >
                    添加
                  </button>
                </div>
              )}
              {formData.images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-gray-400 text-sm">已选择的图片：</p>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`图片 ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-[#283946]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23999"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6">
              <label htmlFor="tags" className="block text-white font-semibold mb-3">
                标签（用逗号或中文逗号分隔）
              </label>
              <input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="例如：重要, 新闻, 活动 或 重要，新闻，活动"
                className="w-full px-4 py-3 bg-[#141f2e] border border-[#283a4f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec]"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-[#1a2632] border border-[#283946] rounded-2xl p-6 sticky top-6">
              <h2 className="text-white font-semibold mb-4">预览</h2>
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={formData.images[0]}
                    alt="预览"
                    className="w-full h-32 object-cover rounded-lg border border-[#283946] mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {formData.images.length > 1 && (
                    <p className="text-gray-500 text-xs text-center">
                      +{formData.images.length - 1} 张图片
                    </p>
                  )}
                </div>
              )}
              <div className="bg-[#1f2d39] rounded-xl p-4 mb-4 space-y-2">
                {formData.title && (
                  <h3 className="text-white font-semibold text-sm line-clamp-2">
                    {formData.title}
                  </h3>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="material-symbols-outlined text-sm">label</span>
                  <span>{formData.category}</span>
                </div>
                {formData.content && (
                  <p className="text-gray-400 text-xs line-clamp-3">
                    {formData.content.replace(/[#*`]/g, '')}
                  </p>
                )}
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="draft"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={handleChange}
                    className="cursor-pointer"
                  />
                  <label htmlFor="draft" className="text-gray-400 text-sm cursor-pointer flex-1">
                    保存为草稿
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="published"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={handleChange}
                    className="cursor-pointer"
                  />
                  <label htmlFor="published" className="text-gray-400 text-sm cursor-pointer flex-1">
                    立即发布
                  </label>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 text-sm">可见范围</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="radio"
                      id="public"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={handleChange}
                      className="cursor-pointer"
                    />
                    <label htmlFor="public" className="text-gray-400 text-sm cursor-pointer flex-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-green-400">public</span>
                        公开（所有人）
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="radio"
                      id="internal"
                      name="visibility"
                      value="internal"
                      checked={formData.visibility === 'internal'}
                      onChange={handleChange}
                      className="cursor-pointer"
                    />
                    <label htmlFor="internal" className="text-gray-400 text-sm cursor-pointer flex-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-blue-400">lock</span>
                        内部（仅学生）
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSaving || !formData.title || !formData.content}
                  className="w-full px-4 py-2 bg-[#137fec] hover:bg-[#0f6ecf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">
                        hourglass_bottom
                      </span>
                      保存中...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check</span>
                      {formData.status === 'draft' ? '保存草稿' : '发布公告'}
                    </>
                  )}
                </button>
                <Link href="/admin/notices" className="w-full">
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-[#1f2d39] hover:bg-[#283946] text-gray-400 rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}