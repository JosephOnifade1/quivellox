import crypto from 'crypto';
import { validateFile } from '../documents/parser';
import { getRAGProvider } from '../rag/provider-factory';
import {
  insertDocumentRecord,
  getDocumentById,
  updateDocumentStatus,
  deleteDocumentRecord,
  listDocumentsByWorkspace,
} from '../db/documents-repository';
import {
  createIngestionJob,
  getIngestionJobByDocumentId,
  updateIngestionJob,
} from '../db/ingestion-jobs-repository';
import {
  uploadDocumentToStorage,
  downloadFileFromStorage,
  deleteDocumentFromStorage,
  validateStoragePathBelongsToWorkspace,
} from '../storage/storage-service';
import { recordActivityEvent } from '../db/activity-repository';
import {
  assertValidTransition,
  isValidTransition,
  isTerminalStatus,
} from '../documents/lifecycle';
import { getStore } from '@/lib/rag-store';
import { Document, DocumentStatus } from '@/types';

export interface IngestionOptions {
  workspaceId: string;
  userId: string;
  filename: string;
  fileBuffer: Buffer | ArrayBuffer;
  mimeType?: string;
  documentId?: string; // Optional pre-assigned UUID (for deterministic testing)
}

export interface IngestionResult {
  success: boolean;
  documentId?: string;
  chunkCount?: number;
  batchId?: string;
  status?: DocumentStatus;
  storagePath?: string;
  jobId?: string;
  error?: string;
}

/**
 * Strips sensitive keys or system URLs from error messages before persisting or returning to user
 */
function sanitizeErrorMessage(rawError: string): string {
  return rawError
    .replace(/dataset-[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]')
    .replace(/app-[a-zA-Z0-9_-]+/g, '[REDACTED_APP_KEY]')
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_SECRET]')
    .slice(0, 300);
}

/**
 * Executes the complete durable document ingestion pipeline:
 * 1. Validates file constraints (format, size).
 * 2. Uploads original document to private Supabase Storage ('vault' bucket).
 * 3. Creates canonical document record with status 'queued' and durable ingestion job.
 * 4. Delegates indexing to active RAG provider (Dify or Local fallback).
 * 5. Persists returned Dify document and batch identifiers.
 * 6. Logs audit activity events.
 */
