import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a human-readable diagnostic string describing which Supabase
 * environment variable(s) are missing, or null if everything is present.
 * Used by auth forms to show a precise error instead of a generic message.
 */
export function getSupabaseConfigError(): string | null {
  const missingUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL;
  const missingKey = !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (missingUrl && missingKey) {
    return 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Add them in your Vercel project → Settings → Environment Variables, then redeploy.';
  }
  if (missingUrl) {
    return 'NEXT_PUBLIC_SUPABASE_URL is not set. Add it in your Vercel project → Settings → Environment Variables, then redeploy.';
  }
  if (missingKey) {
    return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it in your Vercel project → Settings → Environment Variables, then redeploy.';
  }
  return null;
}

export function createClient() {
  const configError = getSupabaseConfigError();
  if (configError) return null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
