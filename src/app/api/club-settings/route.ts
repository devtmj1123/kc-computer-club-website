import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAdminSession, requireAdminSession } from '@/lib/admin-session';

interface ClubSettings {
  id: string;
  clubName: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutEmail: string;
  aboutLocation: string;
  aboutMeetingTime: string;
  website: string;
  logoUrl: string;
  heroImage: string;
  heroImageAlt: string;
  activeMembers: number;
  yearlyActivities: number;
  awardProjects: number;
  partners: number;
  githubUrl: string;
  discordUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
}

interface ClubSettingsRow {
  id: number;
  club_name: string;
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
  id: 'id',
  clubName: 'club_name',
  aboutTitle: 'about_title',
  aboutDescription: 'about_description',
  aboutEmail: 'email',
  aboutLocation: 'location',
  aboutMeetingTime: 'meeting_time',
  website: 'website',
  logoUrl: 'logo_url',
  heroImage: 'hero_image_url',
  heroImageAlt: 'hero_image_alt',
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
]);

function mapSettings(row: ClubSettingsRow): ClubSettings {
  return {
    id: String(row.id),
    clubName: row.club_name,
    aboutTitle: row.about_title || row.club_name,
    aboutDescription: row.about_description || row.description || '',
    aboutEmail: row.email || '',
    aboutLocation: row.location || '',
    aboutMeetingTime: row.meeting_time || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    heroImage: row.hero_image_url || '',
    heroImageAlt: row.hero_image_alt || '',
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

    return NextResponse.json(mapSettings(data as ClubSettingsRow));
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
      if (field === 'id' || field === 'clubName') continue;
      const value = body[field as keyof ClubSettings];
      if (value === undefined) continue;
      if (NUMERIC_FIELDS.has(field)) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) update[column] = parsed;
      } else {
        update[column] = typeof value === 'string' ? value : String(value ?? '');
      }
    }

    if (!existing) {
      update.id = 1;
      update.club_name =
        typeof body.clubName === 'string' && body.clubName.trim()
          ? body.clubName.trim()
          : 'KC Computer Club';
    }

    const { data, error } = await admin
      .from('club_settings')
      .upsert(update, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('保存社团设置失败:', error.message);
      return NextResponse.json(
        { error: 'Failed to save club settings', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(mapSettings(data as ClubSettingsRow));
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Failed to save club settings:', err);
    return NextResponse.json(
      { error: 'Failed to save club settings', message: err.message },
      { status: 500 }
    );
  }
}
