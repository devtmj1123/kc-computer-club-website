-- KC Computer Club — functions, triggers and RPCs
-- Run after 0001_schema.sql.

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_project_leader(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        p.leader_id = auth.uid()
        or lower(p.leader_email) = public.current_user_email()
      )
  );
$$;

revoke all on function public.is_project_leader(uuid) from public;
grant execute on function public.is_project_leader(uuid) to authenticated;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.projects p
      where p.id = p_project_id
        and (
          p.leader_id = auth.uid()
          or lower(p.leader_email) = public.current_user_email()
        )
    )
    or exists (
      select 1
      from public.project_members m
      where m.project_id = p_project_id
        and (
          m.user_id = auth.uid()
          or lower(m.email) = public.current_user_email()
        )
    );
$$;

revoke all on function public.is_project_member(uuid) from public;
grant execute on function public.is_project_member(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Auth → profiles
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    student_no,
    chinese_name,
    english_name,
    role,
    require_password_change,
    legacy_appwrite_id
  )
  values (
    new.id,
    lower(new.email),
    nullif(new.raw_user_meta_data ->> 'student_no', ''),
    nullif(new.raw_user_meta_data ->> 'chinese_name', ''),
    nullif(new.raw_user_meta_data ->> 'english_name', ''),
    case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'::public.user_role
      else 'student'::public.user_role
    end,
    coalesce((new.raw_user_meta_data ->> 'require_password_change')::boolean, true),
    nullif(new.raw_user_meta_data ->> 'legacy_appwrite_id', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Guard rails for student-editable rows
-- ─────────────────────────────────────────────────────────────
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.id <> old.id
     or new.email <> old.email
     or new.student_no is distinct from old.student_no
     or new.role <> old.role
     or new.permissions <> old.permissions
     or new.is_active <> old.is_active
     or new.require_password_change <> old.require_password_change
     or new.group_level is distinct from old.group_level
     or new.level is distinct from old.level
     or new.group_name is distinct from old.group_name
     or new.position is distinct from old.position
     or new.notes is distinct from old.notes
     or new.class_name_cn is distinct from old.class_name_cn
     or new.class_name_en is distinct from old.class_name_en
     or new.class_code is distinct from old.class_code
     or new.last_login_at is distinct from old.last_login_at
     or new.legacy_appwrite_id is distinct from old.legacy_appwrite_id then
    raise exception 'profiles: protected fields cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.protect_project_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.status <> old.status
     or new.admin_feedback is distinct from old.admin_feedback
     or new.leader_id is distinct from old.leader_id
     or new.leader_email <> old.leader_email
     or new.legacy_appwrite_id is distinct from old.legacy_appwrite_id then
    raise exception 'projects: protected fields cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_protect_fields on public.projects;
create trigger projects_protect_fields
before update on public.projects
for each row execute function public.protect_project_update();

create or replace function public.protect_comment_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.content_type <> old.content_type
     or new.content_id <> old.content_id
     or new.user_id is distinct from old.user_id
     or new.status <> old.status
     or new.reply is distinct from old.reply
     or new.reply_author_id is distinct from old.reply_author_id
     or new.reply_author_name is distinct from old.reply_author_name
     or new.reply_at is distinct from old.reply_at
     or new.email is distinct from old.email
     or new.nickname <> old.nickname then
    raise exception 'comments: protected fields cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_protect_fields on public.comments;
create trigger comments_protect_fields
before update on public.comments
for each row execute function public.protect_comment_update();

-- ─────────────────────────────────────────────────────────────
-- Updated-at triggers
-- ─────────────────────────────────────────────────────────────
drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at before update on public.notices
for each row execute function public.set_updated_at();

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists signups_set_updated_at on public.signups;
create trigger signups_set_updated_at before update on public.signups
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists attendance_records_set_updated_at on public.attendance_records;
create trigger attendance_records_set_updated_at before update on public.attendance_records
for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at before update on public.comments
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Signup counter
-- ─────────────────────────────────────────────────────────────
create or replace function public.sync_activity_signup_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.activity_id, old.activity_id);
  update public.activities a
  set signup_count = (
    select count(*)
    from public.signups s
    where s.activity_id = target_id
      and s.status <> 'cancelled'
  )
  where a.id = target_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists signups_sync_count on public.signups;
create trigger signups_sync_count
after insert or update or delete on public.signups
for each row execute function public.sync_activity_signup_count();

-- ─────────────────────────────────────────────────────────────
-- Attendance RPCs
-- ─────────────────────────────────────────────────────────────
create or replace function public.student_check_in(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_existing public.attendance_records%rowtype;
  v_status public.attendance_status;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'error', '请先登录');
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if not found or not v_profile.is_active or v_profile.role <> 'student' then
    return jsonb_build_object('success', false, 'error', '学生账号无效');
  end if;

  select * into v_session
  from public.attendance_sessions
  where checkin_code = p_code
    and code_enabled = true
    and status = 'open'
    and now() between starts_at and ends_at
  order by starts_at desc
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'error', '验证码错误或签到未开放');
  end if;

  select * into v_existing
  from public.attendance_records
  where session_id = v_session.id and student_id = v_profile.id;

  if found and v_existing.status <> 'pending' then
    return jsonb_build_object(
      'success', true,
      'already_checked_in', true,
      'session_number', v_session.session_number,
      'status', v_existing.status,
      'checked_in_at', v_existing.check_in_at
    );
  end if;

  v_status := case
    when now() > v_session.starts_at + interval '10 minutes' then 'late'::public.attendance_status
    else 'present'::public.attendance_status
  end;

  insert into public.attendance_records (
    session_id,
    student_id,
    student_name,
    student_email,
    check_in_at,
    status
  )
  values (
    v_session.id,
    v_profile.id,
    coalesce(v_profile.chinese_name, v_profile.english_name, v_profile.email),
    v_profile.email,
    now(),
    v_status
  )
  on conflict (session_id, student_id) do update
  set check_in_at = excluded.check_in_at,
      status = excluded.status,
      updated_at = now()
  returning * into v_existing;

  return jsonb_build_object(
    'success', true,
    'already_checked_in', false,
    'session_number', v_session.session_number,
    'status', v_existing.status,
    'checked_in_at', v_existing.check_in_at
  );
