import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ActivityEventType } from '@/types';

async function getDbClient() {
  const ssr = await createServerSupabaseClient();
  if (ssr) return ssr;
  return createAdminClient();
}

export interface ActivityRow {
  id: string;
  workspace_id: string;
  actor_id: string;
  event_type: ActivityEventType;
  resource_type: 'document' | 'conversation' | 'workspace';
  resource_id?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UIActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  workspace_id?: string;
  actor_id?: string;
  resource_type?: string;
  resource_id?: string | null;
  metadata?: Record<string, any>;
}

export function formatEventDescription(
  eventType: string,
  metadata?: Record<string, any>
): string {
  const filename = metadata?.filename || 'document';
  const query = metadata?.question || metadata?.query;

  switch (eventType) {
    case 'document.uploaded':
      return `Uploaded ${filename} to private vault`;
    case 'document.indexing_started':
      return `Started vector indexing for ${filename}`;
    case 'document.extraction_started':
      return `Started text extraction for ${filename}`;
    case 'document.chunking_started':
      return `Chunking passages for ${filename}`;
    case 'document.ready': {
      const chunks = metadata?.chunk_count || metadata?.chunks || 0;
      const pages = metadata?.page_count || metadata?.pages || 1;
      return `Indexed ${filename} (${chunks} passages, ${pages} pages)`;
    }
    case 'document.failed':
      return `Indexing failed for ${filename}: ${metadata?.error || 'Processing error'}`;
    case 'document.deleted':
      return `Removed ${filename} from knowledge library`;
    case 'conversation.created':
      return `Started research session: "${metadata?.title || 'New Session'}"`;
    case 'query.executed':
      return `Grounded query executed: "${query ? (query.length > 50 ? query.slice(0, 50) + '…' : query) : 'evidence search'}"`;
    case 'workspace.updated': {
      const fields = (metadata?.updated_fields as string[]) || [];
      return `Workspace configuration updated${fields.length > 0 ? `: ${fields.join(', ')}` : ''}`;
    }
    default:
      return metadata?.description || `${eventType} executed`;
  }
}

export async function recordActivityEvent(options: {
  workspaceId: string;
  actorId: string;
  eventType: ActivityEventType;
  resourceType: 'document' | 'conversation' | 'workspace';
  resourceId?: string | null;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const serverClient = await createServerSupabaseClient();
    const db = admin || serverClient;

    if (!db) return false;

    const row = {
      id: crypto.randomUUID(),
      workspace_id: options.workspaceId,
      actor_id: options.actorId,
      event_type: options.eventType,
      resource_type: options.resourceType,
      resource_id: options.resourceId || null,
      metadata: options.metadata || {},
      created_at: new Date().toISOString(),
    };

    const { error } = await db.from('activity_events').insert(row);
    if (error) {
      console.warn('[ActivityRepo] Insert warning:', error.message);
      return false;
    }

    return true;
  } catch (err: unknown) {
    console.warn('[ActivityRepo] recordActivityEvent exception:', err);
    return false;
  }
}

export async function listActivityEventsByWorkspace(
  workspaceId: string,
  limit = 50
): Promise<UIActivityItem[]> {
  const db = await getDbClient();
  if (!db) return [];

  const { data, error } = await db
    .from('activity_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ActivityRepo] listActivityEvents error:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    type: row.event_type,
    description: formatEventDescription(row.event_type, row.metadata),
    timestamp: row.created_at,
    workspace_id: row.workspace_id,
    actor_id: row.actor_id,
    resource_type: row.resource_type,
    resource_id: row.resource_id,
    metadata: row.metadata || {},
  }));
}