export async function ingestDocument(options: IngestionOptions): Promise<IngestionResult> {
  const { workspaceId, userId, filename, fileBuffer, mimeType, documentId } = options;
  const nodeBuffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);

  // 1. Validate file (size, format, mime)
  const validation = validateFile({ name: filename, size: nodeBuffer.length, type: mimeType });
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Canonical UUID identifier for the document
  const docId = documentId || crypto.randomUUID();
  const checksum = `sha256:${crypto.createHash('sha256').update(nodeBuffer).digest('hex')}`;
  const store = getStore();
  const docIndex = `DOC-${String(store.documents.length + 1).padStart(3, '0')}`;
  const provider = getRAGProvider();

  // 2. Upload original file to private Supabase Storage
  const storageUpload = await uploadDocumentToStorage({
    workspaceId,
    documentId: docId,
    filename,
    fileBuffer: nodeBuffer,
    mimeType: mimeType || 'application/pdf',
  });

  if (!storageUpload.success) {
    console.error('[IngestionService] Storage upload failed:', storageUpload.error);
    return {
      success: false,
      error: `Failed to store file in vault: ${storageUpload.error}`,
    };
  }

  // 3. Create document record with status 'queued'
  const documentRecord: Document = {
    id: docId,
    workspace_id: workspaceId,
    uploaded_by: userId,
    original_filename: filename,
    storage_path: storageUpload.storagePath,
    mime_type: mimeType || 'application/pdf',
    file_size_bytes: nodeBuffer.length,
    checksum,
    status: 'queued',
    page_count: 1,
    chunk_count: 0,
    document_index: docIndex,
    dify_document_id: null,
    dify_batch_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await insertDocumentRecord(documentRecord);
  } catch (dbErr) {
    console.warn('[IngestionService] Database insert warning:', dbErr);
  }

  // 4. Create durable Ingestion Job
  const job = await createIngestionJob({ documentId: docId, maxAttempts: 3 });
  if (job) {
    await updateIngestionJob(job.id, {
      status: 'processing',
      attempts: 1,
      started_at: new Date().toISOString(),
    });
  }

  await recordActivityEvent({
    workspaceId,
    actorId: userId,
    eventType: 'document.uploaded',
    resourceType: 'document',
    resourceId: docId,
    metadata: { filename, storage_path: storageUpload.storagePath },
  });

  try {
    // 5. Delegate indexing to active RAG provider
    const ingestResult = await provider.ingestDocument({
      workspaceId,
      documentId: docId,
      filename,
      fileBuffer: nodeBuffer,
      mimeType: mimeType || 'application/octet-stream',
    });

    const targetStatus: DocumentStatus = provider.name === 'dify' ? 'indexing' : 'ready';
    if (targetStatus === 'ready') {
      assertValidTransition('queued', 'indexing', docId);
      assertValidTransition('indexing', 'ready', docId);
    } else {
      assertValidTransition('queued', targetStatus, docId);
    }

    documentRecord.status = targetStatus;
    documentRecord.chunk_count = ingestResult.chunkCount || 0;
    documentRecord.dify_document_id = ingestResult.externalDocumentId || null;
    documentRecord.dify_batch_id = ingestResult.batchId || null;
    documentRecord.updated_at = new Date().toISOString();

    await updateDocumentStatus(docId, workspaceId, {
      status: targetStatus,
      chunk_count: documentRecord.chunk_count,
      dify_document_id: documentRecord.dify_document_id,
      dify_batch_id: documentRecord.dify_batch_id,
    });

    if (targetStatus === 'indexing') {
      await recordActivityEvent({
        workspaceId,
        actorId: userId,
        eventType: 'document.indexing_started',
        resourceType: 'document',
        resourceId: docId,
        metadata: {
          filename,
          provider: provider.name,
          dify_batch_id: ingestResult.batchId,
        },
      });
    } else {
      if (job) {
        await updateIngestionJob(job.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      }
      await recordActivityEvent({
        workspaceId,
        actorId: userId,
        eventType: 'document.ready',
        resourceType: 'document',
        resourceId: docId,
        metadata: {
          filename,
          chunks: ingestResult.chunkCount,
        },
      });
    }

    // Always keep store updated for local fallback & test visibility
    store.addDocument(documentRecord, []);

    return {
      success: true,
      documentId: docId,
      chunkCount: ingestResult.chunkCount,
      batchId: ingestResult.batchId,
      status: targetStatus,
      storagePath: storageUpload.storagePath,
      jobId: job?.id,
    };
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : 'Document processing and indexing failed.';
    const safeError = sanitizeErrorMessage(rawError);
    console.error('[IngestionService] Ingestion failed for document:', filename, safeError);

    // Transition to failed state
    await updateDocumentStatus(docId, workspaceId, {
      status: 'failed',
      processing_error: safeError,
    });

    if (job) {
      await updateIngestionJob(job.id, {
        status: 'failed',
        error_message: safeError,
      });
    }

    documentRecord.status = 'failed';
    documentRecord.processing_error = safeError;
    store.addDocument(documentRecord, []);

    await recordActivityEvent({
      workspaceId,
      actorId: userId,
      eventType: 'document.failed',
      resourceType: 'document',
      resourceId: docId,
      metadata: { filename, error: safeError },
    });

    return {
      success: false,
      documentId: docId,
      status: 'failed',
      error: safeError,
    };
  }
}

/**
 * Safely retries a failed or stalled document ingestion.
 * 1. Verifies document and ensures retry transition is valid.
 * 2. Checks bounded retry limits.
 * 3. Removes prior Dify indexing resources to prevent duplicates.
 * 4. Downloads original file from private Supabase Storage.
 * 5. Re-submits to RAG provider and increments attempt count.
 */
