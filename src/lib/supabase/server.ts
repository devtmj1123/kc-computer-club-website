import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './env';

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * route handlers. It uses the anon key plus the caller's auth cookies, so RLS
 * applies exactly as it would for the browser.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session instead; this catch keeps render-time reads safe.
        }
      },
    },
  });
}
