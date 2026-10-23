import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext, verifyDocumentAccess } from '@/server/authorization/authorization-service';
import { getStore } from '@/lib/rag-store';
import { deleteDocumentCascade } from '@/server/ingestion/ingestion-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const { id } = await params;
  const store = getStore();

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Verify the document belongs to the authenticated user's workspace
  if (doc.workspace_id !== ctx.workspaceId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const chunks = store.chunks.filter((c) => c.document_id === id);

  return NextResponse.json({ document: doc, chunks });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  try {
    const { id } = await params;

    // Verify ownership before deleting — document ID alone is not sufficient
    const hasAccess = await verifyDocumentAccess(user.id, id);

    // Also check the in-memory store for workspace match (Supabase may not
    // have the document if it was only added to the local store)
    const store = getStore();
    const doc = store.documents.find((d) => d.id === id);
    if (doc && doc.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If Supabase is configured and access check failed, deny
    if (!hasAccess && doc === undefined) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const result = await deleteDocumentCascade(id, ctx.workspaceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Deletion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
