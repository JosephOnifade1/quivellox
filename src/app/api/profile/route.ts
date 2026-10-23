import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuthContext } from '@/server/authorization/authorization-service';

export async function GET(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const supabase = (await createServerSupabaseClient()) || createAdminClient();

  let profileData: {
    display_name?: string;
    avatar_url?: string | null;
    theme_preference?: string;
  } | null = null;

  let workspaceName = 'Personal Knowledge';

  if (supabase) {
    // 1. Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, theme_preference')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      profileData = profile;
    }

    // 2. Fetch workspace name
    const { data: ws } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', ctx.workspaceId)
      .maybeSingle();

    if (ws?.name) {
      workspaceName = ws.name;
    }
  }

  // Fallback to user metadata
  const userMetadata = (user as any).user_metadata || {};
  const displayName =
    profileData?.display_name ||
    userMetadata.full_name ||
    userMetadata.display_name ||
    user.email?.split('@')[0] ||
    'Researcher';

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName,
    avatarUrl: profileData?.avatar_url || null,
    themePreference: profileData?.theme_preference || 'dark',
    workspaceId: ctx.workspaceId,
    workspaceName,
    isOwner: ctx.isOwner,
    role: ctx.isOwner ? 'Workspace Owner' : 'Workspace Member',
    createdAt: (user as any).created_at || new Date().toISOString(),
  });
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { displayName, password, themePreference } = body;

    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();
    const clientToUse = supabase || admin;

    // 1. Update display name & metadata in Supabase Auth if provided
    if (displayName && supabase) {
      await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          display_name: displayName.trim(),
        },
      });
    }

    // 2. Update password if requested
    if (password && password.trim().length >= 8 && supabase) {
      const { error: pwError } = await supabase.auth.updateUser({
        password: password.trim(),
      });
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 400 });
      }
    }

    // 3. Upsert into public.profiles
    if (clientToUse && displayName) {
      await clientToUse.from('profiles').upsert({
        id: user.id,
        display_name: displayName.trim(),
        theme_preference: themePreference || 'dark',
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      displayName: displayName?.trim(),
      themePreference: themePreference || 'dark',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
