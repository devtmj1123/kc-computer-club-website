-- KC Computer Club — initial Supabase schema
-- Run with: supabase db push
-- All timestamps are UTC. Legacy Appwrite ids are kept for reconciliation.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('student', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publish_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.visibility as enum ('public', 'internal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_status as enum ('draft', 'published', 'ongoing', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.signup_mode as enum ('auth_required', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.signup_status as enum ('pending', 'confirmed', 'cancelled', 'attended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum ('pending', 'approved', 'rejected', 'revision');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_session_status as enum ('scheduled', 'open', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.comment_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.comment_target as enum ('notice', 'activity');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('approval', 'notice', 'activity', 'announcement');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  student_no text unique,
  chinese_name text,
  english_name text,
  class_name_cn text,
  class_name_en text,
  class_code text,
  group_level text,
  level text,
  phone text,
  instagram text,
  group_name text,
  position text,
  notes text,
  role public.user_role not null default 'student',
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  require_password_change boolean not null default true,
  avatar_url text,
  last_login_at timestamptz,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_student_no_idx on public.profiles(student_no);
create index if not exists profiles_email_lower_idx on public.profiles(lower(email));
create index if not exists profiles_name_trgm_idx on public.profiles using gin ((coalesce(chinese_name, '') || ' ' || coalesce(english_name, '')) gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- Notices
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default '其他',
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  last_editor_id uuid references public.profiles(id) on delete set null,
  last_editor_name text,
  status public.publish_status not null default 'draft',
  visibility public.visibility not null default 'public',
  pinned boolean not null default false,
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_public_idx on public.notices(status, visibility, published_at desc);
create index if not exists notices_pinned_idx on public.notices(pinned desc, published_at desc);
create index if not exists notices_search_idx on public.notices using gin(search_vector);

create table if not exists public.notice_images (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);

create index if not exists notice_images_notice_idx on public.notice_images(notice_id, sort_order);

create table if not exists public.notice_tags (
  notice_id uuid not null references public.notices(id) on delete cascade,
  tag text not null,
  primary key (notice_id, tag)
);

-- ─────────────────────────────────────────────────────────────
-- Activities
-- ─────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default '其他',
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text not null,
  max_participants int not null default 0,
  signup_deadline timestamptz not null,
  organizer_id uuid references public.profiles(id) on delete set null,
  organizer_name text not null,
  status public.activity_status not null default 'draft',
  visibility public.visibility not null default 'public',
  signup_mode public.signup_mode not null default 'public',
  cover_url text,
  allowed_grades text[] not null default '{}',
  signup_count int not null default 0,
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, '')
    )
  ) stored,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_time_check check (end_at > start_at),
  constraint activity_deadline_check check (signup_deadline <= start_at)
);

create index if not exists activities_public_idx on public.activities(status, visibility, start_at);
create index if not exists activities_start_idx on public.activities(start_at);
create index if not exists activities_search_idx on public.activities using gin(search_vector);

create table if not exists public.activity_form_fields (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'email', 'phone', 'select', 'textarea', 'date')),
  required boolean not null default false,
  options jsonb not null default '[]',
  placeholder text,
  sort_order int not null default 0,
  unique (activity_id, field_key)
);

create index if not exists activity_form_fields_activity_idx on public.activity_form_fields(activity_id, sort_order);

-- ─────────────────────────────────────────────────────────────
-- Signups
-- ─────────────────────────────────────────────────────────────
create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  student_no text,
  grade text,
  additional_info text,
  form_data jsonb not null default '{}',
  status public.signup_status not null default 'pending',
  notes text,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists signups_activity_email_uniq on public.signups(activity_id, lower(email));
create unique index if not exists signups_activity_user_uniq on public.signups(activity_id, user_id) where user_id is not null;
create index if not exists signups_activity_status_idx on public.signups(activity_id, status);
create index if not exists signups_user_idx on public.signups(user_id);

