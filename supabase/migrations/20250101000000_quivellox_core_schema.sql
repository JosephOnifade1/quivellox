-- =============================================================================
-- QUIVELLOX MASTER DATABASE SCHEMA & MIGRATIONS
-- Comprehensive Multi-Tenant RAG Schema with pgvector, RLS, and Audit Logging
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUMS
CREATE TYPE document_status AS ENUM (
  'queued',
  'extracting',
  'chunking',
  'indexing',
  'ready',
  'failed',
  'deleting'
);

CREATE TYPE ingestion_job_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE message_role AS ENUM (
  'user',
  'assistant',
  'system'
);

CREATE TYPE workspace_role AS ENUM (
  'owner',
  'admin',
  'member'
);

-- =============================================================================
-- 3. CORE TABLES
-- =============================================================================

-- PROFILES: One-to-one with auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Researcher',
  avatar_url TEXT,
  theme_preference TEXT NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- WORKSPACES: Knowledge and security boundary
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Personal Knowledge',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- WORKSPACE MEMBERS: Multi-tenant membership and authorization
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id)
);

-- DOCUMENTS: Private workspace-owned source files
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  checksum TEXT,
  status document_status NOT NULL DEFAULT 'queued',
  page_count INT CHECK (page_count >= 0),
  chunk_count INT NOT NULL DEFAULT 0 CHECK (chunk_count >= 0),
  processing_error TEXT,
  document_index TEXT, -- e.g. DOC-001
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- DOCUMENT CHUNKS: Segmented passages with embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  page_number INT CHECK (page_number >= 1),
  section_title TEXT,
  token_count INT CHECK (token_count >= 0),
  embedding vector(1536), -- Compatible with text-embedding-3-small and standard pgvector
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- CONVERSATIONS: Persisted research sessions
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Research Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- MESSAGES: Dialogue history and verified citations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  citations JSONB, -- Array of validated citations with chunk_id, doc_id, excerpt, page
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- INGESTION JOBS: Durable background tracking & retry ledger
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  status ingestion_job_status NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ACTIVITY EVENTS: Audit ledger for workspace operations
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =============================================================================
-- 4. PERFORMANCE & VECTOR INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);

CREATE INDEX IF NOT EXISTS idx_documents_workspace ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_workspace ON public.document_chunks(workspace_id);

-- HNSW Vector Index for Sub-Millisecond Cosine Similarity Search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
ON public.document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_doc ON public.ingestion_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_activity_events_workspace ON public.activity_events(workspace_id, created_at DESC);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check workspace access
CREATE OR REPLACE FUNCTION public.has_workspace_access(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = ws_id AND w.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = ws_id AND wm.user_id = auth.uid()
  );
$$;

-- PROFILES RLS
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- WORKSPACES RLS
CREATE POLICY "Users can view workspaces they belong to"
ON public.workspaces FOR SELECT
USING (public.has_workspace_access(id));

CREATE POLICY "Users can insert their own workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- WORKSPACE MEMBERS RLS
CREATE POLICY "Members can view membership of their workspaces"
ON public.workspace_members FOR SELECT
USING (public.has_workspace_access(workspace_id));

-- DOCUMENTS RLS
CREATE POLICY "Users can view documents in their workspaces"
ON public.documents FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can insert documents into their workspaces"
ON public.documents FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id) AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update documents in their workspaces"
ON public.documents FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete documents in their workspaces"
ON public.documents FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- DOCUMENT CHUNKS RLS
CREATE POLICY "Users can view chunks in their workspaces"
ON public.document_chunks FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "System can insert chunks for authorized workspaces"
ON public.document_chunks FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "System can delete chunks for authorized workspaces"
ON public.document_chunks FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- CONVERSATIONS RLS
CREATE POLICY "Users can view conversations in their workspaces"
ON public.conversations FOR SELECT
USING (public.has_workspace_access(workspace_id) AND auth.uid() = user_id);

CREATE POLICY "Users can insert conversations into their workspaces"
ON public.conversations FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id) AND auth.uid() = user_id);

CREATE POLICY "Users can update conversations in their workspaces"
ON public.conversations FOR UPDATE
USING (public.has_workspace_access(workspace_id) AND auth.uid() = user_id);

CREATE POLICY "Users can delete conversations in their workspaces"
ON public.conversations FOR DELETE
USING (public.has_workspace_access(workspace_id) AND auth.uid() = user_id);

-- MESSAGES RLS
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid() AND public.has_workspace_access(c.workspace_id)
  )
);

CREATE POLICY "Users can insert messages into their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid() AND public.has_workspace_access(c.workspace_id)
  )
);

-- INGESTION JOBS RLS
CREATE POLICY "Users can view ingestion jobs in their workspaces"
ON public.ingestion_jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id AND public.has_workspace_access(d.workspace_id)
  )
);

-- ACTIVITY EVENTS RLS
CREATE POLICY "Users can view activity events in their workspaces"
ON public.activity_events FOR SELECT
USING (public.has_workspace_access(workspace_id));

-- =============================================================================
-- 6. MATCH DOCUMENT CHUNKS VECTOR RETRIEVAL FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.match_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_workspace_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  workspace_id uuid,
  chunk_index int,
  content text,
  page_number int,
  section_title text,
  token_count int,
  similarity float,
  original_filename text,
  document_index text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Strictly verify the caller is authorized for the requested workspace
  IF NOT public.has_workspace_access(filter_workspace_id) THEN
    RAISE EXCEPTION 'Unauthorized workspace access';
  END IF;

  -- 2. Execute similarity search restricted strictly to the authorized workspace and ready documents
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.workspace_id,
    dc.chunk_index,
    dc.content,
    dc.page_number,
    dc.section_title,
    dc.token_count,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.original_filename,
    d.document_index
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE dc.workspace_id = filter_workspace_id
    AND d.status = 'ready'
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- 7. AUTOMATIC ONBOARDING & PROFILE PROVISIONING TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', 'Research Lead'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Idempotently create exactly one Personal Workspace
  INSERT INTO public.workspaces (name, owner_id, created_at, updated_at)
  VALUES (
    'My Knowledge',
    NEW.id,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_workspace_id;

  -- 3. Add to Workspace Members as Owner
  IF new_workspace_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, created_at)
    VALUES (new_workspace_id, NEW.id, 'owner', NOW())
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
