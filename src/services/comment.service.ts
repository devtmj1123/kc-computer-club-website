import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface Comment {
  $id: string;
  contentType: 'notice' | 'activity';
  contentId: string;
  nickname: string;
  email?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  reply?: string;
  replyAuthor?: string;
  replyAt?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  contentType: 'notice' | 'activity';
  contentId: string;
  nickname: string;
  email?: string;
  content: string;
  status?: 'pending' | 'approved';
}

export interface ReplyCommentInput {
  reply: string;
  replyAuthor: string;
}

interface CommentRow {
  id: string;
  content_type: 'notice' | 'activity';
  content_id: string;
  nickname: string;
  email: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  reply: string | null;
  reply_author_name: string | null;
  reply_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

const COMMENT_SELECT =
  'id, content_type, content_id, nickname, email, content, status, reply, reply_author_name, reply_at, is_deleted, created_at, updated_at';

const mapToComment = (row: CommentRow): Comment => ({
  $id: row.id,
  contentType: row.content_type,
  contentId: row.content_id,
  nickname: row.nickname,
  email: row.email || '',
  content: row.content,
  status: row.status,
  reply: row.reply || undefined,
  replyAuthor: row.reply_author_name || undefined,
  replyAt: row.reply_at || undefined,
  isDeleted: row.is_deleted,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const commentService = {
  async getAllComments(onlyApproved: boolean = false): Promise<Comment[]> {
    try {
      const admin = getSupabaseAdminClient();
      let query = admin
        .from('comments')
        .select(COMMENT_SELECT)
        .order('created_at', { ascending: false });

      if (onlyApproved) {
        query = query.eq('status', 'approved').eq('is_deleted', false);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return ((data ?? []) as unknown as CommentRow[]).map(mapToComment);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      throw error;
    }
  },

  async getCommentById(id: string): Promise<Comment> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('comments')
        .select(COMMENT_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('评论不存在');

      return mapToComment(data as unknown as CommentRow);
    } catch (error) {
      console.error(`Failed to fetch comment ${id}:`, error);
      throw error;
    }
  },

  async createComment(input: CreateCommentInput): Promise<Comment> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('comments')
        .insert({
          content_type: input.contentType,
          content_id: input.contentId,
          nickname: input.nickname,
          email: input.email || null,
          content: input.content,
          // Anonymous comments stay hidden until an admin approves them.
          status: input.status || 'pending',
          is_deleted: false,
        })
        .select(COMMENT_SELECT)
        .single();

      if (error) throw new Error(error.message);
      return mapToComment(data as unknown as CommentRow);
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  },

  async updateComment(id: string, input: Partial<Comment>): Promise<Comment> {
    try {
      const admin = getSupabaseAdminClient();
      const updateData: Record<string, unknown> = {};

      if (input.content !== undefined) updateData.content = input.content;
      if (input.nickname !== undefined) updateData.nickname = input.nickname;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.isDeleted !== undefined) updateData.is_deleted = input.isDeleted;
      if (input.reply !== undefined) updateData.reply = input.reply;
      if (input.replyAuthor !== undefined) {
        updateData.reply_author_name = input.replyAuthor;
      }
      if (input.replyAt !== undefined) updateData.reply_at = input.replyAt;

      const { data, error } = await admin
        .from('comments')
        .update(updateData)
        .eq('id', id)
        .select(COMMENT_SELECT)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('评论不存在');

      return mapToComment(data as unknown as CommentRow);
    } catch (error) {
      console.error(`Failed to update comment ${id}:`, error);
      throw error;
    }
  },

  async replyToComment(id: string, input: ReplyCommentInput): Promise<Comment> {
    try {
      return this.updateComment(id, {
        reply: input.reply,
        replyAuthor: input.replyAuthor,
        replyAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to reply to comment ${id}:`, error);
      throw error;
    }
  },

  async editComment(id: string, content: string): Promise<Comment> {
    try {
      return this.updateComment(id, { content });
    } catch (error) {
      console.error(`Failed to edit comment ${id}:`, error);
      throw error;
    }
  },

  async deleteComment(id: string): Promise<void> {
    try {
      const admin = getSupabaseAdminClient();
      const { error } = await admin.from('comments').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error(`Failed to delete comment ${id}:`, error);
      throw error;
    }
  },

  async getCommentsByTarget(
    contentType: 'notice' | 'activity',
    contentId: string,
    onlyApproved: boolean = true
  ): Promise<Comment[]> {
    try {
      const admin = getSupabaseAdminClient();
      let query = admin
        .from('comments')
        .select(COMMENT_SELECT)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (onlyApproved) {
        query = query.eq('status', 'approved').eq('is_deleted', false);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return ((data ?? []) as unknown as CommentRow[]).map(mapToComment);
    } catch (error) {
      console.error(
        `Failed to fetch comments for ${contentType} ${contentId}:`,
        error
      );
      throw error;
    }
  },

  async getCommentsByStatus(status: string): Promise<Comment[]> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('comments')
        .select(COMMENT_SELECT)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as CommentRow[]).map(mapToComment);
    } catch (error) {
      console.error(`Failed to fetch comments with status ${status}:`, error);
      throw error;
    }
  },

  async getPendingComments(): Promise<Comment[]> {
    try {
      return this.getCommentsByStatus('pending');
    } catch (error) {
      console.error('Failed to fetch pending comments:', error);
      throw error;
    }
  },

  async approveComment(id: string): Promise<Comment> {
    try {
      return this.updateComment(id, { status: 'approved' });
    } catch (error) {
      console.error(`Failed to approve comment ${id}:`, error);
      throw error;
    }
  },

  async rejectComment(id: string): Promise<Comment> {
    try {
      return this.updateComment(id, { status: 'rejected' });
    } catch (error) {
      console.error(`Failed to reject comment ${id}:`, error);
      throw error;
    }
  },

  async searchComments(query: string): Promise<Comment[]> {
    try {
      const admin = getSupabaseAdminClient();
      const pattern = `%${query}%`;
      const { data, error } = await admin
        .from('comments')
        .select(COMMENT_SELECT)
        .or(`content.ilike.${pattern},nickname.ilike.${pattern}`)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as CommentRow[]).map(mapToComment);
    } catch (error) {
      console.error('Failed to search comments:', error);
      throw error;
    }
  },

  async getCommentCount(contentId: string): Promise<number> {
    try {
      const admin = getSupabaseAdminClient();
      const { count, error } = await admin
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('content_id', contentId)
        .eq('status', 'approved')
        .eq('is_deleted', false);

      if (error) throw new Error(error.message);
      return count ?? 0;
    } catch (error) {
      console.error(`Failed to get comment count for target ${contentId}:`, error);
      throw error;
    }
  },

  async getPendingCommentCount(): Promise<number> {
    try {
      const admin = getSupabaseAdminClient();
      const { count, error } = await admin
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw new Error(error.message);
      return count ?? 0;
    } catch (error) {
      console.error('Failed to get pending comment count:', error);
      throw error;
    }
  },
};
