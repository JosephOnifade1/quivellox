import { describe, it, expect, beforeEach } from 'vitest';
import { retrievePassages } from './retriever';
import { getStore } from '@/lib/rag-store';

describe('Retrieval Cross-Tenant Security', () => {
  beforeEach(() => {
    const store = getStore();
    store.resetToDefault();

    // Inject a confidential document belonging to Workspace B
    store.documents.push({
      id: 'doc-secret-b',
      workspace_id: 'ws-competitor-tenant',
      uploaded_by: 'usr-competitor',
      original_filename: 'Competitor_Secret_Acquisition_Strategy.pdf',
      storage_path: '/vault/docs/Competitor_Secret_Acquisition_Strategy.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 500000,
      status: 'ready',
      chunk_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_index: 'DOC-SEC-99',
    });

    store.chunks.push({
      id: 'chk-secret-b',
      document_id: 'doc-secret-b',
      workspace_id: 'ws-competitor-tenant',
      chunk_index: 0,
      content: 'Confidential corporate acquisition target is Stark Enterprises for $4.2 Billion.',
      created_at: new Date().toISOString(),
    });
  });

  it('guarantees Workspace A cannot retrieve chunks belonging to Workspace B', async () => {
    // User querying from Workspace A (ws-demo)
    const results = await retrievePassages('acquisition target Stark Enterprises', 'ws-demo', {
      topK: 5,
    });

    // Verify none of the results belong to Workspace B
    for (const r of results) {
      expect(r.chunk.workspace_id).toBe('ws-demo');
      expect(r.chunk.id).not.toBe('chk-secret-b');
      expect(r.documentTitle).not.toContain('Competitor_Secret');
    }
  });

  it('retrieves relevant chunks when querying within the authorized workspace', async () => {
    const results = await retrievePassages('refund window digital products', 'ws-demo', {
      topK: 3,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.workspace_id).toBe('ws-demo');
    expect(results.some((r) => r.chunk.content.toLowerCase().includes('refund'))).toBe(true);
  });
});
