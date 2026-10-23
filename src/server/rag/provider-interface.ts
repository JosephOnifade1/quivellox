import { DocumentChunk, Citation, DocumentStatus } from '@/types';

export interface IngestDocumentParams {
  workspaceId: string;
  documentId: string;
  filename: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export interface IngestDocumentResult {
  externalDocumentId: string;
  batchId: string;
  chunkCount?: number;
}

export interface IngestionStatusResult {
  status: DocumentStatus;
  totalSegments?: number;
  errorMessage?: string;
  completedAt?: string;
}

export interface RAGAnswerParams {
  workspaceId: string;
  userId: string;
  question: string;
  conversationId?: string;
  topK?: number;
}

export interface GroundedRAGResult {
  answer: string;
  citations: Citation[];
  retrievedChunks: DocumentChunk[];
  insufficientEvidence: boolean;
  provider: string;
  queryTimeMs: number;
}

export interface IRAGProvider {
  readonly name: string;
  
  /**
   * Submits a document to the indexing engine
   */
  ingestDocument(params: IngestDocumentParams): Promise<IngestDocumentResult>;

  /**
   * Polls the asynchronous indexing status for a document batch
   */
  getIngestionStatus(workspaceId: string, batchId: string): Promise<IngestionStatusResult>;

  /**
   * Executes access-controlled semantic retrieval and grounded answer generation
   */
  answerQuestion(params: RAGAnswerParams): Promise<GroundedRAGResult>;

  /**
   * Permanently deletes indexed vectors and document representations from the engine
   */
  deleteIndexedDocument(workspaceId: string, externalDocumentId: string): Promise<void>;
}
