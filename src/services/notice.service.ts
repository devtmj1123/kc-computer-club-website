import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface Notice {
  $id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  lastEditorId?: string;
  lastEditorName?: string;
  category: string;
  status: 'draft' | 'published';
  visibility: 'public' | 'internal';
  images?: string[];
  tags?: string[];
  pinned?: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeInput {
  title: string;
  content: string;
  category: string;
  authorId: string;
  author: string;
  status?: 'draft' | 'published';
  visibility?: 'public' | 'internal';
  images?: string[];
  tags?: string[];
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  category?: string;
  status?: 'draft' | 'published';
  visibility?: 'public' | 'internal';
  images?: string[];
  tags?: string[];
  publishedAt?: string;
  lastEditorId?: string;
  lastEditorName?: string;
  pinned?: boolean;
}

interface NoticeImageRow {
  url: string;
  sort_order: number;
}

interface NoticeTagRow {
  tag: string;
}

interface NoticeRow {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string | null;
  author_name: string;
  last_editor_id: string | null;
  last_editor_name: string | null;
  status: 'draft' | 'published';
  visibility: 'public' | 'internal';
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  notice_images?: NoticeImageRow[] | null;
  notice_tags?: NoticeTagRow[] | null;
}

const NOTICE_SELECT =
  'id, title, content, category, author_id, author_name, last_editor_id, last_editor_name, status, visibility, pinned, published_at, created_at, updated_at, notice_images(url, sort_order), notice_tags(tag)';

function parseNotice(row: NoticeRow): Notice {
  return {
    $id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    author: row.author_name,
    authorId: row.author_id || '',
    lastEditorId: row.last_editor_id || undefined,
    lastEditorName: row.last_editor_name || undefined,
    status: row.status,
    visibility: row.visibility,
    images: (row.notice_images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => image.url),
    tags: (row.notice_tags ?? []).map((tag) => tag.tag),
    pinned: row.pinned,
    publishedAt: row.published_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function replaceImages(noticeId: string, images: string[]): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error: deleteError } = await admin
    .from('notice_images')
    .delete()
    .eq('notice_id', noticeId);
  if (deleteError) throw new Error(deleteError.message);

  if (images.length === 0) return;

  const { error } = await admin.from('notice_images').insert(
    images.map((url, index) => ({
      notice_id: noticeId,
      url,
      sort_order: index,
    }))
  );
  if (error) throw new Error(error.message);
}

async function replaceTags(noticeId: string, tags: string[]): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error: deleteError } = await admin
    .from('notice_tags')
    .delete()
    .eq('notice_id', noticeId);
  if (deleteError) throw new Error(deleteError.message);

  const unique = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  if (unique.length === 0) return;

  const { error } = await admin.from('notice_tags').insert(
    unique.map((tag) => ({ notice_id: noticeId, tag }))
  );
  if (error) throw new Error(error.message);
}

export async function getAllNotices(
  onlyPublished = false,
  visibility: 'public' | 'all' = 'all'
): Promise<Notice[]> {
  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from('notices')
      .select(NOTICE_SELECT)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (onlyPublished) {
      query = query.eq('status', 'published');
    }
    if (visibility === 'public') {
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return ((data ?? []) as unknown as NoticeRow[]).map(parseNotice);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取公告列表失败:', err);
    throw new Error(err.message || '获取公告列表失败');
  }
}

export async function getNoticeById(id: string): Promise<Notice> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('notices')
      .select(NOTICE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('公告不存在');

    return parseNotice(data as unknown as NoticeRow);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取公告失败:', err);
    throw new Error(err.message || '获取公告失败');
  }
}

export async function createNotice(input: CreateNoticeInput): Promise<Notice> {
  try {
    const admin = getSupabaseAdminClient();
    const status = input.status || 'draft';
    const { data, error } = await admin
      .from('notices')
      .insert({
        title: input.title,
        content: input.content,
        category: input.category || '其他',
        author_id: input.authorId || null,
        author_name: input.author,
        status,
        visibility: input.visibility || 'public',
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    const noticeId = (data as { id: string }).id;
    if (input.images && input.images.length > 0) {
      await replaceImages(noticeId, input.images);
    }
    if (input.tags && input.tags.length > 0) {
      await replaceTags(noticeId, input.tags);
    }

    return getNoticeById(noticeId);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('创建公告失败:', err);
    throw new Error(err.message || '创建公告失败');
  }
}

export async function updateNotice(
  id: string,
  input: UpdateNoticeInput
): Promise<Notice> {
  try {
    const admin = getSupabaseAdminClient();
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (input.lastEditorId !== undefined) {
      updateData.last_editor_id = input.lastEditorId || null;
    }
    if (input.lastEditorName !== undefined) {
      updateData.last_editor_name = input.lastEditorName || null;
    }
    if (input.pinned !== undefined) updateData.pinned = input.pinned;

    if (Object.keys(updateData).length > 0) {
      const { error } = await admin
        .from('notices')
        .update(updateData)
        .eq('id', id);
      if (error) throw new Error(error.message);
    }

    if (input.images !== undefined) {
      await replaceImages(id, input.images);
    }
    if (input.tags !== undefined) {
      await replaceTags(id, input.tags);
    }

    return getNoticeById(id);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('更新公告失败:', err);
    throw new Error(err.message || '更新公告失败');
  }
}

export async function deleteNotice(id: string): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.from('notices').delete().eq('id', id);
    if (error) throw new Error(error.message);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除公告失败:', err);
    throw new Error(err.message || '删除公告失败');
  }
}

export async function getNoticesByCategory(category: string): Promise<Notice[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('notices')
      .select(NOTICE_SELECT)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as NoticeRow[]).map(parseNotice);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('按分类获取公告失败:', err);
    throw new Error(err.message || '获取公告失败');
  }
}

export async function searchNotices(query: string): Promise<Notice[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('notices')
      .select(NOTICE_SELECT)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as NoticeRow[]).map(parseNotice);
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('搜索公告失败:', err);
    throw new Error(err.message || '搜索公告失败');
  }
}
