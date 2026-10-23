import { DocumentChunk } from '@/types';
import { getEmbeddingProvider } from '../embeddings/provider';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStore } from '@/lib/rag-store';

export interface RetrievedPassage {
  chunk: DocumentChunk;
  score: number;
  documentTitle: string;
  documentIndex: string;
}

export interface RetrievalOptions {
  topK?: number;
  similarityThreshold?: number;
}

/**
 * Executes strictly workspace-scoped vector retrieval
 */
export async function retrievePassages(
  query: string,
  workspaceId: string,
  options: RetrievalOptions = {}
): Promise<RetrievedPassage[]> {
  const topK = options.topK || 4;
  const threshold = options.similarityThreshold || 0.65;

  if (!query || query.trim().length === 0) {
    return [];
  }

  // 1. Generate query embedding
  const embeddingProvider = getEmbeddingProvider();
  const queryEmbedding = await embeddingProvider.generateEmbedding(query);

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    // Call PostgreSQL match function enforcing workspace boundary
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: topK,
      filter_workspace_id: workspaceId,
    });

    if (!error && data) {
      return data.map((item: any) => ({
        chunk: {
          id: item.id,
          document_id: item.document_id,
          workspace_id: item.workspace_id,
          chunk_index: item.chunk_index,
          content: item.content,
          page_number: item.page_number,
          section_title: item.section_title,
          token_count: item.token_count,
          created_at: new Date().toISOString(),
        },
        score: parseFloat(item.similarity.toFixed(3)),
        documentTitle: item.original_filename,
        documentIndex: item.document_index || 'DOC-001',
      }));
    }
  }

  // Local fallback: Filter chunks strictly by workspace_id and ready documents
  const store = getStore();
  const readyDocs = new Map(
    store.documents
      .filter((d) => d.workspace_id === workspaceId && d.status === 'ready')
      .map((d) => [d.id, d])
  );

  const candidates: RetrievedPassage[] = [];
  const queryWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

  for (const chunk of store.chunks) {
    if (chunk.workspace_id !== workspaceId) continue;
    const doc = readyDocs.get(chunk.document_id);
    if (!doc) continue;

    const chunkContentLower = chunk.content.toLowerCase();
    let termMatches = 0;
    for (const word of queryWords) {
      if (chunkContentLower.includes(word)) {
        termMatches++;
      }
    }

    if (termMatches > 0 || chunkContentLower.includes(query.toLowerCase())) {
      const matchRatio = termMatches / Math.max(1, queryWords.length);
      const score = Math.min(0.98, Math.max(0.68, 0.65 + matchRatio * 0.28));
      candidates.push({
        chunk,
        score: parseFloat(score.toFixed(3)),
        documentTitle: doc.original_filename,
        documentIndex: doc.document_index || 'DOC-001',
      });
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK);
}