export async function retryDocumentIngestion(
  documentId: string,
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; document?: Document; error?: string }> {
  let doc = await getDocumentById(documentId, workspaceId);
  const store = getStore();
  if (!doc) {
    doc = store.documents.find((d) => d.id === documentId && d.workspace_id === workspaceId) || null;
  }

  if (!doc) {
    return { success: false, error: 'Document not found.' };
  }

  // Validate state machine allows retry
  if (doc.status !== 'failed' && doc.status !== 'queued') {
    return {
      success: false,
      error: `Cannot retry document in status '${doc.status}'. Only failed or queued documents can be retried.`,
    };
  }

  // Check bounded retry limits
  const job = await getIngestionJobByDocumentId(documentId);
  if (job && job.attempts >= job.max_attempts) {
    return {
      success: false,
      error: `Maximum retry attempts reached (${job.attempts}/${job.max_attempts}). Please re-upload the file or contact support.`,
    };
  }

  const nextAttempts = (job?.attempts || 0) + 1;

  // Prevent duplicate documents in Dify: if prior Dify document ID exists, clean it up
  if (doc.dify_document_id) {
    try {
      const provider = getRAGProvider();
      await provider.deleteIndexedDocument(workspaceId, doc.dify_document_id);
    } catch (cleanupErr) {
      console.warn('[IngestionService] Cleanup prior Dify doc before retry notice:', cleanupErr);
    }
  }

  // Download original file buffer from private Supabase Storage
  const downloadRes = await downloadFileFromStorage(workspaceId, doc.storage_path);
  if (!downloadRes.success || !downloadRes.data) {
    return {
      success: false,
      error: `Cannot retry: original source file not found in storage vault (${downloadRes.error || 'file missing'}).`,
    };
  }

  // Update status to 'queued' then 'indexing'
  assertValidTransition(doc.status, 'queued', documentId);
  await updateDocumentStatus(documentId, workspaceId, {
    status: 'queued',
    processing_error: null,
  });

  if (job) {
    await updateIngestionJob(job.id, {
      status: 'processing',
      attempts: nextAttempts,
      started_at: new Date().toISOString(),
      error_message: null,
    });
  }

  const provider = getRAGProvider();
  try {
    const ingestResult = await provider.ingestDocument({
      workspaceId,
      documentId,
      filename: doc.original_filename,
      fileBuffer: downloadRes.data,
      mimeType: doc.mime_type,
    });

    const targetStatus: DocumentStatus = provider.name === 'dify' ? 'indexing' : 'ready';
    if (targetStatus === 'ready') {
      assertValidTransition('queued', 'indexing', documentId);
      assertValidTransition('indexing', 'ready', documentId);
    } else {
      assertValidTransition('queued', targetStatus, documentId);
    }

    doc.status = targetStatus;
    doc.chunk_count = ingestResult.chunkCount || 0;
    doc.dify_document_id = ingestResult.externalDocumentId || null;
    doc.dify_batch_id = ingestResult.batchId || null;
    doc.processing_error = null;
    doc.updated_at = new Date().toISOString();

    await updateDocumentStatus(documentId, workspaceId, {
      status: targetStatus,
      chunk_count: doc.chunk_count,
      dify_document_id: doc.dify_document_id,
      dify_batch_id: doc.dify_batch_id,
      processing_error: null,
    });

    await recordActivityEvent({
      workspaceId,
      actorId: userId,
      eventType: 'document.indexing_started',
      resourceType: 'document',
      resourceId: documentId,
      metadata: {
        filename: doc.original_filename,
        retry_attempt: nextAttempts,
        dify_batch_id: ingestResult.batchId,
      },
    });

    return { success: true, document: doc };
  } catch (err: unknown) {
    const safeError = sanitizeErrorMessage(err instanceof Error ? err.message : 'Retry failed');
    await updateDocumentStatus(documentId, workspaceId, {
      status: 'failed',
      processing_error: safeError,
    });

    if (job) {
      await updateIngestionJob(job.id, {
        status: 'failed',
        error_message: safeError,
      });
    }

    return { success: false, error: safeError };
  }
}

/**
 * Polls the current indexing status of a document from the RAG provider
 * and updates the database record when status transitions occur.
 */
