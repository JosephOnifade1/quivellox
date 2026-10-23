import {
  IRAGProvider,
  IngestDocumentParams,
  IngestDocumentResult,
  IngestionStatusResult,
  RAGAnswerParams,
  GroundedRAGResult,
} from './provider-interface';
import { parseDocument } from '../documents/parser';
import { chunkText } from '../chunking/chunker';
import { retrievePassages } from '../retrieval/retriever';
import { generateGroundedResponse } from './generator';
import { getStore } from '@/lib/rag-store';
import { DocumentChunk } from '@/types';

export class LocalRAGProvider implements IRAGProvider {
  readonly name = 'local-deterministic';

  async ingestDocument(params: IngestDocumentParams): Promise<IngestDocumentResult> {
    const parseResult = await parseDocument(params.fileBuffer, params.filename, params.mimeType);
    const store = getStore();

    let globalChunkIdx = 0;
    const createdChunks: DocumentChunk[] = [];

    for (const page of parseResult.pages) {
      const pageChunks = chunkText(page.text, { targetTokens: 512, overlapTokens: 64 }, page.pageNumber);
      for (const pc of pageChunks) {
        const chunk: DocumentChunk = {
          id: `chk-${Date.now()}-${globalChunkIdx}`,
          document_id: params.documentId,
          workspace_id: params.workspaceId,
          chunk_index: globalChunkIdx++,
          content: pc.content,
          page_number: pc.pageNumber,
          section_title: pc.sectionTitle,
          token_count: pc.tokenCount,
          created_at: new Date().toISOString(),
        };
        createdChunks.push(chunk);
      }
    }

    store.chunks.push(...createdChunks);

    return {
      externalDocumentId: params.documentId,
      batchId: `batch-${Date.now()}`,
      chunkCount: createdChunks.length,
    };
  }

  async getIngestionStatus(_workspaceId: string, _batchId: string): Promise<IngestionStatusResult> {
    return {
      status: 'ready',
      completedAt: new Date().toISOString(),
    };
  }

  async answerQuestion(params: RAGAnswerParams): Promise<GroundedRAGResult> {
    const startTime = Date.now();
    const passages = await retrievePassages(params.question, params.workspaceId, {
      topK: params.topK || 4,
    });

    const generation = await generateGroundedResponse(params.question, passages);

    return {
      answer: generation.answer,
      citations: generation.citations,
      retrievedChunks: passages.map((p) => p.chunk),
      insufficientEvidence: generation.insufficientEvidence,
      provider: this.name,
      queryTimeMs: Date.now() - startTime,
    };
  }

  async deleteIndexedDocument(workspaceId: string, externalDocumentId: string): Promise<void> {
    const store = getStore();
    store.chunks = store.chunks.filter(
      (c) => !(c.document_id === externalDocumentId && c.workspace_id === workspaceId)
    );
  }
}
