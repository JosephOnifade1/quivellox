import { NextRequest, NextResponse } from 'next/server';
import { getRAGProvider } from '@/server/rag/provider-factory';
import { getStore } from '@/lib/rag-store';
import { Message } from '@/types';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const question = body.question || body.query;
    const conversationId = body.conversationId;
    const workspaceId = body.workspaceId || 'ws-demo';
    const userId = body.userId || 'usr-demo';

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Valid question parameter is required' }, { status: 400 });
    }

    // 1. Delegate to active RAG Provider (Dify or Local)
    const provider = getRAGProvider();
    const result = await provider.answerQuestion({
      workspaceId,
      userId,
      question,
      conversationId,
      topK: 4,
    });

    // 2. Persist dialogue history in Quellivox system of record
    const store = getStore();
    const convId = conversationId || `conv-${Date.now()}`;
    let conv = store.conversations.find((c) => c.id === convId);

    if (!conv) {
      conv = {
        id: convId,
        workspace_id: workspaceId,
        user_id: userId,
        title: question.slice(0, 48) + (question.length > 48 ? '…' : ''),
        last_message: result.answer.slice(0, 80) + '…',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.conversations.unshift(conv);
      store.messages[convId] = [];
    } else {
      conv.last_message = result.answer.slice(0, 80) + '…';
      conv.updated_at = new Date().toISOString();
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      conversation_id: convId,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    const assistantMsg: Message = {
      id: `msg-${Date.now()}-a`,
      conversation_id: convId,
      role: 'assistant',
      content: result.answer,
      citations: result.citations,
      created_at: new Date().toISOString(),
    };

    if (!store.messages[convId]) {
      store.messages[convId] = [];
    }
    store.messages[convId].push(userMsg, assistantMsg);

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      conversationId: convId,
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
