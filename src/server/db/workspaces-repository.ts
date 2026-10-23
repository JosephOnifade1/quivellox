import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Workspace } from '@/types';

async function getDbClient() {
  const ssr = await createServerSupabaseClient();
  if (ssr) return ssr;
  return createAdminClient();
}

export async function getWorkspaceById(
  workspaceId: string
): Promise<Workspace | null> {
  const db = await getDbClient();
  if (!db) return null;

  const query = db
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId);

  const { data, error } =
    typeof (query as any).maybeSingle === 'function'
      ? await (query as any).maybeSingle()
      : await (query as any).single();

  if (error || !data) {
    return null;
  }

  return data as Workspace;
}

export async function updateWorkspaceRecord(
  workspaceId: string,
  updates: {
    name?: string;
    dify_dataset_id?: string | null;
  }
): Promise<Workspace | null> {
  const db = await getDbClient();
  if (!db) return null;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    patch.name = updates.name.trim();
  }
  if (updates.dify_dataset_id !== undefined) {
    patch.dify_dataset_id = updates.dify_dataset_id ? updates.dify_dataset_id.trim() : null;
  }

  const query = db
    .from('workspaces')
    .update(patch)
    .eq('id', workspaceId)
    .select();

  const { data, error } =
    typeof (query as any).maybeSingle === 'function'
      ? await (query as any).maybeSingle()
      : await (query as any).single();

  if (error || !data) {
    console.error('[WorkspacesRepo] update error:', error?.message);
    throw new Error(`Failed to update workspace: ${error?.message || 'unknown error'}`);
  }

  return data as Workspace;
}

export async function getWorkspaceMemberCount(
  workspaceId: string
): Promise<number> {
  const db = await getDbClient();
  if (!db) return 1;

  const { count, error } = await db
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  if (error || count === null || count === undefined) {
    return 1;
  }

  return Math.max(1, count);
}
