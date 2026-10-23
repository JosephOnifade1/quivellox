import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import { recoverInterruptedJobs } from '@/server/ingestion/ingestion-service';

/**
 * POST /api/jobs/recover
 *
 * Scans active processing documents in the caller's authorized workspace
 * and recovers their status from Dify. Protects against stale states after
 * server restarts or network interruptions.
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const summary = await recoverInterruptedJobs(ctx.workspaceId);

  return NextResponse.json({
    success: true,
    workspaceId: ctx.workspaceId,
    ...summary,
  });
}
