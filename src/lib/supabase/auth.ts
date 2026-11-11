import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { getSupabaseConfig } from './env';

/**
 * A short-lived anon client used only to verify a password. Supabase Auth
 * creates a refresh session for a successful sign-in, so we sign out again
 * immediately: the app keeps using its own HMAC session cookie for now.
 */
export function createSupabasePasswordClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Returns the Auth user when the password is correct, otherwise null.
 * Unknown emails and wrong passwords deliberately produce the same result.
 */
export async function verifySupabasePassword(
  email: string,
  password: string
): Promise<User | null> {
  const client = createSupabasePasswordClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) return null;

  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // Revoking the throwaway session must not fail a valid login.
  }

  return data.user;
}
