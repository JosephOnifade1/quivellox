import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Creates a server-side Supabase client that reads/writes the auth session
 * from the Next.js cookie store. Returns null if Supabase is not configured.
 *
 * Use this for Route Handlers and Server Actions where you need database access.
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware handles refresh.
        }
      },
    },
  });
}

/**
 * Retrieves the authenticated user from the current session.
 *
 * Returns the user object if a valid session exists.
 * Returns null if Supabase is unconfigured or there is no valid session.
 *
 * IMPORTANT: Always use this (not getSession()) in server code.
 * getUser() re-validates the JWT with the Supabase Auth server; getSession()
 * only reads the local cookie and can be spoofed.
 */
export async function getAuthenticatedUser(): Promise<{
  id: string;
  email?: string;
} | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Convenience helper for Route Handlers: returns the authenticated user or
 * a 401 NextResponse. Use with early-return pattern:
 *
 *   const { user, errorResponse } = await requireAuth();
 *   if (errorResponse) return errorResponse;
 */
export async function requireAuth(): Promise<
  | { user: { id: string; email?: string }; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}
