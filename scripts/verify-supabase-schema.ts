/**
 * Verifies the Supabase SQL migrations without a Supabase project.
 *
 * PGlite is a WASM build of Postgres. The script creates minimal stand-ins for
 * the parts Supabase provides (auth schema, storage schema, anon/authenticated
 * roles) and then runs supabase/migrations/0001..0004 in order.
 *
 * It then exercises the security rules that are easy to get wrong:
 *   * RLS visibility for anon / students / admins
 *   * protected profile / project / signup / comment fields
 *   * signup counter trigger
 *   * student_check_in() RPC and the safe attendance view
 *   * storage bucket policies
 *
 * Usage: npm run db:verify
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { PGlite } from '@electric-sql/pglite';

// The package exports map is not understood by ts-node's CommonJS resolver, so
// resolve the contrib extension bundles directly from the installed package.
const requireFromHere = createRequire(__filename);
const pgliteDist = path.dirname(
  requireFromHere.resolve('@electric-sql/pglite')
);
const { pg_trgm } = requireFromHere(
  path.join(pgliteDist, 'contrib', 'pg_trgm.cjs')
) as { pg_trgm: unknown };
const { pgcrypto } = requireFromHere(
  path.join(pgliteDist, 'contrib', 'pgcrypto.cjs')
) as { pgcrypto: unknown };

type Role = 'anon' | 'authenticated' | 'service_role';
type Row = Record<string, unknown>;

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const STUDENT_1 = '11111111-1111-4111-8111-111111111111';
const STUDENT_2 = '22222222-2222-4222-8222-222222222222';
const STUDENT_3 = '44444444-4444-4444-8444-444444444444';
const ADMIN = '33333333-3333-4333-8333-333333333333';

const NOTICE_PUBLIC = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NOTICE_INTERNAL = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NOTICE_DRAFT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const ACTIVITY_PUBLIC = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ACTIVITY_INTERNAL = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const PROJECT_APPROVED = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const PROJECT_PENDING = '99999999-9999-4999-8999-999999999999';

let passed = 0;
const failures: string[] = [];

function check(condition: unknown, label: string): void {
  if (condition) {
    passed += 1;
    return;
  }

  failures.push(label);
  console.error(`  FAIL  ${label}`);
}

async function expectRows(
  db: PGlite,
  sql: string,
  expected: number,
  label: string,
  params?: unknown[]
): Promise<void> {
  const result = await db.query(sql, params);
  check(
    result.rows.length === expected,
    `${label} (expected ${expected} row(s), got ${result.rows.length})`
  );
}

async function expectError(
  action: () => Promise<unknown>,
  label: string,
  pattern?: RegExp
): Promise<void> {
  try {
    await action();
    check(false, `${label} (expected an error, statement succeeded)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    check(
      !pattern || pattern.test(message),
      `${label} (unexpected error: ${message})`
    );
  }
}

async function setActor(
  db: PGlite,
  role: Role,
  claims: Record<string, unknown> = {}
): Promise<void> {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    JSON.stringify(claims),
  ]);
  await db.exec(`set role ${role}`);
}

async function asPostgres(db: PGlite): Promise<void> {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claims', '', false)`);
}

function claimsFor(id: string, email: string, role: 'student' | 'admin') {
  return {
    sub: id,
    email,
    role: 'authenticated',
    app_metadata: { role },
  };
}

function topLevelRoleColumn(viewDefinition: string): boolean {
  return /checkin_code/i.test(viewDefinition);
}

async function bootstrapSupabaseStubs(db: PGlite): Promise<void> {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
  `);

  await db.exec(`
    create schema auth;
    create schema storage;

    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb not null default '{}'::jsonb,
      raw_app_meta_data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create or replace function auth.jwt()
    returns jsonb
    language sql
    stable
    as $$
      select coalesce(
        nullif(current_setting('request.jwt.claims', true), ''),
        '{}'
      )::jsonb;
    $$;

    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(auth.jwt() ->> 'sub', '')::uuid;
    $$;

    create or replace function auth.role()
    returns text
    language sql
    stable
    as $$
      select coalesce(auth.jwt() ->> 'role', '');
    $$;

    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[],
      created_at timestamptz not null default now()
    );

    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null references storage.buckets(id),
      name text not null,
      owner uuid,
      metadata jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      last_accessed_at timestamptz
    );
    alter table storage.objects enable row level security;

    create or replace function storage.foldername(name text)
    returns text[]
    language sql
    immutable
    as $$
      select coalesce(
        (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)],
        '{}'::text[]
      );
    $$;
  `);
}

async function grantSupabaseDefaults(db: PGlite): Promise<void> {
  await db.exec(`
    grant usage on schema public, auth, storage to anon, authenticated, service_role;

    grant select on all tables in schema public to anon;
    grant select, insert, update, delete on all tables in schema public
      to authenticated;
    grant all on all tables in schema public to service_role;
    grant usage, select on all sequences in schema public
      to anon, authenticated, service_role;

    grant execute on all functions in schema auth
      to anon, authenticated, service_role;

    grant select on storage.buckets to anon, authenticated, service_role;
    grant select, insert, update, delete on storage.objects
      to anon, authenticated, service_role;

    grant usage on schema public to anon, authenticated, service_role;
  `);
}

async function seedFixtures(db: PGlite): Promise<void> {
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
    values
      (
        '${STUDENT_1}',
        'student1@test.local',
        '{"student_no":"S001","chinese_name":"学生一","english_name":"Student One"}',
        '{"role":"student"}'
      ),
      (
        '${STUDENT_2}',
        'student2@test.local',
        '{"student_no":"S002","chinese_name":"学生二"}',
        '{"role":"student"}'
      ),
      (
        '${ADMIN}',
        'admin@test.local',
        '{"chinese_name":"管理员"}',
        '{"role":"admin"}'
      );

    insert into public.notices
      (id, title, content, author_id, author_name, status, visibility, published_at)
    values
      ('${NOTICE_PUBLIC}', '公开公告', '公开内容', '${ADMIN}', '管理员', 'published', 'public', now()),
      ('${NOTICE_INTERNAL}', '内部公告', '内部内容', '${ADMIN}', '管理员', 'published', 'internal', now()),
      ('${NOTICE_DRAFT}', '草稿公告', '草稿内容', '${ADMIN}', '管理员', 'draft', 'public', null);

    insert into public.notice_images (notice_id, url, sort_order)
    values ('${NOTICE_PUBLIC}', 'https://example.test/a.webp', 0);

    insert into public.notice_tags (notice_id, tag)
    values ('${NOTICE_PUBLIC}', '公告');

    insert into public.activities
      (id, title, description, start_at, end_at, location, signup_deadline,
       organizer_id, organizer_name, status, visibility)
    values
      (
        '${ACTIVITY_PUBLIC}', '公开活动', '公开活动内容',
        now() + interval '1 day', now() + interval '1 day 2 hours',
        '礼堂', now() + interval '20 hours',
        '${ADMIN}', '管理员', 'published', 'public'
      ),
      (
        '${ACTIVITY_INTERNAL}', '内部活动', '内部活动内容',
        now() + interval '2 days', now() + interval '2 days 2 hours',
        '电脑室', now() + interval '44 hours',
        '${ADMIN}', '管理员', 'published', 'internal'
      );

    insert into public.signups
      (activity_id, user_id, full_name, email, status)
    values
      ('${ACTIVITY_PUBLIC}', '${STUDENT_1}', '学生一', 'student1@test.local', 'pending');

    insert into public.projects
      (id, team_name, title, description, category, leader_id, leader_email, status)
    values
      (
        '${PROJECT_APPROVED}', '一队', '已批准项目', '项目说明', 'other',
        '${STUDENT_1}', 'student1@test.local', 'approved'
      ),
      (
        '${PROJECT_PENDING}', '二队', '待审项目', '项目说明', 'other',
        '${STUDENT_1}', 'student1@test.local', 'pending'
      );

    insert into public.project_members (project_id, user_id, name, email, role)
    values
      ('${PROJECT_APPROVED}', '${STUDENT_1}', '学生一', 'student1@test.local', 'leader');

    insert into public.attendance_config
      (id, day_of_week, week_start_date, code_enabled)
    values (1, 2, current_date - 28, true);

    insert into public.attendance_sessions
      (week_number, session_number, session_date, starts_at, ends_at,
       checkin_code, code_enabled, status)
    values
      (
        1, 1, current_date,
        now() - interval '5 minutes', now() + interval '30 minutes',
        'ABCD12', true, 'open'
      ),
      (
        2, 1, current_date,
        now() - interval '20 minutes', now() + interval '10 minutes',
        'LATE01', true, 'open'
      );

    insert into public.comments
      (content_type, content_id, user_id, nickname, content, status)
    values
      ('notice', '${NOTICE_PUBLIC}', '${STUDENT_1}', '小明', '已通过评论', 'approved'),
      ('notice', '${NOTICE_PUBLIC}', '${STUDENT_1}', '小红', '待审核评论', 'pending');
  `);
}

async function testSchema(db: PGlite): Promise<void> {
  console.log('\n[schema] tables, indexes, functions, view');

  const expectedTables = [
    'profiles',
    'notices',
    'notice_images',
    'notice_tags',
    'activities',
    'activity_form_fields',
    'signups',
    'projects',
    'project_members',
    'project_checklist_items',
    'attendance_config',
    'attendance_sessions',
    'attendance_records',
    'comments',
    'notifications',
    'club_settings',
    'audit_logs',
    'migration_id_map',
  ];

  for (const table of expectedTables) {
    const result = await db.query(
      `select 1 from information_schema.tables
       where table_schema = 'public' and table_name = $1`,
      [table]
    );
    check(result.rows.length === 1, `table public.${table} exists`);
  }

  const functions = [
    'is_admin',
    'handle_new_user',
    'student_check_in',
    'get_attendance_status',
    'protect_profile_fields',
    'protect_project_update',
  ];

  for (const name of functions) {
    const result = await db.query(
      `select 1 from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = $1`,
      [name]
    );
    check(result.rows.length > 0, `function public.${name} exists`);
  }

  const view = await db.query<{ definition: string }>(
    `select pg_get_viewdef('public.public_attendance_sessions'::regclass, true) as definition`
  );
  const definition = view.rows[0]?.definition || '';
  check(!topLevelRoleColumn(definition), 'public attendance view has no checkin_code');

  const rls = await db.query<{ relname: string }>(
    `select c.relname
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity`
  );
  const rlsTables = new Set(rls.rows.map((row) => row.relname));
  for (const table of expectedTables) {
    check(rlsTables.has(table), `RLS enabled on public.${table}`);
  }

  const policyCount = await db.query<{ count: string }>(
    `select count(*)::text as count from pg_policies where schemaname = 'public'`
  );
  check(
    Number(policyCount.rows[0]?.count || 0) >= 30,
    `public policies created (${policyCount.rows[0]?.count || 0})`
  );

  const buckets = await db.query<{ id: string }>(
    `select id from storage.buckets order by id`
  );
  check(
    buckets.rows.map((row) => row.id).join(',') === 'avatars,private,public-assets',
    'storage buckets created'
  );
}

async function testProfiles(db: PGlite): Promise<void> {
  console.log('\n[profiles] auth trigger + RLS + protected fields');

  const profiles = await db.query<{ email: string; role: string }>(
    `select email, role from public.profiles order by email`
  );
  check(profiles.rows.length === 3, 'handle_new_user created 3 profiles');
  check(
    profiles.rows.find((row) => row.email === 'admin@test.local')?.role === 'admin',
    'admin role comes from app_metadata'
  );

  await asPostgres(db);
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
    values (
      '${STUDENT_3}',
      'student3@test.local',
      '{"chinese_name":"学生三"}',
      '{"role":"student"}'
    )
  `);

  await setActor(db, 'authenticated', claimsFor(STUDENT_3, 'student3@test.local', 'student'));
  await expectRows(
    db,
    `select * from public.profiles`,
    1,
    'student sees only their own profile'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await db.query(`update public.profiles set phone = '0123456789' where id = $1`, [
    STUDENT_1,
  ]);
  check(true, 'student can update their own phone');

  await expectError(
    () =>
      db.query(`update public.profiles set role = 'admin' where id = $1`, [
        STUDENT_1,
      ]),
    'student cannot promote themselves',
    /protected fields/
  );

  const otherProfile = await db.query(
    `update public.profiles set phone = '000' where id = $1 returning id`,
    [STUDENT_2]
  );
  check(
    otherProfile.rows.length === 0,
    'student cannot update another profile'
  );

  await setActor(db, 'authenticated', claimsFor(ADMIN, 'admin@test.local', 'admin'));
  const adminUpdate = await db.query(
    `update public.profiles set notes = 'admin note' where id = $1 returning id`,
    [STUDENT_2]
  );
  check(adminUpdate.rows.length === 1, 'admin can update another profile');
}

async function testNoticeRls(db: PGlite): Promise<void> {
  console.log('\n[notices] public / internal / draft visibility');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from public.notices`,
    1,
    'anon sees only published public notices'
  );
  await expectRows(
    db,
    `select id from public.notice_images where notice_id = $1`,
    1,
    'anon can read images of a public notice',
    [NOTICE_PUBLIC]
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await expectRows(
    db,
    `select id from public.notices`,
    2,
    'student sees published public + internal notices'
  );

  await setActor(db, 'authenticated', claimsFor(ADMIN, 'admin@test.local', 'admin'));
  await expectRows(db, `select id from public.notices`, 3, 'admin sees all notices');
}

async function testActivityRls(db: PGlite): Promise<void> {
  console.log('\n[activities] visibility + signup counter');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from public.activities`,
    1,
    'anon sees only published public activities'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await expectRows(
    db,
    `select id from public.activities`,
    2,
    'student sees public + internal activities'
  );

  await asPostgres(db);
  await db.exec(`
    insert into public.signups (activity_id, user_id, full_name, email, status)
    values ('${ACTIVITY_PUBLIC}', '${STUDENT_2}', '学生二', 'student2@test.local', 'pending')
  `);

  let count = await db.query<{ signup_count: number }>(
    `select signup_count from public.activities where id = $1`,
    [ACTIVITY_PUBLIC]
  );
  check(
    Number(count.rows[0]?.signup_count) === 2,
    'signup counter increments on insert'
  );

  await db.query(`update public.signups set status = 'cancelled' where email = $1`, [
    'student2@test.local',
  ]);
  count = await db.query<{ signup_count: number }>(
    `select signup_count from public.activities where id = $1`,
    [ACTIVITY_PUBLIC]
  );
  check(
    Number(count.rows[0]?.signup_count) === 1,
    'signup counter excludes cancelled signups'
  );
}

async function testProjectRls(db: PGlite): Promise<void> {
  console.log('\n[projects] approved-only public read + leader rules');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from public.projects`,
    1,
    'anon sees only approved projects'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await expectRows(
    db,
    `select id from public.projects`,
    2,
    'leader sees their own pending project'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_2, 'student2@test.local', 'student'));
  await expectRows(
    db,
    `select id from public.projects`,
    1,
    'other student sees only approved projects'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await db.query(`update public.projects set title = '改名后的项目' where id = $1`, [
    PROJECT_PENDING,
  ]);
  check(true, 'leader can edit a pending project');

  await expectError(
    () =>
      db.query(`update public.projects set status = 'approved' where id = $1`, [
        PROJECT_PENDING,
      ]),
    'leader cannot approve their own project',
    /protected fields/
  );

  await setActor(db, 'authenticated', claimsFor(ADMIN, 'admin@test.local', 'admin'));
  await db.query(`update public.projects set status = 'approved' where id = $1`, [
    PROJECT_PENDING,
  ]);
  check(true, 'admin can approve a project');
}

async function testSignupRls(db: PGlite): Promise<void> {
  console.log('\n[signups] student cancel-only update');

  await asPostgres(db);
  await db.exec(`
    insert into public.signups (activity_id, user_id, full_name, email, phone, status)
    values ('${ACTIVITY_INTERNAL}', '${STUDENT_2}', '学生二', 'student2@test.local', '0123', 'pending')
  `);

  await setActor(db, 'authenticated', claimsFor(STUDENT_2, 'student2@test.local', 'student'));
  await db.query(
    `update public.signups set status = 'cancelled'
     where activity_id = $1 and email = $2`,
    [ACTIVITY_INTERNAL, 'student2@test.local']
  );
  check(true, 'student can cancel their own signup');

  await asPostgres(db);
  await db.exec(`
    insert into public.signups (activity_id, user_id, full_name, email, status)
    values ('${ACTIVITY_INTERNAL}', '${STUDENT_1}', '学生一', 'student1@test.local', 'pending')
  `);

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await expectError(
    () =>
      db.query(
        `update public.signups set email = 'hacked@test.local'
         where activity_id = $1 and email = $2`,
        [ACTIVITY_INTERNAL, 'student1@test.local']
      ),
    'student cannot change signup identity fields',
    /protected fields/
  );

  await expectError(
    () =>
      db.query(
        `update public.signups set status = 'confirmed'
         where activity_id = $1 and email = $2`,
        [ACTIVITY_INTERNAL, 'student1@test.local']
      ),
    'student cannot confirm their own signup',
    /cancel a signup/
  );

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from public.signups`,
    0,
    'anon cannot read signups'
  );
}

async function testCommentRls(db: PGlite): Promise<void> {
  console.log('\n[comments] approved-only public read + protected fields');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from public.comments`,
    1,
    'anon sees only approved comments'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  const ownComment = await db.query(
    `update public.comments set content = '学生修改后的内容'
     where nickname = '小明' returning id`
  );
  check(
    ownComment.rows.length === 0,
    'students cannot edit comments directly (admin/moderator only)'
  );

  const approve = await db.query(
    `update public.comments set status = 'approved' where nickname = '小红' returning id`
  );
  check(approve.rows.length === 0, 'student cannot approve a comment');

  await setActor(db, 'authenticated', claimsFor(ADMIN, 'admin@test.local', 'admin'));
  await expectRows(
    db,
    `select id from public.comments`,
    2,
    'admin sees pending comments'
  );

  const approved = await db.query(
    `update public.comments set status = 'approved', reply = '谢谢反馈', reply_author_name = '管理员'
     where nickname = '小红' returning id`
  );
  check(approved.rows.length === 1, 'admin can approve and reply to a comment');
}

async function testAttendance(db: PGlite): Promise<void> {
  console.log('\n[attendance] RPC + safe view');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from public.attendance_sessions`,
    0,
    'anon cannot read attendance sessions (code is admin-only)'
  );
  await expectRows(
    db,
    `select id from public.public_attendance_sessions`,
    2,
    'anon can read the safe attendance view'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  const first = await db.query<{ result: Row }>(
    `select public.student_check_in('ABCD12') as result`
  );
  const firstResult = first.rows[0]?.result as Row | undefined;
  check(firstResult?.success === true, 'student check-in succeeds');
  check(firstResult?.status === 'present', 'on-time check-in is present');

  const again = await db.query<{ result: Row }>(
    `select public.student_check_in('ABCD12') as result`
  );
  check(
    (again.rows[0]?.result as Row | undefined)?.already_checked_in === true,
    'second check-in is idempotent'
  );

  await setActor(db, 'authenticated', claimsFor(STUDENT_2, 'student2@test.local', 'student'));
  const late = await db.query<{ result: Row }>(
    `select public.student_check_in('LATE01') as result`
  );
  check(
    (late.rows[0]?.result as Row | undefined)?.status === 'late',
    'late check-in is marked late'
  );

  const invalid = await db.query<{ result: Row }>(
    `select public.student_check_in('WRONG1') as result`
  );
  const invalidResult = invalid.rows[0]?.result as Row | undefined;
  check(invalidResult?.success === false, 'invalid check-in code is rejected');

  await asPostgres(db);
  const records = await db.query<{ count: string }>(
    `select count(*)::text as count from public.attendance_records`
  );
  check(
    Number(records.rows[0]?.count) === 2,
    'two attendance records were written'
  );

  await setActor(db, 'anon');
  const status = await db.query<{ result: Row }>(
    `select public.get_attendance_status() as result`
  );
  const statusResult = status.rows[0]?.result as Row | undefined;
  check(statusResult?.is_open === true, 'get_attendance_status reports an open session');
  check(
    !JSON.stringify(statusResult).includes('checkin_code'),
    'get_attendance_status never returns the code'
  );
}

async function testStorage(db: PGlite): Promise<void> {
  console.log('\n[storage] bucket write policies');

  await setActor(db, 'authenticated', claimsFor(STUDENT_1, 'student1@test.local', 'student'));
  await db.query(
    `insert into storage.objects (bucket_id, name, owner) values ('avatars', $1, $2)`,
    [`${STUDENT_1}/avatar.webp`, STUDENT_1]
  );
  check(true, 'student can upload an avatar into their own folder');

  await expectError(
    () =>
      db.query(
        `insert into storage.objects (bucket_id, name, owner) values ('avatars', $1, $2)`,
        [`${STUDENT_2}/intrude.webp`, STUDENT_1]
      ),
    'student cannot upload into another user folder'
  );

  await expectError(
    () =>
      db.query(
        `insert into storage.objects (bucket_id, name, owner) values ('public-assets', 'notice/a.webp', $1)`,
        [STUDENT_1]
      ),
    'student cannot upload public assets'
  );

  await setActor(db, 'authenticated', claimsFor(ADMIN, 'admin@test.local', 'admin'));
  await db.query(
    `insert into storage.objects (bucket_id, name, owner) values ('public-assets', 'notice/a.webp', $1)`,
    [ADMIN]
  );
  check(true, 'admin can upload public assets');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select id from storage.objects where bucket_id = 'public-assets'`,
    1,
    'anon can read public assets'
  );
}

async function testServiceRoleBypass(db: PGlite): Promise<void> {
  console.log('\n[service_role] migration access');

  await setActor(db, 'service_role', {
    sub: null,
    role: 'service_role',
    app_metadata: {},
  });
  await expectRows(
    db,
    `select new_uuid from public.migration_id_map`,
    0,
    'service_role can read migration_id_map'
  );
  await db.query(
    `insert into public.migration_id_map (appwrite_collection, appwrite_id, new_uuid)
     values ('users', 'legacy-1', gen_random_uuid())`
  );
  check(true, 'service_role can write migration_id_map');

  await setActor(db, 'anon');
  await expectRows(
    db,
    `select new_uuid from public.migration_id_map`,
    0,
    'anon cannot read migration_id_map'
  );
}

async function main(): Promise<void> {
  const db = new PGlite({
    extensions: { pg_trgm, pgcrypto },
  } as ConstructorParameters<typeof PGlite>[0]);

  console.log('KC Computer Club — Supabase migration verifier');
  console.log(`  migrations: ${MIGRATIONS_DIR}`);

  await bootstrapSupabaseStubs(db);
  console.log('  Supabase stubs ready (auth, storage, roles)');

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await db.exec(sql);
      console.log(`  applied ${file}`);
    } catch (error) {
      console.error(`\n  FAILED ${file}`);
      throw error;
    }
  }

  await grantSupabaseDefaults(db);
  await seedFixtures(db);

  await testSchema(db);
  await testProfiles(db);
  await testNoticeRls(db);
  await testActivityRls(db);
  await testProjectRls(db);
  await testSignupRls(db);
  await testCommentRls(db);
  await testAttendance(db);
  await testStorage(db);
  await testServiceRoleBypass(db);

  await db.close();

  console.log(`\n${passed} check(s) passed, ${failures.length} failed`);

  if (failures.length > 0) {
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('All migrations and security checks passed.');
}

main().catch((error) => {
  console.error('\nVerifier crashed:', error);
  process.exit(1);
});
