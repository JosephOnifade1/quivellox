import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext, verifyConversationAccess } from '@/server/authorization/authorization-service';
import { getStore } from '@/lib/rag-store';

export async function GET(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  const store = getStore();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    // Single conversation: verify ownership before returning messages
    const conversation = store.conversations.find((c) => c.id === id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    // Verify the conversation belongs to the authenticated user's workspace
    if (
      conversation.workspace_id !== ctx.workspaceId ||
      conversation.user_id !== ctx.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const messages = store.messages[id] || [];
    return NextResponse.json({ conversation, messages });
  }

  // List: only return conversations belonging to the authenticated user
  const conversations = store.conversations.filter(
    (c) => c.workspace_id === ctx.workspaceId && c.user_id === ctx.userId
  );
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

  const store = getStore();
  const conversation = store.conversations.find((c) => c.id === id);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Verify ownership before deleting
  if (
    conversation.workspace_id !== ctx.workspaceId ||
    conversation.user_id !== ctx.userId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  store.conversations = store.conversations.filter((c) => c.id !== id);
  delete store.messages[id];

  return NextResponse.json({ success: true });
}
