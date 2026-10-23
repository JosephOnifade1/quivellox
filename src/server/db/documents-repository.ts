import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Document, DocumentChunk, DocumentStatus } from '@/types';

/**
 * Returns a Supabase client capable of querying the database.
 * Prefers the request-scoped SSR client (which carries the user session and respects RLS),
 * falling back to admin client if needed.
 */
async function getDbClient() {
  const ssr = await createServerSupabaseClient();
  if (ssr) return ssr;
  return createAdminClient();
}

export async function insertDocumentRecord(doc: Document): Promise<Document | null> {
  const db = await getDbClient();
  if (!db) return null;

  const row = {
    id: doc.id,
    workspace_id: doc.workspace_id,
    uploaded_by: doc.uploaded_by,
    original_filename: doc.original_filename,
    storage_path: doc.storage_path,
    mime_type: doc.mime_type,
    file_size_bytes: doc.file_size_bytes,
    checksum: doc.checksum || null,
    status: doc.status,
    page_count: doc.page_count || 1,
    chunk_count: doc.chunk_count || 0,
    processing_error: doc.processing_error || null,
    document_index: doc.document_index || null,
    dify_document_id: doc.dify_document_id || null,
    dify_batch_id: doc.dify_batch_id || null,
    created_at: doc.created_at || new Date().toISOString(),
    updated_at: doc.updated_at || new Date().toISOString(),
  };

  const { data, error } = await db
    .from('documents')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[DocumentsRepo] insertDocumentRecord error:', error.message);
    throw new Error(`Database error inserting document: ${error.message}`);
  }

  return data as Document;
}

export async function listDocumentsByWorkspace(
  workspaceId: string,
  searchQuery?: string
): Promise<Document[]> {
  const db = await getDbClient();
  if (!db) return [];

  let query = db
    .from('documents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = `%${searchQuery.trim()}%`;
    query = query.or(`original_filename.ilike.${term},document_index.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[DocumentsRepo] listDocumentsByWorkspace error:', error.message);
    return [];
  }

  return (data || []) as Document[];
}

export async function getDocumentById(
  documentId: string,
  workspaceId: string
): Promise<Document | null> {
  const db = await getDbClient();
  if (!db) return null;

  const { data, error } = await db
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) {
    console.error('[DocumentsRepo] getDocumentById error:', error.message);
    return null;
  }

  return data as Document | null;
}

export async function updateDocumentStatus(
  documentId: string,
  workspaceId: string,
  updates: {
    status?: DocumentStatus;
    chunk_count?: number;
    processing_error?: string | null;
    dify_document_id?: string | null;
    dify_batch_id?: string | null;
  }
): Promise<boolean> {
  const db = await getDbClient();
  if (!db) return false;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.chunk_count !== undefined) payload.chunk_count = updates.chunk_count;
  if (updates.processing_error !== undefined) payload.processing_error = updates.processing_error;
  if (updates.dify_document_id !== undefined) payload.dify_document_id = updates.dify_document_id;
  if (updates.dify_batch_id !== undefined) payload.dify_batch_id = updates.dify_batch_id;

  const { error } = await db
    .from('documents')
    .update(payload)
    .eq('id', documentId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[DocumentsRepo] updateDocumentStatus error:', error.message);
    return false;
  }

  return true;
}

export async function deleteDocumentRecord(
  documentId: string,
  workspaceId: string
): Promise<boolean> {
  const db = await getDbClient();
  if (!db) return false;

  const { error } = await db
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[DocumentsRepo] deleteDocumentRecord error:', error.message);
    return false;
  }

  return true;
}

export async function getDocumentChunksByDocId(
  documentId: string,
  workspaceId: string
): Promise<DocumentChunk[]> {
  const db = await getDbClient();
  if (!db) return [];

  const { data, error } = await db
    .from('document_chunks')
    .select('id, document_id, workspace_id, chunk_index, content, page_number, section_title, token_count, created_at')
    .eq('document_id', documentId)
    .eq('workspace_id', workspaceId)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error('[DocumentsRepo] getDocumentChunksByDocId error:', error.message);
    return [];
  }

  return (data || []) as DocumentChunk[];
}
