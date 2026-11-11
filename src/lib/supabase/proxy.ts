import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from './env';

/**
 * Refreshes the Supabase auth cookies on navigation.
 *
 * This is NOT an authorization boundary: every route handler / server action
 * must still call getUser()/getSession() and enforce its own checks. The proxy
 * only keeps short-lived access tokens fresh.
 */
export async function refreshSupabaseSession(
  request: NextRequest
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the user endpoint so an expired access token is refreshed and the
  // updated cookies are written to the response.
  await supabase.auth.getUser();

  return response;
}
