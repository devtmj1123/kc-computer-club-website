/**
 * Creates (or updates) the first admin account in a fresh Supabase project.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   BOOTSTRAP_ADMIN_USERNAME
 *   BOOTSTRAP_ADMIN_PASSWORD
 * Optional:
 *   BOOTSTRAP_ADMIN_NAME
 *
 * Usage: npm run bootstrap:supabase
 */

import dotenv from 'dotenv';
import { createClient, type User } from '@supabase/supabase-js';
import { adminEmailForUsername } from '../src/lib/admin-email';

dotenv.config({ path: '.env.local' });
dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`缺少环境变量：${name}`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const username = requiredEnv('BOOTSTRAP_ADMIN_USERNAME').trim();
const password = requiredEnv('BOOTSTRAP_ADMIN_PASSWORD');
const displayName =
  process.env.BOOTSTRAP_ADMIN_NAME?.trim() || username;

if (password.length < 12) {
  console.error('BOOTSTRAP_ADMIN_PASSWORD 至少需要 12 位字符。');
  process.exit(1);
}

const adminEmail = adminEmailForUsername(username);
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function findUserByEmail(email: string): Promise<User | null> {
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw new Error(`listUsers: ${error.message}`);

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) return match;
    if (data.users.length < perPage) break;
  }

  return null;
}

async function main(): Promise<void> {
  console.log('KC Computer Club — Supabase admin bootstrap');
  console.log(`  username: ${username}`);
  console.log(`  email:    ${adminEmail}`);

  const existing = await findUserByEmail(adminEmail);
  let userId: string;

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
        app_metadata: { role: 'admin', username },
        user_metadata: {
          username,
          chinese_name: displayName,
        },
      }
    );

    if (error || !data.user) {
      throw new Error(`更新管理员失败：${error?.message || 'no user'}`);
    }

    userId = data.user.id;
    console.log('  已存在的管理员账号已更新。');
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      app_metadata: { role: 'admin', username },
      user_metadata: {
        username,
        chinese_name: displayName,
      },
    });

    if (error || !data.user) {
      throw new Error(`创建管理员失败：${error?.message || 'no user'}`);
    }

    userId = data.user.id;
    console.log('  已创建新的管理员账号。');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: adminEmail,
      chinese_name: displayName,
      role: 'admin',
      permissions: ['*'],
      is_active: true,
      require_password_change: false,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(`写入 profiles 失败：${profileError.message}`);
  }

  const { error: settingsError } = await supabase.from('club_settings').upsert(
    {
      id: 1,
      club_name: 'KC Computer Club',
      about_title: 'KC Computer Club',
    },
    { onConflict: 'id' }
  );

  if (settingsError) {
    console.warn(`club_settings 默认行写入失败：${settingsError.message}`);
  }

  console.log('\n完成。');
  console.log('  登录地址：/admin/login');
  console.log(`  用户名：${username}`);
  console.log('  初始化完成后，请从 .env.local 删除 BOOTSTRAP_ADMIN_PASSWORD。');
}

main().catch((error) => {
  console.error('\n初始化失败：', error);
  process.exitCode = 1;
});
