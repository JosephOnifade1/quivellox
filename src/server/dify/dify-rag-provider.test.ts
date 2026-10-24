import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DifyRAGProvider } from './dify-rag-provider';
import { DifyClient } from './dify-client';

describe('DifyRAGProvider', () => {
  let mockClient: DifyClient;
  let provider: DifyRAGProvider;

  beforeEach(() => {
    mockClient = new DifyClient({ datasetApiKey: 'test-key' });
    provider = new DifyRAGProvider(mockClient);
    process.env.DIFY_DEFAULT_DATASET_ID = 'ds-test-default';
  });

  it('correctly maps Dify indexing states to Quivellox DocumentStatus', async () => {
    vi.spyOn(mockClient, 'getIndexingStatus').mockResolvedValueOnce({
      id: 'doc-1',
      indexing_status: 'parsing',
      processing_status: 'processing',
    });

    const status1 = await provider.getIngestionStatus('ws-demo', 'batch-1');
    expect(status1.status).toBe('extracting');

    vi.spyOn(mockClient, 'getIndexingStatus').mockResolvedValueOnce({
      id: 'doc-1',
      indexing_status: 'splitting',
      processing_status: 'processing',
    });

    const status2 = await provider.getIngestionStatus('ws-demo', 'batch-1');
    expect(status2.status).toBe('chunking');

    vi.spyOn(mockClient, 'getIndexingStatus').mockResolvedValueOnce({
      id: 'doc-1',
      indexing_status: 'completed',
      processing_status: 'completed',
      total_segments: 18,
      completed_at: 1700000000,
    });

    const status3 = await provider.getIngestionStatus('ws-demo', 'batch-1');
    expect(status3.status).toBe('ready');
    expect(status3.totalSegments).toBe(18);

    vi.spyOn(mockClient, 'getIndexingStatus').mockResolvedValueOnce({
      id: 'doc-1',
      indexing_status: 'error',
      processing_status: 'error',
      error: 'Corrupted PDF file',
    });

    const status4 = await provider.getIngestionStatus('ws-demo', 'batch-1');
    expect(status4.status).toBe('failed');
    expect(status4.errorMessage).toBe('Corrupted PDF file');
  });

  it('handles zero retrieved segments gracefully with insufficient evidence', async () => {
    vi.spyOn(mockClient, 'retrieveSegments').mockResolvedValueOnce([]);

    const result = await provider.answerQuestion({
      workspaceId: 'ws-demo',
      userId: 'usr-1',
      question: 'What is the policy?',
    });

    expect(result.insufficientEvidence).toBe(true);
    expect(result.citations).toHaveLength(0);
    expect(result.retrievedChunks).toHaveLength(0);
  });

  it('calls deleteDocument on client when deleting indexed document', async () => {
    const deleteSpy = vi.spyOn(mockClient, 'deleteDocument').mockResolvedValueOnce();

    await provider.deleteIndexedDocument('ws-demo', 'doc-dify-123');

    expect(deleteSpy).toHaveBeenCalledWith('ds-test-default', 'doc-dify-123');
  });
});
