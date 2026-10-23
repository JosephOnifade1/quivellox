import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/rag-store';
import { deleteDocumentCascade } from '@/server/ingestion/ingestion-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const chunks = store.chunks.filter((c) => c.document_id === id);

  return NextResponse.json({
    document: doc,
    chunks,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-demo';

    const result = await deleteDocumentCascade(id, workspaceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Deletion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