end;
$$;

revoke all on function public.student_check_in(text) from public;
grant execute on function public.student_check_in(text) to authenticated;

create or replace function public.get_attendance_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_config public.attendance_config%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_week_number int;
begin
  select * into v_config from public.attendance_config where id = 1;
  if not found then
    return jsonb_build_object(
      'is_open', false,
      'week_number', null,
      'config', null,
      'session', null,
      'code_enabled', false,
      'has_code', false
    );
  end if;

  v_week_number := greatest(
    1,
    floor((current_date - v_config.week_start_date) / 7.0)::int + 1
  );

  select * into v_session
  from public.attendance_sessions
  where status = 'open'
    and now() between starts_at and ends_at
  order by starts_at desc
  limit 1;

  return jsonb_build_object(
    'is_open', found,
    'week_number', v_week_number,
    'config', jsonb_build_object(
      'day_of_week', v_config.day_of_week,
      'session1_start', v_config.session1_start,
      'session1_duration', v_config.session1_duration,
      'session2_start', v_config.session2_start,
      'session2_duration', v_config.session2_duration,
      'week_start_date', v_config.week_start_date
    ),
    'session', case
      when found then jsonb_build_object(
        'id', v_session.id,
        'week_number', v_session.week_number,
        'session_number', v_session.session_number,
        'starts_at', v_session.starts_at,
        'ends_at', v_session.ends_at,
        'status', v_session.status
      )
      else null
    end,
    'code_enabled', v_config.code_enabled,
    'has_code', found
  );
end;
$$;

revoke all on function public.get_attendance_status() from public;
grant execute on function public.get_attendance_status() to anon, authenticated;
