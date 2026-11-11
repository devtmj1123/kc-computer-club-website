/**
 * Live Supabase smoke test after migrations + admin bootstrap.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   BOOTSTRAP_ADMIN_USERNAME (or SMOKE_ADMIN_USERNAME)
 *   BOOTSTRAP_ADMIN_PASSWORD (or SMOKE_ADMIN_PASSWORD)
 *
 * Usage: npm run db:smoke
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { adminEmailForUsername } from '../src/lib/admin-email';

dotenv.config({ path: '.env.local' });
dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`缺少环境变量：${name}`);
    process.exit(1);
  }
  return value;
}

const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/+$/, '');
const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const username =
  process.env.SMOKE_ADMIN_USERNAME?.trim() ||
  requiredEnv('BOOTSTRAP_ADMIN_USERNAME');
const password =
  process.env.SMOKE_ADMIN_PASSWORD ||
  requiredEnv('BOOTSTRAP_ADMIN_PASSWORD');
const adminEmail = adminEmailForUsername(username);

let failures = 0;

function check(condition: unknown, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
    return;
  }
  failures += 1;
  console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main(): Promise<void> {
  console.log('KC Computer Club — Supabase live smoke test');
  console.log(`  url: ${url}`);
  console.log(`  admin: ${username} (${adminEmail})`);

  // Anonymous client: public reads must work, private reads must be blocked.
  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data: settings, error: settingsError } = await anon
    .from('club_settings')
    .select('id, club_name')
    .eq('id', 1)
    .maybeSingle();
  check(!settingsError && settings?.club_name, 'anon can read club_settings', settingsError?.message);

  const { data: publicNotices, error: noticesError } = await anon
    .from('notices')
    .select('id')
    .eq('status', 'published')
    .limit(1);
  check(!noticesError, 'anon can query published notices', noticesError?.message);
  check((publicNotices ?? []).length === 0, 'anon only sees published notices (none yet)');

  const { data: leakedProfiles, error: profilesError } = await anon
    .from('profiles')
    .select('id, email')
    .limit(1);
  check(!profilesError, 'anon profile query does not error', profilesError?.message);
  check((leakedProfiles ?? []).length === 0, 'anon cannot read profiles (RLS)');

  const { error: anonWriteError } = await anon.from('notices').insert({
    title: 'anon should not write',
    content: 'blocked by RLS',
    category: 'test',
    author_name: 'anon',
    status: 'draft',
  });
  check(Boolean(anonWriteError), 'anon cannot insert notices (RLS)');

  // Admin login through Supabase Auth.
  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  check(!authError && Boolean(authData.user), 'admin can sign in with password', authError?.message);

  if (!authData.user) {
    console.error('\n登录失败，后续检查已跳过。');
    process.exitCode = 1;
    return;
  }

  check(authData.user.app_metadata?.role === 'admin', 'JWT app_metadata.role = admin');

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('id, email, role, is_active, permissions')
    .eq('id', authData.user.id)
    .maybeSingle();
  check(
    !profileError && profile?.role === 'admin' && profile?.is_active === true,
    'admin can read own active profile',
    profileError?.message
  );

  const { data: notice, error: createError } = await userClient
    .from('notices')
    .insert({
      title: 'RLS smoke test',
      content: 'This row is created and removed by scripts/smoke-supabase.ts.',
      category: 'test',
      author_name: username,
      status: 'draft',
    })
    .select('id')
    .single();
  check(!createError && Boolean(notice?.id), 'admin can insert a draft notice', createError?.message);

  if (notice?.id) {
    const { error: deleteError } = await userClient.from('notices').delete().eq('id', notice.id);
    check(!deleteError, 'admin can delete the test notice', deleteError?.message);
  }

  await userClient.auth.signOut();

  if (failures > 0) {
    console.error(`\n${failures} 项检查失败。`);
    process.exitCode = 1;
    return;
  }

  console.log('\n全部实时检查通过。');
}

main().catch((error) => {
  console.error('\nSmoke test 失败：', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
