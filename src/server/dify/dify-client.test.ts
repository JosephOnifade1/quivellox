import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DifyClient } from './dify-client';

describe('DifyClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('throws descriptive error if DIFY_DATASET_API_KEY is missing', async () => {
    delete process.env.DIFY_DATASET_API_KEY;
    const client = new DifyClient({ datasetApiKey: '' });

    await expect(
      client.retrieveSegments('dataset-123', 'test query')
    ).rejects.toThrow('Missing server-only DIFY_DATASET_API_KEY');
  });

  it('enforces datasetId parameter requirement on createDocumentByFile', async () => {
    const client = new DifyClient({ datasetApiKey: 'dataset-test-key' });
    await expect(
      client.createDocumentByFile('', Buffer.from('test'), 'test.txt')
    ).rejects.toThrow('Target datasetId is required');
  });

  it('successfully parses createDocumentByFile response', async () => {
    const client = new DifyClient({
      baseUrl: 'https://api.dify.ai/v1',
      datasetApiKey: 'dataset-test-key',
    });

    const mockResponse = {
      document: {
        id: 'doc-uuid-456',
        position: 1,
        name: 'manual.pdf',
        created_from: 'api',
        created_at: 1700000000,
      },
      batch: 'batch-uuid-789',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await client.createDocumentByFile(
      'dataset-123',
      Buffer.from('sample pdf content'),
      'manual.pdf'
    );

    expect(result.documentId).toBe('doc-uuid-456');
    expect(result.batchId).toBe('batch-uuid-789');
  });

  it('correctly retrieves indexing status for a batch', async () => {
    const client = new DifyClient({
      datasetApiKey: 'dataset-test-key',
    });

    const mockStatusResponse = {
      data: [
        {
          id: 'doc-uuid-456',
          indexing_status: 'completed',
          processing_status: 'completed',
          error: null,
          completed_at: 1700000100,
          total_segments: 12,
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatusResponse,
    } as Response);

    const status = await client.getIndexingStatus('dataset-123', 'batch-uuid-789');

    expect(status).not.toBeNull();
    expect(status?.indexing_status).toBe('completed');
    expect(status?.total_segments).toBe(12);
  });

  it('maps retrieved segments from Dify Knowledge Base', async () => {
    const client = new DifyClient({
      datasetApiKey: 'dataset-test-key',
    });

    const mockRetrieveResponse = {
      query: { content: 'What is SLA credit?' },
      records: [
        {
          segment: {
            id: 'seg-101',
            position: 1,
            document_id: 'doc-dify-1',
            content: 'If availability is under 99.95%, credit is 10%.',
          },
          score: 0.89,
          document: {
            id: 'doc-dify-1',
            name: 'SLA.pdf',
          },
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRetrieveResponse,
    } as Response);

    const segments = await client.retrieveSegments('dataset-123', 'What is SLA credit?', 2);

    expect(segments.length).toBe(1);
    expect(segments[0].segmentId).toBe('seg-101');
    expect(segments[0].score).toBe(0.89);
    expect(segments[0].content).toContain('99.95%');
  });

  it('handles HTTP error responses without exposing secrets', async () => {
    const client = new DifyClient({
      datasetApiKey: 'secret-token-that-must-never-leak',
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid API key' }),
    } as Response);

    try {
      await client.retrieveSegments('dataset-123', 'test');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('HTTP 401 Unauthorized');
      expect(err.message).toContain('Invalid API key');
      expect(err.message).not.toContain('secret-token');
    }
  });
});
