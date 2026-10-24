import { NextResponse } from 'next/server';
import { getStore } from '@/lib/rag-store';
import { getRAGProvider } from '@/server/rag/provider-factory';

export async function GET() {
  const store = getStore();
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const difyConfigured = Boolean(
    process.env.DIFY_DATASET_API_KEY && process.env.DIFY_DATASET_API_KEY.length > 0
  );
  const provider = getRAGProvider();

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      engine: 'Quivellox Grounded RAG v1.0',
      activeRAGProvider: provider.name,
      difyConfigured,
      vectorDimensions: 1536,
      indexedDocuments: store.documents.length,
      indexedChunks: store.chunks.length,
      storageMode: supabaseConfigured ? 'supabase-pgvector' : 'in-memory-local',
      aiProvider: difyConfigured ? 'dify-rag-engine' : 'local-deterministic',
    },
  });
}
