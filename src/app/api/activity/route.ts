import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import { listActivityEventsByWorkspace } from '@/server/db/activity-repository';

export async function GET() {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  // Fetch real audit events from Supabase PostgreSQL activity_events table
  // Scoped strictly to this user's verified workspace — never cross-tenant
  const activity = await listActivityEventsByWorkspace(ctx.workspaceId, 100);

  return NextResponse.json({ activity });
}
