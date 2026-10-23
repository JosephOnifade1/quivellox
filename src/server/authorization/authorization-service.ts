import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
  workspaceId: string;
  isOwner: boolean;
}

/**
 * Resolves the workspace that belongs to the authenticated user.
 *
 * Strategy: look up the workspace_members table for the authenticated user.
 * If the user owns multiple workspaces, return the primary one (owned workspace
 * takes precedence; fallback to first membership). This avoids silently assuming
 * the first workspace in an arbitrary list.
 *
 * Returns null if no workspace is found or Supabase is not configured.
 */
export async function resolveUserWorkspace(
  userId: string
): Promise<{ workspaceId: string; isOwner: boolean } | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  // Prefer owned workspaces first
  const { data: owned } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .single();

  if (owned) {
    return { workspaceId: owned.id, isOwner: true };
  }

  // Fall back to membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (member) {
    return { workspaceId: member.workspace_id, isOwner: false };
  }

  return null;
}

/**
 * Derives a full AuthContext from the authenticated user session.
 * Returns null if workspace resolution fails (user has no workspace yet).
 */
export async function getAuthContext(
  userId: string
): Promise<AuthContext | null> {
  const ws = await resolveUserWorkspace(userId);
  if (!ws) return null;
  return { userId, workspaceId: ws.workspaceId, isOwner: ws.isOwner };
}

/**
 * Convenience for Route Handlers: resolves auth context or returns a
 * 403 response.
 *
 *   const { ctx, errorResponse } = await requireAuthContext(userId);
 *   if (errorResponse) return errorResponse;
 */
export async function requireAuthContext(
  userId: string
): Promise<
  | { ctx: AuthContext; errorResponse: null }
  | { ctx: null; errorResponse: NextResponse }
> {
  const ctx = await getAuthContext(userId);
  if (!ctx) {
    return {
      ctx: null,
      errorResponse: NextResponse.json(
        { error: 'No workspace found for this account' },
        { status: 403 }
      ),
    };
  }
  return { ctx, errorResponse: null };
}

/**
 * Verifies that the given user has access to the given workspace.
 * Uses RLS-backed queries — never trusts client-supplied IDs.
 */
export async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  if (!userId || !workspaceId) return false;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data: owned } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (owned) return true;

  const { data: member } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!member;
}

/**
 * Verifies document ownership: checks that the document exists AND belongs
 * to a workspace the authenticated user can access.
 *
 * Never trusts the document ID alone as proof of ownership.
 */
export async function verifyDocumentAccess(
  userId: string,
  documentId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  // RLS will already filter, but we also verify workspace membership explicitly
  const { data, error } = await supabase
    .from('documents')
    .select('id, workspace_id')
    .eq('id', documentId)
    .maybeSingle();

  if (error || !data) return false;
  return verifyWorkspaceAccess(userId, data.workspace_id);
}

/**
 * Verifies conversation ownership: conversation must belong to the user
 * AND to a workspace they can access.
 */
export async function verifyConversationAccess(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_id, workspace_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (error || !data) return false;
  if (data.user_id !== userId) return false;
  return verifyWorkspaceAccess(userId, data.workspace_id);
}
