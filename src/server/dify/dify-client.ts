/**
 * Server-Side Dify API Client
 * 
 * Secure, server-only HTTP adapter for Dify Knowledge Base & Dataset APIs.
 * Invariant: Never import this module into client components or browser bundles.
 */

export interface DifyConfig {
  baseUrl?: string;
  datasetApiKey?: string;
  appApiKey?: string;
  timeoutMs?: number;
}

export interface DifyDocumentUploadResponse {
  document: {
    id: string;
    position: number;
    name: string;
    created_from: string;
    created_at: number;
  };
  batch: string;
}

export interface DifyIndexingStatusItem {
  id: string;
  indexing_status: 'waiting' | 'parsing' | 'cleaning' | 'splitting' | 'indexing' | 'completed' | 'error' | 'paused';
  processing_status: string;
  error?: string | null;
  completed_at?: number | null;
  total_segments?: number;
}

export interface DifyIndexingStatusResponse {
  data: DifyIndexingStatusItem[];
}

export interface DifyRetrievedSegment {
  segmentId: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
  position?: number;
}

export interface DifyRetrieveResponse {
  query: { content: string };
  records: Array<{
    segment: {
      id: string;
      position: number;
      document_id: string;
      content: string;
      word_count?: number;
      tokens?: number;
    };
    score: number;
    document: {
      id: string;
      name: string;
    };
  }>;
}

export class DifyClient {
  private readonly baseUrl: string;
  private readonly datasetApiKey: string;
  private readonly timeoutMs: number;

  constructor(config?: DifyConfig) {
    const rawBaseUrl = config?.baseUrl || process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
    this.baseUrl = rawBaseUrl.replace(/\/+$/, '');
    this.datasetApiKey = config?.datasetApiKey || process.env.DIFY_DATASET_API_KEY || '';
    this.timeoutMs = config?.timeoutMs || 30000;
  }

  /**
   * Asserts that the server-side API key is present before attempting requests
   */
  private assertApiKey() {
    if (!this.datasetApiKey || this.datasetApiKey.trim().length === 0) {
      throw new Error(
        '[DifyClient] Missing server-only DIFY_DATASET_API_KEY. Configure .env.local to enable real Dify RAG operations.'
      );
    }
  }

  /**
   * Executes an authenticated fetch request against Dify with timeout and sanitized errors
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & { customTimeoutMs?: number } = {}
  ): Promise<T> {
    this.assertApiKey();

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, options.customTimeoutMs || this.timeoutMs);

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.datasetApiKey}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.code && errBody?.message) {
            errMessage = `${errMessage}: [${errBody.code}] ${errBody.message}`;
          } else if (errBody?.message) {
            errMessage = `${errMessage}: ${errBody.message}`;
          } else if (errBody?.code) {
            errMessage = `${errMessage}: ${errBody.code}`;
          }
        } catch {
          // ignore non-JSON error response
        }

        // Never expose API key or sensitive parameters in thrown errors
        throw new Error(`[DifyClient] Request to ${endpoint} failed (${errMessage})`);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`[DifyClient] Request to ${endpoint} timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Uploads a document to a Dify dataset for asynchronous chunking and indexing
   * POST /datasets/{dataset_id}/document/create-by-file
   */
  async createDocumentByFile(
    datasetId: string,
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ documentId: string; batchId: string }> {
    if (!datasetId) {
      throw new Error('[DifyClient] Target datasetId is required for document creation');
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)]);
    formData.append('file', blob, filename);
    formData.append(
      'data',
      JSON.stringify({
        indexing_technique: 'high_quality',
        doc_form: 'text_model',
        doc_language: 'English',
        process_rule: {
          mode: 'automatic',
        },
      })
    );

    const res = await this.request<DifyDocumentUploadResponse>(
      `/datasets/${datasetId}/document/create-by-file`,
      {
        method: 'POST',
        body: formData,
        customTimeoutMs: 60000, // 60s for file uploads
      }
    );

    return {
      documentId: res.document.id,
      batchId: res.batch,
    };
  }

  /**
   * Retrieves the processing and vector indexing status for a document batch
   * GET /datasets/{dataset_id}/documents/{batch}/indexing-status
   */
  async getIndexingStatus(
    datasetId: string,
    batchId: string
  ): Promise<DifyIndexingStatusItem | null> {
    if (!datasetId || !batchId) {
      throw new Error('[DifyClient] datasetId and batchId are required to check indexing status');
    }

    const res = await this.request<DifyIndexingStatusResponse>(
      `/datasets/${datasetId}/documents/${batchId}/indexing-status`,
      {
        method: 'GET',
      }
    );

    if (!res.data || res.data.length === 0) {
      return null;
    }

    return res.data[0];
  }

  /**
   * Retrieves relevant segments from a knowledge base dataset
   * POST /datasets/{dataset_id}/retrieve
   */
  async retrieveSegments(
    datasetId: string,
    query: string,
    topK = 4
  ): Promise<DifyRetrievedSegment[]> {
    if (!datasetId) {
      throw new Error('[DifyClient] datasetId is required for retrieval');
    }

    try {
      const res = await this.request<DifyRetrieveResponse>(
        `/datasets/${datasetId}/retrieve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.slice(0, 250), // Dify query string limit
            external_retrieval_model: {
              top_k: topK,
              score_threshold_enabled: false,
            },
          }),
        }
      );

      if (!res.records || !Array.isArray(res.records)) {
        return [];
      }

      return res.records.map((rec: any) => ({
        segmentId: rec.segment?.id || rec.id || `seg-${Date.now()}`,
        documentId: rec.document?.id || rec.segment?.document_id || '',
        documentName: rec.document?.name || rec.segment?.document_name || 'Document',
        content: rec.segment?.content || rec.content || '',
        score: rec.score ?? 0.85,
        position: rec.segment?.position || 1,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Collection not found') || msg.includes('not found') || msg.includes('empty')) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Deletes a document and its vector representations from a Dify dataset
   * DELETE /datasets/{dataset_id}/documents/{document_id}
   */
  async deleteDocument(datasetId: string, documentId: string): Promise<void> {
    if (!datasetId || !documentId) {
      throw new Error('[DifyClient] datasetId and documentId are required for deletion');
    }

    await this.request<{ result: string }>(
      `/datasets/${datasetId}/documents/${documentId}`,
      {
        method: 'DELETE',
      }
    );
  }
}
