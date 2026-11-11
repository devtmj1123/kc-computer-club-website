const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase 未配置：缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

export function getSupabaseServiceRoleKey(): string {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase 未配置：缺少 SUPABASE_SERVICE_ROLE_KEY');
  }

  return SUPABASE_SERVICE_ROLE_KEY;
}
