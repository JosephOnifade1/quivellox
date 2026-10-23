import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import { ingestDocument, deleteDocumentCascade } from '@/server/ingestion/ingestion-service';
import { listDocumentsByWorkspace } from '@/server/db/documents-repository';
import { getStore } from '@/lib/rag-store';

export async function GET(req: NextRequest) {
  // Require authenticated session
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  // Resolve workspace from DB
  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.toLowerCase() || '';

  // 1. Fetch real documents from Supabase PostgreSQL
  let docs = await listDocumentsByWorkspace(ctx.workspaceId, search);

  // 2. If no DB documents exist, check in-memory store (e.g. for mock test suites or initial library)
  if (docs.length === 0) {
    const store = getStore();
    let storeDocs = store.documents.filter((d) => d.workspace_id === ctx.workspaceId);
    if (storeDocs.length === 0) {
      storeDocs = store.documents.filter((d) => d.workspace_id === 'ws-demo');
    }
    if (search) {
      storeDocs = storeDocs.filter(
        (d) =>
          d.original_filename.toLowerCase().includes(search) ||
          (d.document_index && d.document_index.toLowerCase().includes(search))
      );
    }
    docs = storeDocs;
  }

  const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const readyDocuments = docs.filter((d) => d.status === 'ready').length;

  return NextResponse.json({
    documents: docs,
    stats: {
      totalDocuments: docs.length,
      totalChunks,
      readyDocuments,
    },
  });
}

export async function POST(req: NextRequest) {
  // Require authenticated session
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  // Resolve workspace from DB — never from form data
  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await ingestDocument({
      workspaceId: ctx.workspaceId,  // from session/DB, never from form
      userId: ctx.userId,             // from session, never from form
      filename: file.name,
      fileBuffer: arrayBuffer,
      mimeType: file.type,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const store = getStore();
    const createdDoc = store.documents.find((d) => d.id === result.documentId);

    return NextResponse.json({
      success: true,
      document: createdDoc || {
        id: result.documentId,
        status: result.status,
        chunk_count: result.chunkCount,
        storage_path: result.storagePath,
      },
      chunkCount: result.chunkCount,
      batchId: result.batchId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process document';
    console.error('Document upload API error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Require authenticated session
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const result = await deleteDocumentCascade(id, ctx.workspaceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentId: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
