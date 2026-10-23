import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument, deleteDocumentCascade } from '@/server/ingestion/ingestion-service';
import { getStore } from '@/lib/rag-store';

export async function GET(req: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.toLowerCase() || '';

  let docs = store.documents;
  if (search) {
    docs = docs.filter(
      (d) =>
        d.original_filename.toLowerCase().includes(search) ||
        (d.document_index && d.document_index.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    documents: docs,
    stats: {
      totalDocuments: docs.length,
      totalChunks: store.chunks.length,
      readyDocuments: docs.filter((d) => d.status === 'ready').length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = (formData.get('workspaceId') as string) || 'ws-demo';
    const userId = (formData.get('userId') as string) || 'usr-demo';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await ingestDocument({
      workspaceId,
      userId,
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
      document: createdDoc,
      chunkCount: result.chunkCount,
    });
  } catch (error: any) {
    console.error('Document upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const workspaceId = searchParams.get('workspaceId') || 'ws-demo';

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const result = await deleteDocumentCascade(id, workspaceId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