-- ─────────────────────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  title text not null,
  description text not null,
  category text not null,
  objectives text,
  timeline text,
  resources text,
  project_link text,
  leader_id uuid references public.profiles(id) on delete set null,
  leader_email text not null,
  status public.project_status not null default 'pending',
  admin_feedback text,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_leader_idx on public.projects(leader_id);
create index if not exists projects_leader_email_idx on public.projects(lower(leader_email));

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('leader', 'member', 'tech_lead', 'design_lead')),
  joined_at timestamptz not null default now(),
  sort_order int not null default 0
);

create unique index if not exists project_members_email_uniq on public.project_members(project_id, lower(email));
create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists project_members_project_idx on public.project_members(project_id, sort_order);

create table if not exists public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  completed boolean not null default false,
  completed_at timestamptz,
  assignee text,
  sort_order int not null default 0
);

create index if not exists project_checklist_project_idx on public.project_checklist_items(project_id, sort_order);

-- ─────────────────────────────────────────────────────────────
-- Attendance
-- ─────────────────────────────────────────────────────────────
create table if not exists public.attendance_config (
  id smallint primary key default 1 check (id = 1),
  day_of_week smallint not null default 2 check (day_of_week between 0 and 6),
  session1_start time not null default '15:20',
  session1_duration int not null default 5,
  session2_start time not null default '16:35',
  session2_duration int not null default 5,
  week_start_date date not null,
  code_enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  session_number smallint not null check (session_number in (1, 2)),
  session_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  checkin_code text,
  code_enabled boolean not null default false,
  status public.attendance_session_status not null default 'scheduled',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (week_number, session_number),
  constraint session_time_check check (ends_at > starts_at)
);

create index if not exists attendance_sessions_open_idx on public.attendance_sessions(status, starts_at, ends_at);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  check_in_at timestamptz,
  status public.attendance_status not null default 'pending',
  notes text,
  legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create index if not exists attendance_records_student_idx on public.attendance_records(student_id, session_id);
create index if not exists attendance_records_session_idx on public.attendance_records(session_id, status);

-- ─────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content_type public.comment_target not null,
  content_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  email text,
  content text not null,
  status public.comment_status not null default 'pending',
  is_deleted boolean not null default false,
  reply text,
  reply_author_id uuid references public.profiles(id) on delete set null,
  reply_author_name text,
  reply_at timestamptz,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_target_idx on public.comments(content_type, content_id, status, created_at desc);
create index if not exists comments_pending_idx on public.comments(status, created_at desc);
create index if not exists comments_user_idx on public.comments(user_id);

-- ─────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null,
  read boolean not null default false,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, read, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Club settings
-- ─────────────────────────────────────────────────────────────
create table if not exists public.club_settings (
  id smallint primary key default 1 check (id = 1),
  club_name text not null,
  about_title text,
  about_description text,
  description text,
  mission text,
  vision text,
  email text,
  phone text,
  location text,
  meeting_time text,
  website text,
  facebook text,
  twitter text,
  instagram text,
  discord text,
  github text,
  youtube text,
  logo_url text,
  favicon_url text,
  hero_image_url text,
  hero_image_alt text,
  recruitment_status text,
  notice_card_logo_url text,
  activity_card_logo_url text,
  project_card_logo_url text,
  card_logo_link text,
  active_members int not null default 0,
  yearly_activities int not null default 0,
  award_projects int not null default 0,
  partners int not null default 0,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Audit + migration bookkeeping
-- ─────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs(entity, entity_id, created_at desc);

create table if not exists public.migration_id_map (
  appwrite_collection text not null,
  appwrite_id text not null,
  new_uuid uuid not null,
  created_at timestamptz not null default now(),
  primary key (appwrite_collection, appwrite_id)
);

-- Default settings row so public pages have a value before admin edits.
insert into public.club_settings (id, club_name)
values (1, 'KC Computer Club')
on conflict (id) do nothing;
