import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/rag-store';
import { Document, DocumentChunk } from '@/types';

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    documents: store.documents,
    stats: {
      totalDocuments: store.documents.length,
      totalChunks: store.chunks.length,
      readyDocuments: store.documents.filter((d) => d.status === 'ready').length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const store = getStore();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name;
    const fileSize = file.size;
    const mimeType = file.type || 'text/plain';
    const textContent = await file.text();

    const docIndexNum = store.documents.length + 1;
    const docIndex = `DOC-00${docIndexNum}`;
    const docId = `doc-${Date.now()}`;

    // Simple chunking into segments
    const rawChunks = textContent
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 30);

    const chunkList: DocumentChunk[] = [];

    if (rawChunks.length === 0) {
      // Single chunk fallback
      chunkList.push({
        id: `chk-${Date.now()}-0`,
        document_id: docId,
        workspace_id: 'ws-demo',
        chunk_index: 0,
        page_number: 1,
        section_title: 'Overview',
        content: textContent.trim() || 'Uploaded document content',
        token_count: Math.ceil(textContent.length / 4),
        created_at: new Date().toISOString(),
      });
    } else {
      rawChunks.forEach((block, idx) => {
        chunkList.push({
          id: `chk-${Date.now()}-${idx}`,
          document_id: docId,
          workspace_id: 'ws-demo',
          chunk_index: idx,
          page_number: Math.floor(idx / 2) + 1,
          section_title: `Section ${idx + 1}`,
          content: block.trim(),
          token_count: Math.ceil(block.length / 4),
          created_at: new Date().toISOString(),
        });
      });
    }

    const newDoc: Document = {
      id: docId,
      workspace_id: 'ws-demo',
      uploaded_by: 'usr-demo',
      original_filename: filename,
      storage_path: `/vault/docs/${filename}`,
      mime_type: mimeType,
      file_size_bytes: fileSize,
      checksum: `sha256:${Math.random().toString(16).substring(2, 12)}`,
      status: 'ready',
      page_count: Math.max(1, Math.ceil(chunkList.length / 2)),
      chunk_count: chunkList.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_index: docIndex,
    };

    store.addDocument(newDoc, chunkList);

    return NextResponse.json({
      success: true,
      document: newDoc,
      chunkCount: chunkList.length,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process and index document' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const store = getStore();
    store.deleteDocument(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
