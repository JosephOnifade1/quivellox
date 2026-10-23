import { updateSessionAndGetUser } from '@/lib/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware — runs on every matched request.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie so it never expires mid-browse.
 * 2. Redirect unauthenticated visitors away from /app/* to /login.
 * 3. Redirect already-authenticated visitors away from /login and /signup to /app.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { response, user } = await updateSessionAndGetUser(request);

  const isAppRoute = pathname.startsWith('/app');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  // Unauthenticated user trying to reach a protected route
  if (isAppRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting login/signup — send to app
  if (isAuthRoute && user) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = '/app';
    appUrl.search = '';
    return NextResponse.redirect(appUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /api/health   (public health-check — no auth required)
     * - Root /        (landing page — public)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/health|$).*)',
  ],
};
