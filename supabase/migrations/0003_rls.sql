-- KC Computer Club — Row Level Security policies
-- Run after 0002_functions.sql.
--
-- Principles
--   * service_role bypasses RLS and is only used by server-side route handlers.
--   * anon can read public content only.
--   * authenticated students can read member content and their own rows.
--   * admins can do everything, checked through the JWT app_metadata claim.
--
-- Supabase performance notes followed below:
--   * wrap auth.uid() in (select ...) so it is evaluated once per query;
--   * policies are scoped with `to anon` / `to authenticated`;
--   * every policy column has an index in 0001_schema.sql;
--   * application queries still filter explicitly, RLS is the safety net.

-- ─────────────────────────────────────────────────────────────
-- Enable RLS everywhere
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.notices enable row level security;
alter table public.notice_images enable row level security;
alter table public.notice_tags enable row level security;
alter table public.activities enable row level security;
alter table public.activity_form_fields enable row level security;
alter table public.signups enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_checklist_items enable row level security;
alter table public.attendance_config enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.club_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.migration_id_map enable row level security;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
-- Column-level rights are enforced by protect_profile_fields() in 0002.
-- Students may only change name / phone / instagram / avatar.

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- notices + children
-- ─────────────────────────────────────────────────────────────
drop policy if exists notices_public_read on public.notices;
create policy notices_public_read on public.notices
for select to anon
using (status = 'published' and visibility = 'public');

drop policy if exists notices_member_read on public.notices;
create policy notices_member_read on public.notices
for select to authenticated
using (
  (status = 'published' and visibility in ('public', 'internal'))
  or (select public.is_admin())
);

drop policy if exists notices_admin_write on public.notices;
create policy notices_admin_write on public.notices
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists notice_images_public_read on public.notice_images;
create policy notice_images_public_read on public.notice_images
for select to anon
using (
  exists (
    select 1 from public.notices n
    where n.id = notice_id
      and n.status = 'published'
      and n.visibility = 'public'
  )
);

drop policy if exists notice_images_member_read on public.notice_images;
create policy notice_images_member_read on public.notice_images
for select to authenticated
using (
  exists (
    select 1 from public.notices n
    where n.id = notice_id
      and n.status = 'published'
  )
  or (select public.is_admin())
);

drop policy if exists notice_images_admin_write on public.notice_images;
create policy notice_images_admin_write on public.notice_images
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists notice_tags_public_read on public.notice_tags;
create policy notice_tags_public_read on public.notice_tags
for select to anon
using (
  exists (
    select 1 from public.notices n
    where n.id = notice_id
      and n.status = 'published'
      and n.visibility = 'public'
  )
);

drop policy if exists notice_tags_member_read on public.notice_tags;
create policy notice_tags_member_read on public.notice_tags
for select to authenticated
using (
  exists (
    select 1 from public.notices n
    where n.id = notice_id
      and n.status = 'published'
  )
  or (select public.is_admin())
);

drop policy if exists notice_tags_admin_write on public.notice_tags;
create policy notice_tags_admin_write on public.notice_tags
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- activities + form fields
-- ─────────────────────────────────────────────────────────────
drop policy if exists activities_public_read on public.activities;
create policy activities_public_read on public.activities
for select to anon
using (status = 'published' and visibility = 'public');

drop policy if exists activities_member_read on public.activities;
create policy activities_member_read on public.activities
for select to authenticated
using (
  (status = 'published' and visibility in ('public', 'internal'))
  or (select public.is_admin())
);

drop policy if exists activities_admin_write on public.activities;
create policy activities_admin_write on public.activities
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists activity_form_fields_public_read on public.activity_form_fields;
create policy activity_form_fields_public_read on public.activity_form_fields
for select to anon
using (
  exists (
    select 1 from public.activities a
    where a.id = activity_id
      and a.status = 'published'
      and a.visibility = 'public'
  )
);

drop policy if exists activity_form_fields_member_read on public.activity_form_fields;
create policy activity_form_fields_member_read on public.activity_form_fields
for select to authenticated
using (
  exists (
    select 1 from public.activities a
    where a.id = activity_id
      and a.status = 'published'
  )
  or (select public.is_admin())
);

drop policy if exists activity_form_fields_admin_write on public.activity_form_fields;
create policy activity_form_fields_admin_write on public.activity_form_fields
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- signups
-- Anonymous signups must go through the server route (service role) after
-- captcha + activity checks. Direct anon inserts are never allowed.
-- ─────────────────────────────────────────────────────────────
drop policy if exists signups_select_own on public.signups;
create policy signups_select_own on public.signups
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists signups_insert_own on public.signups;
create policy signups_insert_own on public.signups
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
);

drop policy if exists signups_cancel_own on public.signups;
create policy signups_cancel_own on public.signups
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and status = 'cancelled');

drop policy if exists signups_admin_all on public.signups;
create policy signups_admin_all on public.signups
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.protect_signup_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  -- A student may only cancel their own signup, never rewrite identity data.
  if new.activity_id <> old.activity_id
     or new.user_id is distinct from old.user_id
     or new.full_name <> old.full_name
     or new.email <> old.email
     or new.phone is distinct from old.phone
     or new.student_no is distinct from old.student_no
     or new.grade is distinct from old.grade
     or new.additional_info is distinct from old.additional_info
     or new.form_data <> old.form_data
     or new.notes is distinct from old.notes
     or new.legacy_appwrite_id is distinct from old.legacy_appwrite_id then
    raise exception 'signups: protected fields cannot be changed';
  end if;

  if new.status <> 'cancelled' then
    raise exception 'signups: students may only cancel a signup';
  end if;

  return new;
end;
$$;

