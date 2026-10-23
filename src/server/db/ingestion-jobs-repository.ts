import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type IngestionJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IngestionJobRecord {
  id: string;
  document_id: string;
  status: IngestionJobStatus;
  attempts: number;
  max_attempts: number;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

async function getDbClient() {
  const ssr = await createServerSupabaseClient();
  if (ssr) return ssr;
  return createAdminClient();
}

export async function createIngestionJob(options: {
  documentId: string;
  maxAttempts?: number;
}): Promise<IngestionJobRecord | null> {
  const db = await getDbClient();
  if (!db) return null;

  const row = {
    id: crypto.randomUUID(),
    document_id: options.documentId,
    status: 'pending' as IngestionJobStatus,
    attempts: 0,
    max_attempts: options.maxAttempts || 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('ingestion_jobs')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.warn('[IngestionJobsRepo] createIngestionJob warning:', error.message);
    return null;
  }

  return data as IngestionJobRecord;
}

export async function getIngestionJobByDocumentId(
  documentId: string
): Promise<IngestionJobRecord | null> {
  const db = await getDbClient();
  if (!db) return null;

  const { data, error } = await db
    .from('ingestion_jobs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[IngestionJobsRepo] getIngestionJobByDocumentId warning:', error.message);
    return null;
  }

  return data as IngestionJobRecord | null;
}

export async function updateIngestionJob(
  jobId: string,
  updates: {
    status?: IngestionJobStatus;
    attempts?: number;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
  }
): Promise<boolean> {
  const db = await getDbClient();
  if (!db) return false;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.attempts !== undefined) payload.attempts = updates.attempts;
  if (updates.error_message !== undefined) payload.error_message = updates.error_message;
  if (updates.started_at !== undefined) payload.started_at = updates.started_at;
  if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at;

  const { error } = await db
    .from('ingestion_jobs')
    .update(payload)
    .eq('id', jobId);

  if (error) {
    console.warn('[IngestionJobsRepo] updateIngestionJob warning:', error.message);
    return false;
  }

  return true;
}

export async function listStaleOrPendingJobs(
  maxAgeMinutes = 15
): Promise<IngestionJobRecord[]> {
  const db = await getDbClient();
  if (!db) return [];

  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

  // Find jobs that are 'pending' or stuck in 'processing' created before cutoff
  const { data, error } = await db
    .from('ingestion_jobs')
    .select('*')
    .in('status', ['pending', 'processing'])
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[IngestionJobsRepo] listStaleOrPendingJobs error:', error.message);
    return [];
  }

  return (data || []) as IngestionJobRecord[];
}
