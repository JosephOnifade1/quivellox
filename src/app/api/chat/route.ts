import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { requireAuthContext } from '@/server/authorization/authorization-service';
import { getRAGProvider } from '@/server/rag/provider-factory';
import {
  createConversationRecord,
  getConversationWithMessages,
  saveMessagesToConversation,
} from '@/server/db/conversations-repository';
import { recordActivityEvent } from '@/server/db/activity-repository';
import { getStore } from '@/lib/rag-store';
import { Message } from '@/types';

export async function POST(req: NextRequest) {
  // 1. Verify the session — reject unauthenticated callers immediately
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  // 2. Resolve workspace from the authenticated user — never from request body
  const { ctx, errorResponse: ctxError } = await requireAuthContext(user.id);
  if (ctxError) return ctxError;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const question = body.question || body.query;
    let conversationId = typeof body.conversationId === 'string' && body.conversationId.trim().length > 0
      ? body.conversationId.trim()
      : undefined;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Valid question parameter is required' }, { status: 400 });
    }

    // 3. Delegate to active RAG Provider using the verified workspace
    const provider = getRAGProvider();
    const result = await provider.answerQuestion({
      workspaceId: ctx.workspaceId,   // from DB, never from client
      userId: ctx.userId,             // from session, never from client
      question,
      conversationId,
      topK: 4,
    });

    // 4. Persist conversation and messages to Supabase PostgreSQL
    let realConvId = conversationId;

    if (realConvId) {
      // Verify conversation exists and belongs to user
      const existing = await getConversationWithMessages(realConvId, ctx.workspaceId, ctx.userId);
      if (!existing) {
        realConvId = undefined; // Create a fresh one if ID was stale or invalid
      }
    }

    if (!realConvId) {
      const title = question.slice(0, 48) + (question.length > 48 ? '…' : '');
      const newConv = await createConversationRecord({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        title,
      });
      realConvId = newConv?.id || `conv-${crypto.randomUUID()}`;

      await recordActivityEvent({
        workspaceId: ctx.workspaceId,
        actorId: ctx.userId,
        eventType: 'conversation.created',
        resourceType: 'conversation',
        resourceId: realConvId,
        metadata: { title },
      });
    }

    // Persist user question and assistant answer with citations
    try {
      await saveMessagesToConversation(realConvId, [
        {
          role: 'user',
          content: question,
        },
        {
          role: 'assistant',
          content: result.answer,
          citations: result.citations,
        },
      ]);
    } catch (saveErr) {
      console.warn('[ChatRoute] Message persistence warning:', saveErr);
    }

    // Record query activity event
    await recordActivityEvent({
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      eventType: 'query.executed',
      resourceType: 'conversation',
      resourceId: realConvId,
      metadata: {
        question: question.slice(0, 80),
        citation_count: result.citations.length,
        insufficient_evidence: result.insufficientEvidence,
      },
    });

    // Sync in-memory store for dev / fallback
    const store = getStore();
    let conv = store.conversations.find((c) => c.id === realConvId);
    if (!conv) {
      conv = {
        id: realConvId,
        workspace_id: ctx.workspaceId,
        user_id: ctx.userId,
        title: question.slice(0, 48) + (question.length > 48 ? '…' : ''),
        last_message: result.answer.slice(0, 80) + '…',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.conversations.unshift(conv);
      store.messages[realConvId] = [];
    } else {
      conv.last_message = result.answer.slice(0, 80) + '…';
      conv.updated_at = new Date().toISOString();
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      conversation_id: realConvId,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    const assistantMsg: Message = {
      id: `msg-${Date.now()}-a`,
      conversation_id: realConvId,
      role: 'assistant',
      content: result.answer,
      citations: result.citations,
      created_at: new Date().toISOString(),
    };
    if (!store.messages[realConvId]) store.messages[realConvId] = [];
    store.messages[realConvId].push(userMsg, assistantMsg);

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      conversationId: realConvId,
      insufficientEvidence: result.insufficientEvidence,
      provider: result.provider,
      queryTimeMs: result.queryTimeMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Chat API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
