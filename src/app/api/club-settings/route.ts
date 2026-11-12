import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAdminSession, requireAdminSession } from '@/lib/admin-session';
import type { ClubActivityItem, ClubFaqItem, ClubSettings } from '@/lib/club-settings';

interface ClubSettingsRow {
  id: number;
  club_name: string;
  club_name_en: string | null;
  about_title: string | null;
  about_description: string | null;
  description: string | null;
  email: string | null;
  location: string | null;
  meeting_time: string | null;
  website: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  recruitment_status: string | null;
  founded_year: number | null;
  group_count: number | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_highlights: unknown;
  about_heading: string | null;
  about_activities: unknown;
  faqs: unknown;
  join_title: string | null;
  join_description: string | null;
  active_members: number;
  yearly_activities: number;
  award_projects: number;
  partners: number;
  github: string | null;
  discord: string | null;
  instagram: string | null;
  youtube: string | null;
}

const FIELD_MAP: Record<keyof ClubSettings, string> = {
  clubName: 'club_name',
  clubNameEn: 'club_name_en',
  aboutTitle: 'about_title',
  aboutDescription: 'about_description',
  aboutEmail: 'email',
  aboutLocation: 'location',
  aboutMeetingTime: 'meeting_time',
  website: 'website',
  logoUrl: 'logo_url',
  heroImage: 'hero_image_url',
  heroImageAlt: 'hero_image_alt',
  recruitmentStatus: 'recruitment_status',
  foundedYear: 'founded_year',
  groupCount: 'group_count',
  heroEyebrow: 'hero_eyebrow',
  heroTitle: 'hero_title',
  heroSubtitle: 'hero_subtitle',
  heroHighlights: 'hero_highlights',
  aboutHeading: 'about_heading',
  aboutActivities: 'about_activities',
  faqs: 'faqs',
  joinTitle: 'join_title',
  joinDescription: 'join_description',
  activeMembers: 'active_members',
  yearlyActivities: 'yearly_activities',
  awardProjects: 'award_projects',
  partners: 'partners',
  githubUrl: 'github',
  discordUrl: 'discord',
  instagramUrl: 'instagram',
  youtubeUrl: 'youtube',
};

const NUMERIC_FIELDS = new Set([
  'activeMembers',
  'yearlyActivities',
  'awardProjects',
  'partners',
  'foundedYear',
  'groupCount',
]);

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 20);
}

function sanitizeActivities(value: unknown): ClubActivityItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 20)
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : '',
      description: typeof item.description === 'string' ? item.description.trim() : '',
    }))
    .filter((item) => item.title || item.description);
}

function sanitizeFaqs(value: unknown): ClubFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 30)
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      question: typeof item.question === 'string' ? item.question.trim() : '',
      answer: typeof item.answer === 'string' ? item.answer.trim() : '',
    }))
    .filter((item) => item.question || item.answer);
}

function mapSettings(row: ClubSettingsRow): ClubSettings {
  return {
    clubName: row.club_name || '',
    clubNameEn: row.club_name_en || '',
    aboutTitle: row.about_title || row.club_name || '',
    aboutDescription: row.about_description || row.description || '',
    aboutEmail: row.email || '',
    aboutLocation: row.location || '',
    aboutMeetingTime: row.meeting_time || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    heroImage: row.hero_image_url || '',
    heroImageAlt: row.hero_image_alt || '',
    recruitmentStatus: row.recruitment_status || '',
    foundedYear: row.founded_year ?? 1983,
    groupCount: row.group_count ?? 5,
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroHighlights: sanitizeStringList(row.hero_highlights),
    aboutHeading: row.about_heading || '',
    aboutActivities: sanitizeActivities(row.about_activities),
    faqs: sanitizeFaqs(row.faqs),
    joinTitle: row.join_title || '',
    joinDescription: row.join_description || '',
    activeMembers: row.active_members ?? 0,
    yearlyActivities: row.yearly_activities ?? 0,
    awardProjects: row.award_projects ?? 0,
    partners: row.partners ?? 0,
    githubUrl: row.github || '',
    discordUrl: row.discord || '',
    instagramUrl: row.instagram || '',
    youtubeUrl: row.youtube || '',
  };
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /column .* does not exist|could not find the .* column/i.test(error.message || '')
  );
}

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('club_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('读取社团设置失败:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch club settings', message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No settings found', message: '请先在后台初始化社团设置' },
        { status: 404 }
      );
    }

    const row = data as ClubSettingsRow;
    return NextResponse.json({
      ...mapSettings(row),
      migrationRequired: !('club_name_en' in data),
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Failed to fetch club settings:', err);
    return NextResponse.json(
      { error: 'Failed to fetch club settings', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<ClubSettings>;
    const session = getAdminSession(request);
    const admin = getSupabaseAdminClient();

    const { data: existing, error: readError } = await admin
      .from('club_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (readError) {
      throw new Error(readError.message);
    }

    const update: Record<string, unknown> = {
      updated_by: session?.sub || null,
      updated_at: new Date().toISOString(),
    };

    for (const [field, column] of Object.entries(FIELD_MAP)) {
      if (field === 'clubName') continue;
      const value = body[field as keyof ClubSettings];
      if (value === undefined) continue;

      if (field === 'heroHighlights') {
        update[column] = sanitizeStringList(value);
      } else if (field === 'aboutActivities') {
        update[column] = sanitizeActivities(value);
      } else if (field === 'faqs') {
        update[column] = sanitizeFaqs(value);
      } else if (NUMERIC_FIELDS.has(field)) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) update[column] = parsed;
      } else {
        update[column] = typeof value === 'string' ? value : String(value ?? '');
      }
    }

    // `club_name` is NOT NULL without a database default. Always include it in
    // the upsert candidate, otherwise Postgres rejects the INSERT half of
    // `ON CONFLICT DO UPDATE` even when the row already exists.
    update.id = 1;
    update.club_name =
      existing && typeof existing.club_name === 'string' && existing.club_name.trim()
        ? existing.club_name
        : typeof body.clubName === 'string' && body.clubName.trim()
          ? body.clubName.trim()
          : 'KC Computer Club';

    const { data, error } = await admin
      .from('club_settings')
      .upsert(update, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      if (isMissingColumnError(error)) {
        return NextResponse.json(
          {
            error: 'Migration required',
            message:
              '新字段尚未写入数据库。请先在 Supabase SQL Editor 执行 supabase/migrations/0006_club_information.sql，然后重新保存。',
          },
          { status: 503 }
        );
      }

      console.error('保存社团设置失败:', error.message);
      return NextResponse.json(
        { error: 'Failed to save club settings', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...mapSettings(data as ClubSettingsRow), migrationRequired: false });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Failed to save club settings:', err);
    return NextResponse.json(
      { error: 'Failed to save club settings', message: err.message },
      { status: 500 }
    );
  }
}
