import {
  IRAGProvider,
  IngestDocumentParams,
  IngestDocumentResult,
  IngestionStatusResult,
  RAGAnswerParams,
  GroundedRAGResult,
} from '../rag/provider-interface';
import { DifyClient } from './dify-client';
import { Document, DocumentChunk, DocumentStatus, Citation } from '@/types';
import { getStore } from '@/lib/rag-store';
import { listDocumentsByWorkspace } from '../db/documents-repository';
import { validateCitations } from '../rag/citation-validator';
import { generateGroundedResponse } from '../rag/generator';

export class DifyRAGProvider implements IRAGProvider {
  readonly name = 'dify';
  private readonly client: DifyClient;

  constructor(client?: DifyClient) {
    this.client = client || new DifyClient();
  }

  /**
   * Resolves the Dify Dataset ID securely bound to the authorized Quellivox workspace.
   * Enforces server-side boundary: clients can NEVER submit arbitrary dataset IDs.
   */
  private resolveDatasetId(workspaceId: string): string {
    const defaultDataset = process.env.DIFY_DEFAULT_DATASET_ID;
    
    // In production with Supabase, query workspace table for dify_dataset_id
    // For local evaluation/in-memory store:
    const store = getStore();
    const ws = store.workspaces?.find((w: { id: string; dify_dataset_id?: string | null }) => w.id === workspaceId);
    
    const datasetId = ws?.dify_dataset_id || defaultDataset;

    if (!datasetId) {
      throw new Error(
        `[DifyRAGProvider] No Dify dataset bound to workspace ${workspaceId}. Configure DIFY_DEFAULT_DATASET_ID or provision a workspace dataset.`
      );
    }

    return datasetId;
  }

  async ingestDocument(params: IngestDocumentParams): Promise<IngestDocumentResult> {
    const datasetId = this.resolveDatasetId(params.workspaceId);
    const { documentId, batchId } = await this.client.createDocumentByFile(
      datasetId,
      params.fileBuffer,
      params.filename
    );

    return {
      externalDocumentId: documentId,
      batchId,
    };
  }

  async getIngestionStatus(workspaceId: string, batchId: string): Promise<IngestionStatusResult> {
    const datasetId = this.resolveDatasetId(workspaceId);
    const item = await this.client.getIndexingStatus(datasetId, batchId);

    if (!item) {
      return {
        status: 'queued',
      };
    }

    let status: DocumentStatus = 'queued';
    switch (item.indexing_status) {
      case 'waiting':
        status = 'queued';
        break;
      case 'parsing':
      case 'cleaning':
        status = 'extracting';
        break;
      case 'splitting':
        status = 'chunking';
        break;
      case 'indexing':
        status = 'indexing';
        break;
      case 'completed':
        status = 'ready';
        break;
      case 'error':
      case 'paused':
        status = 'failed';
        break;
    }

    return {
      status,
      totalSegments: item.total_segments,
      errorMessage: item.error || undefined,
      completedAt: item.completed_at ? new Date(item.completed_at * 1000).toISOString() : undefined,
    };
  }

