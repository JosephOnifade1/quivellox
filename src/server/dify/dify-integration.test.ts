import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DifyClient } from './dify-client';
import { DifyRAGProvider } from './dify-rag-provider';
import { ingestDocument, checkDocumentIngestionStatus, deleteDocumentCascade } from '../ingestion/ingestion-service';
import { getStore } from '@/lib/rag-store';

describe('Dify Architecture Adjustment Integration & Security Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DIFY_DATASET_API_KEY = 'dataset-secret-token-12345';
    process.env.DIFY_DEFAULT_DATASET_ID = 'ds-quivellox-primary';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // 1. Missing or invalid Dify configuration
  it('fails safely when Dify configuration is missing without leaking internals', async () => {
    delete process.env.DIFY_DATASET_API_KEY;
    const client = new DifyClient({ datasetApiKey: '' });
    await expect(client.retrieveSegments('ds-1', 'test')).rejects.toThrow(
      'Missing server-only DIFY_DATASET_API_KEY'
    );
  });

  // 2. Credentials Isolation: Never leak credentials in client responses or error messages
  it('guarantees DIFY_DATASET_API_KEY is never exposed in error messages on HTTP 401', async () => {
    const client = new DifyClient({ datasetApiKey: 'SUPER_SECRET_KEY_NEVER_LEAK' });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    try {
      await client.retrieveSegments('ds-quivellox-primary', 'test');
      expect.fail('Should have failed');
    } catch (err: any) {
      expect(err.message).not.toContain('SUPER_SECRET_KEY_NEVER_LEAK');
      expect(err.message).toContain('HTTP 401 Unauthorized');
    }
  });

  // 3. API Timeouts and Rate Limits (HTTP 429)
  it('handles Dify rate limiting (HTTP 429) gracefully', async () => {
    const client = new DifyClient({ datasetApiKey: 'dataset-key' });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ code: 'rate_limit_exceeded', message: 'Quota exceeded for dataset' }),
    } as Response);

    await expect(client.retrieveSegments('ds-1', 'test')).rejects.toThrow(
      'rate_limit_exceeded'
    );
  });

  // 4. Cross-workspace / Tenant Isolation
  it('enforces server-side dataset isolation and prevents client dataset substitution', async () => {
    const mockClient = new DifyClient({ datasetApiKey: 'dataset-key' });
    const provider = new DifyRAGProvider(mockClient);

    const store = getStore();
    // ws-alpha has dataset 'ds-alpha'
    store.workspaces = [
      { id: 'ws-alpha', name: 'Alpha', owner_id: 'usr-1', dify_dataset_id: 'ds-alpha', created_at: '', updated_at: '' },
      { id: 'ws-beta', name: 'Beta', owner_id: 'usr-2', dify_dataset_id: 'ds-beta', created_at: '', updated_at: '' },
    ];

    const retrieveSpy = vi.spyOn(mockClient, 'retrieveSegments').mockResolvedValue([]);

    // Query for ws-alpha must only target ds-alpha
    await provider.answerQuestion({
      workspaceId: 'ws-alpha',
      userId: 'usr-1',
      question: 'query alpha',
    });
    expect(retrieveSpy).toHaveBeenCalledWith('ds-alpha', 'query alpha', 4);

    // Query for ws-beta must only target ds-beta
    await provider.answerQuestion({
      workspaceId: 'ws-beta',
      userId: 'usr-2',
      question: 'query beta',
    });
    expect(retrieveSpy).toHaveBeenCalledWith('ds-beta', 'query beta', 4);
  });

  // 5. Successful and Failed Document Indexing State Transitions
  it('accurately tracks document indexing status transitions from Dify batch', async () => {
    const mockClient = new DifyClient({ datasetApiKey: 'dataset-key' });
    const provider = new DifyRAGProvider(mockClient);

    // Polling step 1: in-progress (cleaning/splitting)
    vi.spyOn(mockClient, 'getIndexingStatus').mockResolvedValueOnce({
      id: 'doc-dify-1',
      indexing_status: 'splitting',
      processing_status: 'processing',
    });
    const status1 = await provider.getIngestionStatus('ws-demo', 'batch-101');
    expect(status1.status).toBe('chunking');

    // Polling step 2: completed
    vi.spyOn(mockClient, 'getIndexingStatus').mockResolvedValueOnce({
      id: 'doc-dify-1',
      indexing_status: 'completed',
      processing_status: 'completed',
      total_segments: 14,
    });
    const status2 = await provider.getIngestionStatus('ws-demo', 'batch-101');
    expect(status2.status).toBe('ready');
    expect(status2.totalSegments).toBe(14);
  });

  // 6. Citation Resolution & Foreign Source Rejection
  it('rejects foreign citations from documents not belonging to current workspace', async () => {
    const mockClient = new DifyClient({ datasetApiKey: 'dataset-key' });
    const provider = new DifyRAGProvider(mockClient);

    const store = getStore();
    // ws-demo only owns doc-001
    store.documents = [
      {
        id: 'doc-001',
        workspace_id: 'ws-demo',
        uploaded_by: 'usr-1',
        original_filename: 'Local_Doc.pdf',
        storage_path: '/path',
        mime_type: 'application/pdf',
        file_size_bytes: 1000,
        status: 'ready',
        chunk_count: 2,
        dify_document_id: 'dify-doc-local',
        document_index: 'DOC-001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Dify returns 2 segments: one for Local_Doc.pdf, and one foreign segment from Unknown_Foreign.pdf
    vi.spyOn(mockClient, 'retrieveSegments').mockResolvedValueOnce([
      {
        segmentId: 'seg-1',
        documentId: 'dify-doc-local',
        documentName: 'Local_Doc.pdf',
        content: 'Local doc contains valid verified policy excerpt.',
        score: 0.95,
      },
      {
        segmentId: 'seg-2',
        documentId: 'dify-foreign-unauthorized',
        documentName: 'Unknown_Foreign.pdf',
        content: 'Foreign confidential data from another tenant.',
        score: 0.91,
      },
    ]);

    const result = await provider.answerQuestion({
      workspaceId: 'ws-demo',
      userId: 'usr-1',
      question: 'Tell me about the policy',
    });

    // All valid citations must belong strictly to doc-001
    expect(result.citations.every((c) => c.document_id === 'doc-001')).toBe(true);
    // Foreign document must never appear in citations
    expect(result.citations.some((c) => c.document_name === 'Unknown_Foreign.pdf')).toBe(false);
  });

  // 7. Cascading Document Deletion & Reconciliation
  it('orchestrates cascading deletion across Dify and Quivellox store', async () => {
    const store = getStore();
    const docToDelete = {
      id: 'doc-delete-test',
      workspace_id: 'ws-demo',
      uploaded_by: 'usr-1',
      original_filename: 'Old_Draft.pdf',
      storage_path: '/vault/docs/Old_Draft.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 500,
      status: 'ready' as const,
      chunk_count: 3,
      dify_document_id: 'dify-doc-to-delete',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.documents.push(docToDelete);

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'success' }),
    } as Response);

    const deleteResult = await deleteDocumentCascade('doc-delete-test', 'ws-demo');
    expect(deleteResult.success).toBe(true);

    // Document must be removed from store
    const found = store.documents.find((d) => d.id === 'doc-delete-test');
    expect(found).toBeUndefined();
  });
});
