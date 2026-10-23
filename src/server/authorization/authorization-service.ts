import { getStore } from '@/lib/rag-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AuthContext {
  userId: string;
  workspaceId: string;
  isOwner: boolean;
}

/**
 * Verifies that the user has explicit access to the requested workspace
 */
export async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  if (!userId || !workspaceId) return false;

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .single();

    if (error || !data) return false;
    if (data.owner_id === userId) return true;

    // Check membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    return !!member;
  }

  // Fallback to store for local development / test mode
  return true;
}

/**
 * Verifies document ownership within an authorized workspace
 */
export async function verifyDocumentAccess(
  userId: string,
  documentId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('documents')
      .select('id, workspace_id')
      .eq('id', documentId)
      .single();

    if (error || !data) return false;
    return verifyWorkspaceAccess(userId, data.workspace_id);
  }

  const store = getStore();
  const doc = store.documents.find((d) => d.id === documentId);
  return !!doc;
}

/**
 * Verifies conversation ownership
 */
export async function verifyConversationAccess(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, user_id, workspace_id')
      .eq('id', conversationId)
      .single();

    if (error || !data) return false;
    if (data.user_id !== userId) return false;
    return verifyWorkspaceAccess(userId, data.workspace_id);
  }

  const store = getStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  return !!conv;
}
