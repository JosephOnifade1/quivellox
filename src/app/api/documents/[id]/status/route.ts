import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext, verifyDocumentAccess } from '@/server/authorization/authorization-service';
import { checkDocumentIngestionStatus } from '@/server/ingestion/ingestion-service';
import { getStore } from '@/lib/rag-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  try {
    const { id } = await params;

    // Verify the document belongs to the authenticated user's workspace
    // before disclosing any indexing status
    const store = getStore();
    const doc = store.documents.find((d) => d.id === id);

    if (doc) {
      // Document found in local store — verify workspace match
      if (doc.workspace_id !== ctx.workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Not in local store — check Supabase (verifyDocumentAccess uses DB)
      const hasAccess = await verifyDocumentAccess(user.id, id);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
    }

    const statusInfo = await checkDocumentIngestionStatus(id, ctx.workspaceId);

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