drop trigger if exists signups_protect_fields on public.signups;
create trigger signups_protect_fields
before update on public.signups
for each row execute function public.protect_signup_update();

-- ─────────────────────────────────────────────────────────────
-- projects + children
-- ─────────────────────────────────────────────────────────────
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
for select to anon
using (status = 'approved');

drop policy if exists projects_member_read on public.projects;
create policy projects_member_read on public.projects
for select to authenticated
using (
  status = 'approved'
  or (select public.is_project_member(id))
  or (select public.is_admin())
);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects
for insert to authenticated
with check (
  leader_id = (select auth.uid())
  and lower(leader_email) = (select public.current_user_email())
  and status = 'pending'
  and admin_feedback is null
);

drop policy if exists projects_update_leader on public.projects;
create policy projects_update_leader on public.projects
for update to authenticated
using (
  (select public.is_project_leader(id))
  or (select public.is_admin())
)
with check (
  (
    (select public.is_project_leader(id))
    and status in ('pending', 'revision')
  )
  or (select public.is_admin())
);
-- protect_project_update() blocks leader_email / status / feedback changes
-- for non-admins, so the above check is a second line of defence.

drop policy if exists projects_delete_leader on public.projects;
create policy projects_delete_leader on public.projects
for delete to authenticated
using (
  (select public.is_admin())
  or ((select public.is_project_leader(id)) and status = 'pending')
);

drop policy if exists project_members_public_read on public.project_members;
create policy project_members_public_read on public.project_members
for select to anon
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.status = 'approved'
  )
);

drop policy if exists project_members_member_read on public.project_members;
create policy project_members_member_read on public.project_members
for select to authenticated
using (
  (select public.is_project_member(project_id))
  or (select public.is_admin())
  or exists (
    select 1 from public.projects p
    where p.id = project_id and p.status = 'approved'
  )
);

drop policy if exists project_members_leader_write on public.project_members;
create policy project_members_leader_write on public.project_members
for all to authenticated
using (
  (select public.is_project_leader(project_id))
  or (select public.is_admin())
)
with check (
  (select public.is_project_leader(project_id))
  or (select public.is_admin())
);

drop policy if exists project_checklist_public_read on public.project_checklist_items;
create policy project_checklist_public_read on public.project_checklist_items
for select to anon
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.status = 'approved'
  )
);

drop policy if exists project_checklist_member_read on public.project_checklist_items;
create policy project_checklist_member_read on public.project_checklist_items
for select to authenticated
using (
  (select public.is_project_member(project_id))
  or (select public.is_admin())
  or exists (
    select 1 from public.projects p
    where p.id = project_id and p.status = 'approved'
  )
);

drop policy if exists project_checklist_leader_write on public.project_checklist_items;
create policy project_checklist_leader_write on public.project_checklist_items
for all to authenticated
using (
  (select public.is_project_leader(project_id))
  or (select public.is_admin())
)
with check (
  (select public.is_project_leader(project_id))
  or (select public.is_admin())
);

-- ─────────────────────────────────────────────────────────────
-- attendance
-- Sessions (and their check-in code) are admin-only. Students use the
-- get_attendance_status() RPC and the safe public view below.
-- ─────────────────────────────────────────────────────────────
drop policy if exists attendance_config_admin_all on public.attendance_config;
create policy attendance_config_admin_all on public.attendance_config
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists attendance_sessions_admin_all on public.attendance_sessions;
create policy attendance_sessions_admin_all on public.attendance_sessions
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists attendance_records_select_own on public.attendance_records;
create policy attendance_records_select_own on public.attendance_records
for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists attendance_records_admin_all on public.attendance_records;
create policy attendance_records_admin_all on public.attendance_records
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
-- Students insert/update their own record only through student_check_in(),
-- a security-definer RPC that bypasses RLS.

-- Safe projection: no checkin_code, no created_by. The view owner (postgres)
-- bypasses RLS, so only these explicitly listed columns are exposed.
create or replace view public.public_attendance_sessions as
select
  id,
  week_number,
  session_number,
  session_date,
  starts_at,
  ends_at,
  status
from public.attendance_sessions
where status in ('scheduled', 'open');

revoke all on public.public_attendance_sessions from public, anon, authenticated;
grant select on public.public_attendance_sessions to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- comments
-- Public reads only see approved, non-deleted comments without an email.
-- Anonymous submits go through the server route (service role).
-- ─────────────────────────────────────────────────────────────
drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments
for select to anon
using (status = 'approved' and is_deleted = false);

drop policy if exists comments_member_read on public.comments;
create policy comments_member_read on public.comments
for select to authenticated
using (
  (status = 'approved' and is_deleted = false)
  or (select public.is_admin())
);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and is_deleted = false
  and reply is null
);

drop policy if exists comments_admin_all on public.comments;
create policy comments_admin_all on public.comments
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- notifications
-- App notifications were removed from the UI; the table is kept for real
-- server-generated notifications later. Writes are service-role only.
-- ─────────────────────────────────────────────────────────────
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
for delete to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- club settings
-- ─────────────────────────────────────────────────────────────
drop policy if exists club_settings_public_read on public.club_settings;
create policy club_settings_public_read on public.club_settings
for select to anon, authenticated
using (true);

drop policy if exists club_settings_admin_write on public.club_settings;
create policy club_settings_admin_write on public.club_settings
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- audit log + migration bookkeeping (service role only)
-- ─────────────────────────────────────────────────────────────
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
for select to authenticated
using ((select public.is_admin()));

-- migration_id_map intentionally has no policy: only service_role can use it.

-- ─────────────────────────────────────────────────────────────
-- Explicit function grants
-- ─────────────────────────────────────────────────────────────
grant execute on function public.current_user_email() to anon, authenticated;
grant execute on function public.is_project_leader(uuid) to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
