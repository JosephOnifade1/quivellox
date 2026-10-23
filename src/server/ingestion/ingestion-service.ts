import { validateFile } from '../documents/parser';
import { getRAGProvider } from '../rag/provider-factory';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStore } from '@/lib/rag-store';
import { Document, DocumentStatus } from '@/types';

export interface IngestionOptions {
  workspaceId: string;
  userId: string;
  filename: string;
  fileBuffer: Buffer | ArrayBuffer;
  mimeType?: string;
}

export interface IngestionResult {
  success: boolean;
  documentId?: string;
  chunkCount?: number;
  batchId?: string;
  status?: DocumentStatus;
  error?: string;
}

/**
 * Executes idempotent document ingestion pipeline delegating to the active RAG provider (Dify or Local)
 */
export async function ingestDocument(options: IngestionOptions): Promise<IngestionResult> {
  const { workspaceId, userId, filename, fileBuffer, mimeType } = options;
  const nodeBuffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);

  // 1. Validate file (size, format, mime)
  const validation = validateFile({ name: filename, size: nodeBuffer.length, type: mimeType });
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const docId = `doc-${Date.now()}`;
  const store = getStore();
  const docIndex = `DOC-00${store.documents.length + 1}`;
  const provider = getRAGProvider();

  try {
    // 2. Delegate indexing to active RAG provider
    const ingestResult = await provider.ingestDocument({
      workspaceId,
      documentId: docId,
      filename,
      fileBuffer: nodeBuffer,
      mimeType: mimeType || 'application/octet-stream',
    });

    const initialStatus: DocumentStatus = provider.name === 'dify' ? 'indexing' : 'ready';

    // 3. Construct canonical document record
    const documentRecord: Document = {
      id: docId,
      workspace_id: workspaceId,
      uploaded_by: userId,
      original_filename: filename,
      storage_path: `/vault/docs/${filename}`,
      mime_type: mimeType || 'application/pdf',
      file_size_bytes: nodeBuffer.length,
      checksum: `sha256:${Math.random().toString(16).substring(2, 12)}`,
      status: initialStatus,
      page_count: 1,
      chunk_count: ingestResult.chunkCount || 0,
      document_index: docIndex,
      dify_document_id: ingestResult.externalDocumentId,
      dify_batch_id: ingestResult.batchId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. Persist to Supabase if configured
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from('documents').insert(documentRecord);
      await supabase.from('activity_events').insert({
        workspace_id: workspaceId,
        actor_id: userId,
        event_type: initialStatus === 'ready' ? 'document.ready' : 'document.indexing_started',
        resource_type: 'document',
        resource_id: docId,
        metadata: {
          filename,
          provider: provider.name,
          dify_batch_id: ingestResult.batchId,
        },
      });
    }

    // Always record into store for immediate responsiveness
    store.addDocument(documentRecord, []);

    return {
      success: true,
      documentId: docId,
      chunkCount: ingestResult.chunkCount,
      batchId: ingestResult.batchId,
      status: initialStatus,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Document processing and indexing failed.';
    console.error('[IngestionService] Ingestion failed for document:', filename, err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Polls the current indexing status of a document from the RAG provider
 */
export async function checkDocumentIngestionStatus(
  documentId: string,
  workspaceId: string
): Promise<{ status: DocumentStatus; totalSegments?: number; errorMessage?: string }> {
  const store = getStore();
  let doc = store.documents.find((d) => d.id === documentId && d.workspace_id === workspaceId);

  // If Supabase configured, check database
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('workspace_id', workspaceId)
      .single();
    if (data) {
      doc = data;
    }
  }

  if (!doc) {
    throw new Error('Document not found');
  }

  // If already ready or failed, or no batch ID exists, return current status
  if (doc.status === 'ready' || doc.status === 'failed' || !doc.dify_batch_id) {
    return {
      status: doc.status,
      totalSegments: doc.chunk_count,
      errorMessage: doc.processing_error || undefined,
    };
  }

  // Poll provider
  const provider = getRAGProvider();
  const providerStatus = await provider.getIngestionStatus(workspaceId, doc.dify_batch_id);

  // Update record if status changed
  if (providerStatus.status !== doc.status || providerStatus.totalSegments !== doc.chunk_count) {
    doc.status = providerStatus.status;
    if (providerStatus.totalSegments) {
      doc.chunk_count = providerStatus.totalSegments;
    }
    if (providerStatus.errorMessage) {
      doc.processing_error = providerStatus.errorMessage;
    }
    doc.updated_at = new Date().toISOString();

    if (supabase) {
      await supabase
        .from('documents')
        .update({
          status: doc.status,
          chunk_count: doc.chunk_count,
          processing_error: doc.processing_error,
          updated_at: doc.updated_at,
        })
        .eq('id', documentId);
    }
  }

  return {
    status: doc.status,
    totalSegments: doc.chunk_count,
    errorMessage: doc.processing_error || undefined,
  };
}

/**
 * Cascading deletion of document from RAG provider, database, and storage
 */
export async function deleteDocumentCascade(
  documentId: string,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const store = getStore();
    const doc = store.documents.find((d) => d.id === documentId);
    const provider = getRAGProvider();

    // 1. Delete from RAG provider if external document ID exists
    const externalId = doc?.dify_document_id || documentId;
    try {
      await provider.deleteIndexedDocument(workspaceId, externalId);
    } catch (providerErr) {
      console.warn('[IngestionService] Provider delete warning (may already be deleted):', providerErr);
    }

    // 2. Delete from Supabase if configured
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from('documents').delete().eq('id', documentId).eq('workspace_id', workspaceId);
      await supabase.from('activity_events').insert({
        workspace_id: workspaceId,
        actor_id: doc?.uploaded_by || 'usr-system',
        event_type: 'document.deleted',
        resource_type: 'document',
        resource_id: documentId,
        metadata: { filename: doc?.original_filename },
      });
    }

    // 3. Remove from local store
    store.deleteDocument(documentId);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete document.';
    return { success: false, error: message };
  }
}
