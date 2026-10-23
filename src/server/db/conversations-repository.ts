import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Conversation, Message, MessageRole, Citation } from '@/types';

async function getDbClient() {
  const ssr = await createServerSupabaseClient();
  if (ssr) return ssr;
  return createAdminClient();
}

export async function createConversationRecord(options: {
  id?: string;
  workspaceId: string;
  userId: string;
  title: string;
}): Promise<Conversation | null> {
  const db = await getDbClient();
  if (!db) return null;

  const row = {
    id: options.id || crypto.randomUUID(),
    workspace_id: options.workspaceId,
    user_id: options.userId,
    title: options.title || 'New Research Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('conversations')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[ConversationsRepo] createConversation error:', error.message);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function listConversationsByWorkspace(
  workspaceId: string,
  userId: string
): Promise<Conversation[]> {
  const db = await getDbClient();
  if (!db) return [];

  const { data, error } = await db
    .from('conversations')
    .select('*, messages(content, created_at)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[ConversationsRepo] listConversations error:', error.message);
    return [];
  }

  return (data || []).map((conv: any) => {
    // Determine last_message from the latest message if not stored on row
    const msgs = conv.messages || [];
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].content : null;
    return {
      id: conv.id,
      workspace_id: conv.workspace_id,
      user_id: conv.user_id,
      title: conv.title,
      last_message: lastMsg ? (lastMsg.length > 90 ? lastMsg.slice(0, 90) + '…' : lastMsg) : null,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    };
  });
}

export async function getConversationWithMessages(
  conversationId: string,
  workspaceId: string,
  userId: string
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const db = await getDbClient();
  if (!db) return null;

  const { data: conv, error: convError } = await db
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (convError || !conv) {
    return null;
  }

  const { data: msgs, error: msgError } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('[ConversationsRepo] fetch messages error:', msgError.message);
    return { conversation: conv as Conversation, messages: [] };
  }

  return {
    conversation: conv as Conversation,
    messages: (msgs || []).map((m: any) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      role: m.role as MessageRole,
      content: m.content,
      citations: m.citations as Citation[] | null,
      created_at: m.created_at,
    })),
  };
}

export async function saveMessagesToConversation(
  conversationId: string,
  messagesToSave: Array<{
    id?: string;
    role: MessageRole;
    content: string;
    citations?: Citation[] | null;
  }>
): Promise<Message[]> {
  const db = await getDbClient();
  if (!db) return [];

  const rows = messagesToSave.map((m) => ({
    id: m.id || crypto.randomUUID(),
    conversation_id: conversationId,
    role: m.role,
    content: m.content,
    citations: m.citations || null,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await db
    .from('messages')
    .insert(rows)
    .select();

  if (error) {
    console.error('[ConversationsRepo] saveMessages error:', error.message);
    throw new Error(`Failed to save messages: ${error.message}`);
  }

  // Touch the conversation updated_at
  await db
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return (data || []) as Message[];
}

export async function deleteConversationRecord(
  conversationId: string,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const db = await getDbClient();
  if (!db) return false;

  const { error } = await db
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    console.error('[ConversationsRepo] deleteConversation error:', error.message);
    return false;
  }

  return true;
}
