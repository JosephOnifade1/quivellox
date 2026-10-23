import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext, verifyDocumentAccess } from '@/server/authorization/authorization-service';
import { retryDocumentIngestion } from '@/server/ingestion/ingestion-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate caller
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  // 2. Resolve workspace
  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const { id } = await params;

  // 3. Verify tenant ownership
  const hasAccess = await verifyDocumentAccess(user.id, id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden or document not found' }, { status: 403 });
  }

  // 4. Execute idempotent bounded retry
  const result = await retryDocumentIngestion(id, ctx.workspaceId, ctx.userId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    document: result.document,
  });
}
