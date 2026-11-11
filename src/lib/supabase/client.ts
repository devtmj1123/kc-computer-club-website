'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './env';

let browserClient: SupabaseClient | null = null;

/**
 * Browser client for realtime subscriptions and client-side auth actions.
 * Business data should normally be read/written through server routes so the
 * service role key never reaches the browser.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabaseConfig();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
