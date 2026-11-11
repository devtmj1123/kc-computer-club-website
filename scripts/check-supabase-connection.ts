/**
 * Verifies that the configured Supabase project is reachable and that the
 * migrations from supabase/migrations have been applied.
 *
 * Required env (in .env.local or the environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   (sb_publishable_... or legacy anon key)
 *   SUPABASE_SERVICE_ROLE_KEY       (sb_secret_... or legacy service_role key)
 *
 * Usage: npm run db:check
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const TABLES = [
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
  'club_settings',
  'audit_logs',
] as const;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`缺少环境变量：${name}`);
    process.exit(1);
  }
  return value;
}

function isPlaceholder(value: string): boolean {
  return /^(sb_publishable_|sb_secret_)?$/.test(value) || value.startsWith('<');
}

const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/+$/, '');
const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL 格式不正确：${url}`);
  console.error('应为 https://<project-ref>.supabase.co');
  process.exit(1);
}

for (const [name, value] of [
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
] as const) {
  if (isPlaceholder(value) || value.length < 20) {
    console.error(`${name} 看起来不完整（length=${value.length}）。请粘贴完整 key。`);
    process.exit(1);
  }
}

if (anonKey === serviceKey) {
  console.error('anon/publishable key 与 service role/secret key 不能相同。');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function main(): Promise<void> {
  console.log('KC Computer Club — Supabase connection check');
  console.log(`  url: ${url}`);
  console.log(`  anon key: ${anonKey.slice(0, 16)}… (length=${anonKey.length})`);
  console.log(`  service key: ${serviceKey.slice(0, 13)}… (length=${serviceKey.length})`);

  let failures = 0;

  for (const table of TABLES) {
    const { count, error } = await admin
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      failures += 1;
      console.error(`  FAIL  ${table}: ${error.message}`);
    } else {
      console.log(`  ok    ${table}: ${count ?? 0} row(s)`);
    }
  }

  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  if (bucketError) {
    failures += 1;
    console.error(`  FAIL  storage buckets: ${bucketError.message}`);
  } else {
    const names = (buckets ?? []).map((bucket) => bucket.name);
    for (const required of ['public-assets', 'avatars', 'private']) {
      if (names.includes(required)) {
        console.log(`  ok    bucket ${required}`);
      } else {
        failures += 1;
        console.error(`  FAIL  bucket ${required} missing`);
      }
    }
  }

  const { data: users, error: userError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (userError) {
    failures += 1;
    console.error(`  FAIL  auth admin API: ${userError.message}`);
  } else {
    console.log(`  ok    auth admin API (${users.users.length ? 'users found' : 'no users yet'})`);
  }

  if (failures > 0) {
    console.error(`\n${failures} 项检查失败。请确认 0001–0004 migration 已全部执行。`);
    process.exitCode = 1;
    return;
  }

  console.log('\n全部检查通过。可以运行 npm run bootstrap:supabase 创建首个管理员。');
}

main().catch((error) => {
  console.error('\n连接检查失败：', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
