-- =============================================================================
-- QUELLIVOX DATABASE MIGRATION: STORAGE BUCKET & ACTIVITY INSERT POLICIES
-- Ensures private vault storage configuration and activity logging permissions
-- =============================================================================

-- 1. Ensure private 'vault' storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false,
  26214400, -- 25MB ceiling
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400;

-- 2. Storage Policies for private 'vault' bucket
-- Path format: workspaces/{workspace_id}/documents/{document_id}/{filename}

-- Policy: Allow authenticated users to upload files to their workspace directory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated users can upload vault documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload vault documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'vault' AND
      public.has_workspace_access((storage.foldername(name))[2]::uuid)
    );
  END IF;
END $$;

-- Policy: Allow authenticated users to read/download files from their workspace directory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated users can read vault documents'
  ) THEN
    CREATE POLICY "Authenticated users can read vault documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'vault' AND
      public.has_workspace_access((storage.foldername(name))[2]::uuid)
    );
  END IF;
END $$;

-- Policy: Allow authenticated users to delete files from their workspace directory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated users can delete vault documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete vault documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'vault' AND
      public.has_workspace_access((storage.foldername(name))[2]::uuid)
    );
  END IF;
END $$;

-- 3. Activity Events INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_events' AND schemaname = 'public' AND policyname = 'Users can insert activity events into their workspaces'
  ) THEN
    CREATE POLICY "Users can insert activity events into their workspaces"
    ON public.activity_events FOR INSERT
    WITH CHECK (
      public.has_workspace_access(workspace_id) AND auth.uid() = actor_id
    );
  END IF;
END $$;