  async answerQuestion(params: RAGAnswerParams): Promise<GroundedRAGResult> {
    const startTime = Date.now();
    const datasetId = this.resolveDatasetId(params.workspaceId);

    // 1. Retrieve top-K relevant segments from Dify Knowledge Base
    const difySegments = await this.client.retrieveSegments(datasetId, params.question, params.topK || 4);

    // 2. Fetch workspace documents (preferring DB, falling back to local store)
    let workspaceDocs: Document[] = [];
    try {
      const dbDocs = await listDocumentsByWorkspace(params.workspaceId);
      if (dbDocs && dbDocs.length > 0) {
        workspaceDocs = dbDocs;
      }
    } catch {
      // fallback to store
    }

    if (workspaceDocs.length === 0) {
      const store = getStore();
      workspaceDocs = store.documents.filter((d) => d.workspace_id === params.workspaceId);
    }

    // STRICT PHASE 3: Only documents with status === 'ready' may serve as evidence
    const readyDocs = workspaceDocs.filter((d) => d.status === 'ready');
    const indexingDocs = workspaceDocs.filter((d) =>
      ['queued', 'extracting', 'chunking', 'indexing'].includes(d.status)
    );

    if (workspaceDocs.length > 0 && readyDocs.length === 0) {
      if (indexingDocs.length > 0) {
        return {
          answer: 'Your workspace documents are currently still indexing and being prepared. Please allow ingestion to complete before querying for evidence.',
          citations: [],
          retrievedChunks: [],
          insufficientEvidence: true,
          provider: this.name,
          queryTimeMs: Date.now() - startTime,
        };
      }
      return {
        answer: 'I could not find any ready, indexed documents in your authorized workspace to answer this question.',
        citations: [],
        retrievedChunks: [],
        insufficientEvidence: true,
        provider: this.name,
        queryTimeMs: Date.now() - startTime,
      };
    }

    // 3. Map and verify segments strictly against ready Quellivox workspace documents
    const retrievedChunks: DocumentChunk[] = [];
    const validCandidateCitations: Citation[] = [];

    for (const seg of difySegments) {
      // Find trusted Quellivox document by dify_document_id or filename
      const matchedDoc = readyDocs.find(
        (d) => (d.dify_document_id && d.dify_document_id === seg.documentId) || d.original_filename === seg.documentName
      );

      const chunk: DocumentChunk = {
        id: `dify-${seg.segmentId}`,
        document_id: matchedDoc ? matchedDoc.id : `dify-doc-${seg.documentId}`,
        workspace_id: params.workspaceId,
        chunk_index: seg.position || 0,
        content: seg.content,
        similarity: seg.score,
        created_at: new Date().toISOString(),
      };

      retrievedChunks.push(chunk);

      if (matchedDoc) {
        validCandidateCitations.push({
          chunk_id: chunk.id,
          document_id: matchedDoc.id,
          document_name: matchedDoc.original_filename,
          document_index: matchedDoc.document_index || 'DOC',
          quote: seg.content.slice(0, 180) + '…',
          similarity: seg.score,
        });
      }
    }

    if (retrievedChunks.length === 0) {
      return {
        answer: 'I could not find any relevant information in your authorized workspace documents to answer this question.',
        citations: [],
        retrievedChunks: [],
        insufficientEvidence: true,
        provider: this.name,
        queryTimeMs: Date.now() - startTime,
      };
    }

    // 4. Construct canonical RetrievedPassage array
    const passages = retrievedChunks.map((chunk, idx) => {
      const matchedDoc = readyDocs.find((d) => d.id === chunk.document_id);
      return {
        chunk,
        score: chunk.similarity || 0.8,
        documentTitle: matchedDoc ? matchedDoc.original_filename : 'Document',
        documentIndex: matchedDoc ? (matchedDoc.document_index || 'DOC') : `DOC-${idx + 1}`,
      };
    });

    // 5. Generate grounded answer
    const generation = await generateGroundedResponse(params.question, passages);

    // 6. Strict Citation Validation: ensure all returned citations map to retrieved passages
    const validation = validateCitations(
      generation.citations,
      passages
    );

    // 7. Security filter: citations must belong strictly to authorized, ready workspace documents
    const readyDocIds = new Set(readyDocs.map((d) => d.id));
    const verifiedCitations = validation.validCitations.filter((c) =>
      readyDocIds.has(c.document_id)
    );

    return {
      answer: generation.answer,
      citations: verifiedCitations,
      retrievedChunks,
      insufficientEvidence: generation.insufficientEvidence || verifiedCitations.length === 0,
      provider: this.name,
      queryTimeMs: Date.now() - startTime,
    };
  }

  async deleteIndexedDocument(workspaceId: string, externalDocumentId: string): Promise<void> {
    const datasetId = this.resolveDatasetId(workspaceId);
    await this.client.deleteDocument(datasetId, externalDocumentId);
  }
}
