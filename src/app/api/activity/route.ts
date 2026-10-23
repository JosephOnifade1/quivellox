import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import { getStore } from '@/lib/rag-store';

export async function GET() {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const store = getStore();

  // Only return activity events belonging to the authenticated workspace
  const activity = store.activity.filter(
    (a) => !('workspace_id' in a) || (a as any).workspace_id === ctx.workspaceId
  );

  return NextResponse.json({ activity });
}
