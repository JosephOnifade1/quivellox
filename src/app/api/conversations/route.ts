import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/rag-store';

export async function GET(req: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const conversation = store.conversations.find((c) => c.id === id);
    const messages = store.messages[id] || [];
    return NextResponse.json({ conversation, messages });
  }

  return NextResponse.json({
    conversations: store.conversations,
  });
}

export async function DELETE(req: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 });
  }

  store.conversations = store.conversations.filter((c) => c.id !== id);
  delete store.messages[id];

  return NextResponse.json({ success: true });
}
