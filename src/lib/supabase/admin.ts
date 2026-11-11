import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, getSupabaseServiceRoleKey } from './env';

let adminClient: SupabaseClient | null = null;

/**
 * Service-role client. It bypasses RLS, so it may only be imported by server
 * code (route handlers, server actions, migration scripts). Never pass this
 * client or its key to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase service role client must not run in the browser');
  }

  if (adminClient) return adminClient;

  const { url } = getSupabaseConfig();
  adminClient = createClient(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}
