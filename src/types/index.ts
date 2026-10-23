export type DocumentStatus =
  | 'queued'
  | 'extracting'
  | 'chunking'
  | 'indexing'
  | 'ready'
  | 'failed'
  | 'deleting';

export type FileType = 'pdf' | 'txt' | 'markdown' | 'doc';

export interface Document {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  checksum?: string | null;
  status: DocumentStatus;
  page_count?: number | null;
  chunk_count: number;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
  document_index?: string; // e.g. DOC-001
  dify_document_id?: string | null;
  dify_batch_id?: string | null;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  workspace_id: string;
  chunk_index: number;
  content: string;
  page_number?: number | null;
  section_title?: string | null;
  token_count?: number | null;
  embedding?: number[] | null;
  similarity?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Citation {
  chunk_id: string;
  document_id: string;
  document_name: string;
  quote: string;
  page_number?: number | null;
  section_title?: string | null;
  similarity?: number | null;
  document_index?: string; // e.g. DOC-001
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[] | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  last_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  dify_dataset_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export type ActivityEventType =
  | 'document.uploaded'
  | 'document.extraction_started'
  | 'document.chunking_started'
  | 'document.indexing_started'
  | 'document.ready'
  | 'document.failed'
  | 'document.deleted'
  | 'conversation.created'
  | 'query.executed'
  | 'workspace.updated';

export interface ActivityEvent {
  id: string;
  workspace_id: string;
  actor_id: string;
  actor_name?: string;
  event_type: ActivityEventType;
  resource_type: 'document' | 'conversation' | 'workspace';
  resource_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RAGAnswerResult {
  answer: string;
  citations: Citation[];
  retrieved_chunks: DocumentChunk[];
  insufficient_evidence: boolean;
  query_time_ms: number;
}
