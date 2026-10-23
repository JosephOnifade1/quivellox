import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import {
  getWorkspaceById,
  updateWorkspaceRecord,
  getWorkspaceMemberCount,
} from '@/server/db/workspaces-repository';
import { recordActivityEvent } from '@/server/db/activity-repository';
import { getStore } from '@/lib/rag-store';

export async function GET() {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  // 1. Fetch workspace from database
  let workspace = await getWorkspaceById(ctx.workspaceId);
  let memberCount = await getWorkspaceMemberCount(ctx.workspaceId);

  // 2. Fallback to store if DB has no record
  if (!workspace) {
    const store = getStore();
    const found = store.workspaces.find((w) => w.id === ctx.workspaceId);
    if (found) {
      workspace = found;
      memberCount = 1;
    }
  }

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    ownerId: workspace.owner_id,
    isOwner: ctx.isOwner,
    role: ctx.isOwner ? 'owner' : 'member',
    difyDatasetId: workspace.dify_dataset_id || null,
    memberCount,
    createdAt: workspace.created_at,
    updatedAt: workspace.updated_at,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  // Enforce workspace owner authorization for sensitive configuration
  if (!ctx.isOwner) {
    return NextResponse.json(
      { error: 'Only workspace owners can modify workspace configuration.' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { name, difyDatasetId } = body;

  // Server-side validation
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name cannot be empty.' }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Workspace name must be 100 characters or fewer.' }, { status: 400 });
    }
  }

  try {
    // 1. Update persistent PostgreSQL record
    let updated = await updateWorkspaceRecord(ctx.workspaceId, {
      name: name !== undefined ? name.trim() : undefined,
      dify_dataset_id: difyDatasetId !== undefined ? difyDatasetId : undefined,
    });

    // 2. Fallback / sync in-memory store
    const store = getStore();
    const wsInStore = store.workspaces.find((w) => w.id === ctx.workspaceId);
    if (wsInStore) {
      if (name !== undefined) wsInStore.name = name.trim();
      if (difyDatasetId !== undefined) wsInStore.dify_dataset_id = difyDatasetId || null;
      wsInStore.updated_at = new Date().toISOString();
      if (!updated) updated = wsInStore;
    }

    // 3. Emit persistent activity audit event
    await recordActivityEvent({
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      eventType: 'workspace.updated',
      resourceType: 'workspace',
      resourceId: ctx.workspaceId,
      metadata: {
        updated_fields: Object.keys(body).filter((k) => body[k] !== undefined),
        name: name ? name.trim() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: updated?.id || ctx.workspaceId,
        name: updated?.name || name?.trim(),
        difyDatasetId: updated?.dify_dataset_id || null,
        updatedAt: updated?.updated_at || new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update workspace configuration';
    console.error('[WorkspaceRoute] PATCH error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
