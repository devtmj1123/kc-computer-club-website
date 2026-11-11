import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface Activity {
  $id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  currentParticipants: number;
  signupDeadline: string;
  signupFormFields: string;
  organizer: string;
  organizerId: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility: 'public' | 'internal';
  coverImage?: string;
  allowedGrades?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityInput {
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  currentParticipants?: number;
  signupDeadline: string;
  signupFormFields?: string;
  organizer: string;
  organizerId: string;
  status: 'draft' | 'published';
  visibility?: 'public' | 'internal';
  coverImage?: string | null;
  allowedGrades?: string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  signupDeadline?: string;
  signupFormFields?: string;
  organizer?: string;
  organizerId?: string;
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility?: 'public' | 'internal';
  coverImage?: string | null;
  allowedGrades?: string | null;
}

interface FormFieldRow {
  field_key: string;
  label: string;
  field_type: string;
  required: boolean;
  options: unknown;
  placeholder: string | null;
  sort_order: number;
}

interface ActivityRow {
  id: string;
  title: string;
  description: string;
  category: string;
  start_at: string;
  end_at: string;
  location: string;
  max_participants: number;
  signup_count: number;
  signup_deadline: string;
  organizer_name: string;
  organizer_id: string | null;
  status: Activity['status'];
  visibility: Activity['visibility'];
  cover_url: string | null;
  allowed_grades: string[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  activity_form_fields?: FormFieldRow[] | null;
}

const ACTIVITY_SELECT =
  'id, title, description, category, start_at, end_at, location, max_participants, signup_count, signup_deadline, organizer_name, organizer_id, status, visibility, cover_url, allowed_grades, published_at, created_at, updated_at, activity_form_fields(field_key, label, field_type, required, options, placeholder, sort_order)';

function parseAllowedGrades(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }
  return [];
}

function parseActivity(row: ActivityRow): Activity {
  const fields = (row.activity_form_fields ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((field) => ({
      key: field.field_key,
      label: field.label,
      type: field.field_type,
      required: field.required,
      options: field.options,
      placeholder: field.placeholder || '',
    }));

  return {
    $id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    startTime: row.start_at,
    endTime: row.end_at,
    location: row.location,
    maxParticipants: row.max_participants,
    currentParticipants: row.signup_count,
    signupDeadline: row.signup_deadline,
    signupFormFields: JSON.stringify(fields),
    organizer: row.organizer_name,
    organizerId: row.organizer_id || '',
    status: row.status,
    visibility: row.visibility,
    coverImage: row.cover_url || undefined,
    allowedGrades:
      row.allowed_grades && row.allowed_grades.length > 0
        ? JSON.stringify(row.allowed_grades)
        : undefined,
    publishedAt: row.published_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ParsedFormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: unknown;
  placeholder?: string;
}

function parseFormFieldInput(value: string | undefined): ParsedFormField[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((field): field is Record<string, unknown> => Boolean(field) && typeof field === 'object')
      .map((field) => ({
        key: String(field.key ?? field.field_key ?? '').trim(),
        label: String(field.label ?? '').trim(),
        type: String(field.type ?? field.field_type ?? 'text'),
        required: field.required === true,
        options: field.options ?? [],
        placeholder: typeof field.placeholder === 'string' ? field.placeholder : undefined,
      }))
      .filter((field) => field.key && field.label);
  } catch {
    return [];
  }
}

async function replaceFormFields(
  activityId: string,
  serialized: string | undefined
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const fields = parseFormFieldInput(serialized);

  const { error: deleteError } = await admin
    .from('activity_form_fields')
    .delete()
    .eq('activity_id', activityId);
  if (deleteError) throw new Error(deleteError.message);

  if (fields.length === 0) return;

  const allowedTypes = new Set(['text', 'email', 'phone', 'select', 'textarea', 'date']);
  const { error } = await admin.from('activity_form_fields').insert(
    fields.map((field, index) => ({
      activity_id: activityId,
      field_key: field.key,
      label: field.label,
      field_type: allowedTypes.has(field.type) ? field.type : 'text',
      required: field.required,
      options: field.options,
      placeholder: field.placeholder || null,
      sort_order: index,
    }))
  );
  if (error) throw new Error(error.message);
}

export const activityService = {
  async getAllActivities(
    onlyPublished: boolean = false,
    visibility: 'public' | 'all' = 'all'
  ): Promise<Activity[]> {
    try {
      const admin = getSupabaseAdminClient();
      let query = admin
        .from('activities')
        .select(ACTIVITY_SELECT)
        .order('created_at', { ascending: false });

      if (onlyPublished) {
        query = query.in('status', ['published', 'ongoing', 'completed']);
      }
      if (visibility === 'public') {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return ((data ?? []) as unknown as ActivityRow[]).map(parseActivity);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  },

  async getActivityById(id: string): Promise<Activity> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('activities')
        .select(ACTIVITY_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('活动不存在');

      return parseActivity(data as unknown as ActivityRow);
    } catch (error) {
      console.error(`Failed to fetch activity ${id}:`, error);
      throw error;
    }
  },

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    try {
      const admin = getSupabaseAdminClient();
      const status = input.status || 'draft';
      const { data, error } = await admin
        .from('activities')
        .insert({
          title: input.title,
          description: input.description,
          category: input.category,
          start_at: input.startTime,
          end_at: input.endTime,
          location: input.location,
          max_participants: input.maxParticipants || 0,
          signup_count: input.currentParticipants || 0,
          signup_deadline: input.signupDeadline,
          organizer_name: input.organizer,
          organizer_id: input.organizerId || null,
          status,
          visibility: input.visibility || 'public',
          signup_mode:
            (input.visibility || 'public') === 'internal'
              ? 'auth_required'
              : 'public',
          cover_url: input.coverImage || null,
          allowed_grades: parseAllowedGrades(input.allowedGrades),
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      const activityId = (data as { id: string }).id;
      if (input.signupFormFields) {
        await replaceFormFields(activityId, input.signupFormFields);
      }

      return this.getActivityById(activityId);
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  },

  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    try {
      const admin = getSupabaseAdminClient();
      const updateData: Record<string, unknown> = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.startTime !== undefined) updateData.start_at = input.startTime;
      if (input.endTime !== undefined) updateData.end_at = input.endTime;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.maxParticipants !== undefined) {
        updateData.max_participants = input.maxParticipants;
      }
      if (input.currentParticipants !== undefined) {
        updateData.signup_count = input.currentParticipants;
      }
      if (input.signupDeadline !== undefined) {
        updateData.signup_deadline = input.signupDeadline;
      }
      if (input.organizer !== undefined) updateData.organizer_name = input.organizer;
      if (input.organizerId !== undefined) {
        updateData.organizer_id = input.organizerId || null;
      }
      if (input.visibility !== undefined) {
        updateData.visibility = input.visibility;
        updateData.signup_mode =
          input.visibility === 'internal' ? 'auth_required' : 'public';
      }
      if (input.coverImage !== undefined) {
        updateData.cover_url = input.coverImage || null;
      }
      if (input.allowedGrades !== undefined) {
        updateData.allowed_grades = parseAllowedGrades(input.allowedGrades);
      }
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === 'published') {
          updateData.published_at = new Date().toISOString();
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await admin
          .from('activities')
          .update(updateData)
          .eq('id', id);
        if (error) throw new Error(error.message);
      }

      if (input.signupFormFields !== undefined) {
        await replaceFormFields(id, input.signupFormFields);
      }

      return this.getActivityById(id);
    } catch (error) {
      console.error(`Failed to update activity ${id}:`, error);
      throw error;
    }
  },

  async deleteActivity(id: string): Promise<void> {
    try {
      const admin = getSupabaseAdminClient();
      const { error } = await admin.from('activities').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error(`Failed to delete activity ${id}:`, error);
      throw error;
    }
  },

  async searchActivities(query: string): Promise<Activity[]> {
    try {
      const admin = getSupabaseAdminClient();
      const pattern = `%${query}%`;
      const { data, error } = await admin
        .from('activities')
        .select(ACTIVITY_SELECT)
        .or(`title.ilike.${pattern},location.ilike.${pattern}`)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as ActivityRow[]).map(parseActivity);
    } catch (error) {
      console.error('Failed to search activities:', error);
      throw error;
    }
  },

  async getActivitiesByCategory(category: string): Promise<Activity[]> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('activities')
        .select(ACTIVITY_SELECT)
        .eq('category', category)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as ActivityRow[]).map(parseActivity);
    } catch (error) {
      console.error(`Failed to fetch activities for category ${category}:`, error);
      throw error;
    }
  },

  async getActivitiesByStatus(status: string): Promise<Activity[]> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('activities')
        .select(ACTIVITY_SELECT)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as ActivityRow[]).map(parseActivity);
    } catch (error) {
      console.error(`Failed to fetch activities with status ${status}:`, error);
      throw error;
    }
  },

  async getUpcomingActivities(): Promise<Activity[]> {
    try {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from('activities')
        .select(ACTIVITY_SELECT)
        .in('status', ['published', 'ongoing', 'completed'])
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true });

      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as ActivityRow[]).map(parseActivity);
    } catch (error) {
      console.error('Failed to fetch upcoming activities:', error);
      throw error;
    }
  },

  async incrementRegisteredCount(id: string): Promise<Activity> {
    try {
      const activity = await this.getActivityById(id);
      return this.updateActivity(id, {
        currentParticipants: activity.currentParticipants + 1,
      });
    } catch (error) {
      console.error(`Failed to increment participant count for activity ${id}:`, error);
      throw error;
    }
  },

  async decrementRegisteredCount(id: string): Promise<Activity> {
    try {
      const activity = await this.getActivityById(id);
      return this.updateActivity(id, {
        currentParticipants: Math.max(0, activity.currentParticipants - 1),
      });
    } catch (error) {
      console.error(`Failed to decrement participant count for activity ${id}:`, error);
      throw error;
    }
  },
};
