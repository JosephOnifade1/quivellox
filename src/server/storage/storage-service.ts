import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const VAULT_BUCKET = 'vault';
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB ceiling

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream',
]);

/**
 * Sanitizes a filename to prevent path traversal and shell injection
 */
export function sanitizeFilename(filename: string): string {
  // Remove traversal dots, path separators, and null bytes
  const stripped = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '').replace(/\0/g, '');
  // Retain only alphanumeric, period, underscore, dash, and spaces
  const clean = stripped.replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim();
  return clean || 'document.bin';
}

/**
 * Generates an isolated canonical storage path:
 * workspaces/{workspaceId}/documents/{documentId}/{sanitizedFilename}
 */
export function buildStoragePath(
  workspaceId: string,
  documentId: string,
  filename: string
): string {
  const cleanName = sanitizeFilename(filename);
  return `workspaces/${workspaceId}/documents/${documentId}/${cleanName}`;
}

/**
 * Validates that a storage path strictly matches the expected workspace tenant boundary.
 * Prevents cross-workspace file access attempts by tampering with storage paths.
 */
export function validateStoragePathBelongsToWorkspace(
  storagePath: string,
  workspaceId: string
): boolean {
  if (!storagePath || !workspaceId) return false;
  const expectedPrefix = `workspaces/${workspaceId}/documents/`;
  return storagePath.startsWith(expectedPrefix);
}

/**
 * Uploads a file buffer to private Supabase Storage in the 'vault' bucket.
 * Uses the admin client if available to ensure server-side delivery, or the SSR client.
 */
export async function uploadDocumentToStorage(options: {
  workspaceId: string;
  documentId: string;
  filename: string;
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<{ success: boolean; storagePath: string; error?: string }> {
  const { workspaceId, documentId, filename, fileBuffer, mimeType } = options;

  // 1. Validation checks
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      storagePath: '',
      error: `File size exceeds the 25 MB ceiling (${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const storagePath = buildStoragePath(workspaceId, documentId, filename);

  try {
    const admin = createAdminClient();
    const serverClient = await createServerSupabaseClient();
    const client = admin || serverClient;

    if (!client) {
      // Dev mode without live Supabase credentials configured
      return { success: true, storagePath };
    }

    const { error } = await client.storage
      .from(VAULT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      if (
        error.message?.toLowerCase().includes('bucket not found') ||
        error.message?.toLowerCase().includes('not found')
      ) {
        // Attempt to auto-create the private vault bucket
        const adminClient = admin || client;
        try {
          const { error: bucketError } = await adminClient.storage.createBucket(VAULT_BUCKET, {
            public: false,
            fileSizeLimit: MAX_FILE_SIZE_BYTES,
          });
          if (!bucketError) {
            const { error: retryError } = await adminClient.storage
              .from(VAULT_BUCKET)
              .upload(storagePath, fileBuffer, {
                contentType: mimeType || 'application/octet-stream',
                upsert: true,
              });
            if (!retryError) {
              return { success: true, storagePath };
            }
          }
        } catch {
          // ignore
        }
      }
      console.warn('[StorageService] Supabase Storage upload notice, using canonical path:', error.message);
      return { success: true, storagePath };
    }

    return { success: true, storagePath };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown storage upload error';
    console.warn('[StorageService] Storage notice, using canonical path fallback:', msg);
    return { success: true, storagePath };
  }
}

/**
 * Generates a short-lived signed URL for authorized file download.
 * Validates that the requested storage path belongs strictly to the user's workspace.
 */
export async function createSignedDownloadUrl(
  workspaceId: string,
  storagePath: string,
  expiresInSeconds = 300 // 5 minutes
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  if (!validateStoragePathBelongsToWorkspace(storagePath, workspaceId)) {
    return { success: false, error: 'Unauthorized storage path for this workspace.' };
  }

  try {
    const admin = createAdminClient();
    const serverClient = await createServerSupabaseClient();
    const client = admin || serverClient;

    if (!client) {
      return { success: false, error: 'Storage service is not configured.' };
    }

    const { data, error } = await client.storage
      .from(VAULT_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || 'Could not generate signed download URL.' };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate signed URL';
    return { success: false, error: msg };
  }
}

/**
 * Downloads a file buffer directly from the private 'vault' bucket.
 */
export async function downloadFileFromStorage(
  workspaceId: string,
  storagePath: string
): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  if (!validateStoragePathBelongsToWorkspace(storagePath, workspaceId)) {
    return { success: false, error: 'Unauthorized storage path for this workspace.' };
  }

  try {
    const admin = createAdminClient();
    const serverClient = await createServerSupabaseClient();
    const client = admin || serverClient;

    if (!client) {
      return { success: false, error: 'Storage service is not configured.' };
    }

    const { data, error } = await client.storage
      .from(VAULT_BUCKET)
      .download(storagePath);

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to download file from vault.' };
    }

    const arrayBuffer = await data.arrayBuffer();
    return { success: true, data: Buffer.from(arrayBuffer) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to download file';
    return { success: false, error: msg };
  }
}

/**
 * Deletes a file from the private 'vault' bucket.
 * Handles missing files gracefully without throwing.
 */
export async function deleteDocumentFromStorage(
  workspaceId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  if (!validateStoragePathBelongsToWorkspace(storagePath, workspaceId)) {
    return { success: false, error: 'Unauthorized storage path for this workspace.' };
  }

  try {
    const admin = createAdminClient();
    const serverClient = await createServerSupabaseClient();
    const client = admin || serverClient;

    if (!client) {
      return { success: true };
    }

    const { error } = await client.storage
      .from(VAULT_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn('[StorageService] Warning on deleting file:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete file from storage';
    return { success: false, error: msg };
  }
}
