import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge, generateGroundedAnswer } from '@/lib/retriever';
import { getStore } from '@/lib/rag-store';
import { Message } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { question, conversationId } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question parameter is required' }, { status: 400 });
    }

    const store = getStore();

    // 1. Search knowledge chunks
    const matches = searchKnowledge(question, 4);

    // 2. Synthesize grounded response
    const { answer, citations } = generateGroundedAnswer(question, matches);

    // 3. Conversation management
    const convId = conversationId || `conv-${Date.now()}`;
    let conv = store.conversations.find((c) => c.id === convId);

    if (!conv) {
      conv = {
        id: convId,
        workspace_id: 'ws-demo',
        user_id: 'usr-demo',
        title: question.slice(0, 45) + (question.length > 45 ? '…' : ''),
        last_message: answer.slice(0, 80) + '…',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.conversations.unshift(conv);
      store.messages[convId] = [];
    } else {
      conv.last_message = answer.slice(0, 80) + '…';
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
      content: answer,
      citations,
      created_at: new Date().toISOString(),
    };

    if (!store.messages[convId]) {
      store.messages[convId] = [];
    }
    store.messages[convId].push(userMsg, assistantMsg);

    // Record activity
    store.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'query.executed' as any,
      description: `Queried: "${question.slice(0, 50)}${question.length > 50 ? '…' : ''}" (${citations.length} sources cited)`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      answer,
      citations,
      conversationId: convId,
      retrievedCount: matches.length,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
