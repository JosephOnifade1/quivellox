import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import {
  listConversationsByWorkspace,
  getConversationWithMessages,
  deleteConversationRecord,
} from '@/server/db/conversations-repository';
import { getStore } from '@/lib/rag-store';

export async function GET(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    // 1. Fetch single conversation with messages from Supabase PostgreSQL
    let result = await getConversationWithMessages(id, ctx.workspaceId, ctx.userId);

    // 2. Fallback to in-memory store if DB has no record
    if (!result) {
      const store = getStore();
      const conversation = store.conversations.find((c) => c.id === id);
      if (conversation) {
        if (
          conversation.workspace_id !== ctx.workspaceId ||
          conversation.user_id !== ctx.userId
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = {
          conversation,
          messages: store.messages[id] || [],
        };
      }
    }

    if (!result) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      conversation: result.conversation,
      messages: result.messages,
    });
  }

  // List: retrieve all conversations for this authenticated user and workspace
  let conversations = await listConversationsByWorkspace(ctx.workspaceId, ctx.userId);

  // Fallback to store if DB returns empty
  if (conversations.length === 0) {
    const store = getStore();
    conversations = store.conversations.filter(
      (c) => c.workspace_id === ctx.workspaceId && c.user_id === ctx.userId
    );
  }

  return NextResponse.json({ conversations });
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 });
  }

  // 1. Delete from PostgreSQL
  await deleteConversationRecord(id, ctx.workspaceId, ctx.userId);

  // 2. Remove from local store
  const store = getStore();
  store.conversations = store.conversations.filter((c) => c.id !== id);
  delete store.messages[id];

  return NextResponse.json({ success: true });
}
