import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const DEFAULT_STORAGE_BUCKET = 'public-assets';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'image';
}

function buildObjectPath(file: File, folder: string): string {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase()
    : 'bin';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${folder.replace(/^\/+|\/+$/g, '')}/${unique}-${sanitizeFileName(
    file.name.replace(/\.[^.]+$/, '')
  )}.${extension}`;
}

export async function uploadImage(
  file: File,
  bucket: string = DEFAULT_STORAGE_BUCKET,
  folder = 'uploads'
): Promise<string> {
  if (!bucket) {
    throw new Error('存储桶未配置');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('仅支持 JPEG、PNG、WebP、GIF 格式的图片');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('文件大小不能超过 5MB');
  }

  const admin = getSupabaseAdminClient();
  const path = buildObjectPath(file, folder);
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    console.error('图片上传失败:', error.message);
    throw new Error('图片上传失败');
  }

  return path;
}

export function getImageUrl(
  pathOrUrl: string,
  bucket: string = DEFAULT_STORAGE_BUCKET
): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const admin = getSupabaseAdminClient();
  const { data } = admin.storage.from(bucket).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

export async function deleteImage(
  pathOrUrl: string,
  bucket: string = DEFAULT_STORAGE_BUCKET
): Promise<void> {
  if (!pathOrUrl) return;

  let path = pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = pathOrUrl.indexOf(marker);
    if (index === -1) {
      throw new Error('无法解析文件路径');
    }
    path = decodeURIComponent(pathOrUrl.slice(index + marker.length).split('?')[0]);
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) {
    console.error('删除图片失败:', error.message);
    throw new Error('删除图片失败');
  }
}
