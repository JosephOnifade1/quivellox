-- =============================================================================
-- QUELLIVOX DATABASE MIGRATION: DIFY RESOURCE MAPPINGS
-- Extends core workspaces and documents with verified Dify identifiers
-- =============================================================================

-- 1. Extend workspaces with Dify Dataset (Knowledge Base) identifier
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS dify_dataset_id TEXT;

-- Index for fast lookup by Dify dataset ID
CREATE INDEX IF NOT EXISTS idx_workspaces_dify_dataset ON public.workspaces(dify_dataset_id);

-- 2. Extend documents with Dify Document ID and Indexing Batch ID
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS dify_document_id TEXT,
ADD COLUMN IF NOT EXISTS dify_batch_id TEXT;

-- Index for resolving Dify document callbacks and citations back to Quellivox documents
CREATE INDEX IF NOT EXISTS idx_documents_dify_document ON public.documents(dify_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_dify_batch ON public.documents(dify_batch_id);

-- Add comments for documentation
COMMENT ON COLUMN public.workspaces.dify_dataset_id IS 'Associated Dify Knowledge Base (Dataset) ID for workspace-isolated RAG';
COMMENT ON COLUMN public.documents.dify_document_id IS 'Dify Document ID inside the associated Dify dataset';
COMMENT ON COLUMN public.documents.dify_batch_id IS 'Dify batch ID for tracking asynchronous file indexing status';
