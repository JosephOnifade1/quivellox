import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/signout
 *
 * Server-side session termination. Invalidates the Supabase session and
 * clears the auth cookie. Always redirect after signout — never return
 * session data from this endpoint.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    // Sign out the current session on the Supabase Auth server
    await supabase.auth.signOut();
  }

  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('application/json')) {
    return NextResponse.json({ ok: true, redirectTo: '/login' });
  }

  // Redirect to login; the cookie will be cleared by Supabase SSR
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return NextResponse.redirect(new URL('/login', siteUrl), {
    status: 302,
  });
}