export async function checkDocumentIngestionStatus(
  documentId: string,
  workspaceId: string
): Promise<{ status: DocumentStatus; totalSegments?: number; errorMessage?: string }> {
  // Check PostgreSQL first
  let doc = await getDocumentById(documentId, workspaceId);

  // Fallback to in-memory store if DB not configured
  if (!doc) {
    const store = getStore();
    doc = store.documents.find((d) => d.id === documentId && d.workspace_id === workspaceId) || null;
  }

  if (!doc) {
    throw new Error('Document not found');
  }

  // If already terminal (ready or failed) or no Dify batch exists, return current status
  if (isTerminalStatus(doc.status) || !doc.dify_batch_id) {
    return {
      status: doc.status,
      totalSegments: doc.chunk_count,
      errorMessage: doc.processing_error || undefined,
    };
  }

  // Poll RAG provider for asynchronous indexing progress
  const provider = getRAGProvider();
  const providerStatus = await provider.getIngestionStatus(workspaceId, doc.dify_batch_id);

  // If status or segment count changed, update database & activity
  if (providerStatus.status !== doc.status || providerStatus.totalSegments !== doc.chunk_count) {
    // Validate transition
    if (isValidTransition(doc.status, providerStatus.status)) {
      doc.status = providerStatus.status;
    }
    if (providerStatus.totalSegments !== undefined) {
      doc.chunk_count = providerStatus.totalSegments;
    }
    if (providerStatus.errorMessage) {
      doc.processing_error = sanitizeErrorMessage(providerStatus.errorMessage);
    }

    await updateDocumentStatus(documentId, workspaceId, {
      status: doc.status,
      chunk_count: doc.chunk_count,
      processing_error: doc.processing_error,
    });

    const job = await getIngestionJobByDocumentId(documentId);

    // Record audit event on status transition
    if (providerStatus.status === 'ready') {
      if (job) {
        await updateIngestionJob(job.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      }
      await recordActivityEvent({
        workspaceId,
        actorId: doc.uploaded_by,
        eventType: 'document.ready',
        resourceType: 'document',
        resourceId: documentId,
        metadata: {
          filename: doc.original_filename,
          chunk_count: doc.chunk_count,
        },
      });
    } else if (providerStatus.status === 'failed') {
      if (job) {
        await updateIngestionJob(job.id, {
          status: 'failed',
          error_message: doc.processing_error,
        });
      }
      await recordActivityEvent({
        workspaceId,
        actorId: doc.uploaded_by,
        eventType: 'document.failed',
        resourceType: 'document',
        resourceId: documentId,
        metadata: {
          filename: doc.original_filename,
          error: doc.processing_error,
        },
      });
    }

    // Sync in-memory store
    const store = getStore();
    const storeDoc = store.documents.find((d) => d.id === documentId);
    if (storeDoc) {
      storeDoc.status = doc.status;
      storeDoc.chunk_count = doc.chunk_count;
      storeDoc.processing_error = doc.processing_error;
      storeDoc.updated_at = new Date().toISOString();
    }
  }

  return {
    status: doc.status,
    totalSegments: doc.chunk_count,
    errorMessage: doc.processing_error || undefined,
  };
}

/**
 * Scans active processing documents in a workspace and recovers their status from Dify.
 * Resolves stuck indexing jobs after server restarts or network interruptions.
 */
export async function recoverInterruptedJobs(workspaceId: string): Promise<{
  inspected: number;
  recovered: number;
  errors: number;
}> {
  const docs = await listDocumentsByWorkspace(workspaceId);
  const activeDocs = docs.filter((d) => d.status === 'indexing' || d.status === 'queued');

  let recovered = 0;
  let errors = 0;

  for (const doc of activeDocs) {
    try {
      const res = await checkDocumentIngestionStatus(doc.id, workspaceId);
      if (res.status === 'ready' || res.status === 'failed') {
        recovered++;
      }
    } catch (err) {
      console.warn('[IngestionRecovery] Failed to recover document:', doc.id, err);
      errors++;
    }
  }

  return {
    inspected: activeDocs.length,
    recovered,
    errors,
  };
}

/**
 * Cascading deletion of document from:
 * 1. RAG provider (Dify knowledge base)
 * 2. Supabase Storage ('vault' bucket)
 * 3. PostgreSQL database (cascades to chunks & jobs)
 * 4. Audit ledger (activity event)
 *
 * Explicitly tracks and reports partial failures rather than masking them.
 */
export async function deleteDocumentCascade(
  documentId: string,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  // Retrieve document to locate storage path and Dify identifiers
  let doc = await getDocumentById(documentId, workspaceId);
  const store = getStore();
  if (!doc) {
    doc = store.documents.find((d) => d.id === documentId && d.workspace_id === workspaceId) || null;
  }

  const failures: string[] = [];

  // Mark status as 'deleting'
  if (doc) {
    try {
      await updateDocumentStatus(documentId, workspaceId, { status: 'deleting' });
    } catch {
      // Non-fatal if DB unavailable
    }
  }

  // 1. Delete from RAG provider if external Dify document ID exists
  const externalId = doc?.dify_document_id;
  if (externalId) {
    try {
      const provider = getRAGProvider();
      await provider.deleteIndexedDocument(workspaceId, externalId);
    } catch (providerErr: unknown) {
      const msg = providerErr instanceof Error ? providerErr.message : 'Dify deletion failed';
      console.warn('[IngestionService] Provider deletion warning:', msg);
      failures.push(`RAG provider: ${msg}`);
    }
  }

  // 2. Delete original file from private Supabase Storage if it belongs to workspace storage
  if (doc?.storage_path && validateStoragePathBelongsToWorkspace(doc.storage_path, workspaceId)) {
    const storageRes = await deleteDocumentFromStorage(workspaceId, doc.storage_path);
    if (!storageRes.success && storageRes.error) {
      console.warn('[IngestionService] Storage deletion warning:', storageRes.error);
      failures.push(`Storage: ${storageRes.error}`);
    }
  }

  // 3. Delete from PostgreSQL database (cascade removes chunks and ingestion jobs)
  try {
    const dbDeleted = await deleteDocumentRecord(documentId, workspaceId);
    if (!dbDeleted && doc !== null) {
      console.warn('[IngestionService] Database record deletion returned false');
    }
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : 'Database deletion error';
    failures.push(`Database: ${msg}`);
  }

  // 4. Record audit activity event
  await recordActivityEvent({
    workspaceId,
    actorId: doc?.uploaded_by || 'usr-system',
    eventType: 'document.deleted',
    resourceType: 'document',
    resourceId: documentId,
    metadata: { filename: doc?.original_filename || 'document' },
  });

  // 5. Remove from in-memory store
  store.deleteDocument(documentId);

  if (failures.length > 0) {
    return {
      success: false,
      error: `Partial failure during document deletion: ${failures.join('; ')}`,
    };
  }

  return { success: true };
}
