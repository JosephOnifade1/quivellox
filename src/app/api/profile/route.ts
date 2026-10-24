import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuthContext } from '@/server/authorization/authorization-service';

export async function GET(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const admin = createAdminClient();
  const supabase = await createServerSupabaseClient();
  const clientToUse = admin || supabase;

  let profileData: {
    display_name?: string;
    avatar_url?: string | null;
    theme_preference?: string;
  } | null = null;

  let workspaceName = 'Personal Knowledge';

  if (clientToUse) {
    // 1. Fetch profile
    const { data: profile } = await clientToUse
      .from('profiles')
      .select('display_name, avatar_url, theme_preference')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      profileData = profile;
    }

    // 2. Fetch workspace name
    const { data: ws } = await clientToUse
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

    const admin = createAdminClient();
    const supabase = await createServerSupabaseClient();
    const clientToUse = admin || supabase;

    const trimmedName = typeof displayName === 'string' ? displayName.trim() : undefined;

    // 1. Update display name & metadata in Supabase Auth if provided
    if (trimmedName) {
      if (admin) {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...((user as any).user_metadata || {}),
            full_name: trimmedName,
            display_name: trimmedName,
          },
        });
      }

      if (supabase) {
        await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            display_name: trimmedName,
          },
        });
      }
    }

    // 2. Update password if requested
    if (password && typeof password === 'string' && password.trim().length >= 8) {
      const trimmedPassword = password.trim();
      let passwordError: string | null = null;

      if (admin) {
        const { error: adminPwError } = await admin.auth.admin.updateUserById(user.id, {
          password: trimmedPassword,
        });
        if (adminPwError) {
          passwordError = adminPwError.message;
        }
      } else if (supabase) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: trimmedPassword,
        });
        if (pwError) {
          passwordError = pwError.message;
        }
      }

      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }
    }

    // 3. Upsert / update public.profiles
    if (clientToUse && trimmedName) {
      const profilePayload = {
        id: user.id,
        display_name: trimmedName,
        theme_preference: themePreference || 'dark',
        updated_at: new Date().toISOString(),
      };

      // Try upsert first (works with admin client or with INSERT policy)
      const { error: upsertError } = await clientToUse.from('profiles').upsert(profilePayload);

      if (upsertError) {
        console.warn('[Profile API] Upsert notice, applying direct update fallback:', upsertError.message);
        // Fall back to direct update (which is permitted by UPDATE policy on profiles)
        const { error: updateError } = await clientToUse
          .from('profiles')
          .update({
            display_name: trimmedName,
            theme_preference: themePreference || 'dark',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('[Profile API] Update fallback error:', updateError.message);
          if (admin && clientToUse !== admin) {
            await admin.from('profiles').upsert(profilePayload);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      displayName: trimmedName,
      themePreference: themePreference || 'dark',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
