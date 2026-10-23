import { NextRequest, NextResponse } from 'next/server';
import { checkDocumentIngestionStatus } from '@/server/ingestion/ingestion-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-demo';

    const statusInfo = await checkDocumentIngestionStatus(id, workspaceId);

    return NextResponse.json({
      success: true,
      documentId: id,
      ...statusInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve document status';
    return NextResponse.json(
      { success: false, error: message },
      { status: message === 'Document not found' ? 404 : 500 }
    );
  }
}
