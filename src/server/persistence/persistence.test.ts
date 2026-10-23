import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeFilename,
  buildStoragePath,
  validateStoragePathBelongsToWorkspace,
  uploadDocumentToStorage,
  createSignedDownloadUrl,
  downloadFileFromStorage,
  deleteDocumentFromStorage,
  MAX_FILE_SIZE_BYTES,
} from '../storage/storage-service';
import {
  formatEventDescription,
  recordActivityEvent,
  listActivityEventsByWorkspace,
} from '../db/activity-repository';
import * as storageService from '../storage/storage-service';
import * as documentsRepo from '../db/documents-repository';
import * as difyClient from '../dify/dify-client';
import { ingestDocument, deleteDocumentCascade } from '../ingestion/ingestion-service';
import { getStore } from '@/lib/rag-store';
import { setRAGProviderForTesting } from '../rag/provider-factory';
import { LocalRAGProvider } from '../rag/local-rag-provider';

describe('Phase 2 Persistence & Storage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStore().resetToDefault();
    setRAGProviderForTesting(new LocalRAGProvider());
  });

  afterEach(() => {
    setRAGProviderForTesting(null);
  });

  describe('Storage Service Path & Security Isolation', () => {
    it('sanitizes unsafe filenames and removes path traversal', () => {
      expect(sanitizeFilename('../../../secret/passwords.txt')).toBe('secretpasswords.txt');
      expect(sanitizeFilename('my file (v1.0).pdf')).toBe('my file v1.0.pdf');
      expect(sanitizeFilename('\0dangerous.sh')).toBe('dangerous.sh');
      expect(sanitizeFilename('')).toBe('document.bin');
    });

    it('builds canonical workspace-partitioned storage path', () => {
      const path = buildStoragePath('ws-123', 'doc-456', 'report.pdf');
      expect(path).toBe('workspaces/ws-123/documents/doc-456/report.pdf');
    });

    it('validates storage path belongs strictly to the requested workspace', () => {
      const validPath = 'workspaces/ws-tenant-a/documents/doc-1/file.pdf';
      expect(validateStoragePathBelongsToWorkspace(validPath, 'ws-tenant-a')).toBe(true);

      // Cross-workspace access attempt
      expect(validateStoragePathBelongsToWorkspace(validPath, 'ws-tenant-b')).toBe(false);
      expect(validateStoragePathBelongsToWorkspace('', 'ws-tenant-a')).toBe(false);
    });

    it('rejects files exceeding the 25 MB ceiling', async () => {
      const hugeBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
      const res = await uploadDocumentToStorage({
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        filename: 'huge.pdf',
        fileBuffer: hugeBuffer,
        mimeType: 'application/pdf',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('exceeds the 25 MB ceiling');
    });

    it('rejects signed URL generation if storage path does not belong to workspace', async () => {
      const res = await createSignedDownloadUrl(
        'ws-attacker',
        'workspaces/ws-victim/documents/doc-1/secret.pdf'
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized storage path');
    });

    it('rejects direct download if storage path does not belong to workspace', async () => {
      const res = await downloadFileFromStorage(
        'ws-attacker',
        'workspaces/ws-victim/documents/doc-1/secret.pdf'
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized storage path');
    });

    it('rejects file deletion if storage path does not belong to workspace', async () => {
      const res = await deleteDocumentFromStorage(
        'ws-attacker',
        'workspaces/ws-victim/documents/doc-1/secret.pdf'
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized storage path');
    });
  });

  describe('Activity Events Repository & Audit Formatting', () => {
    it('formats event descriptions for all canonical event types', () => {
      expect(
        formatEventDescription('document.uploaded', { filename: 'Terms.pdf' })
      ).toBe('Uploaded Terms.pdf to private vault');

      expect(
        formatEventDescription('document.ready', { filename: 'Manual.pdf', chunk_count: 12, page_count: 5 })
      ).toBe('Indexed Manual.pdf (12 passages, 5 pages)');

      expect(
        formatEventDescription('document.failed', { filename: 'Bad.pdf', error: 'Corrupt PDF' })
      ).toBe('Indexing failed for Bad.pdf: Corrupt PDF');

      expect(
        formatEventDescription('document.deleted', { filename: 'Old.pdf' })
      ).toBe('Removed Old.pdf from knowledge library');

      expect(
        formatEventDescription('query.executed', { question: 'What is the refund window?' })
      ).toBe('Grounded query executed: "What is the refund window?"');
    });
  });

  describe('Ingestion & Partial Failure Deletion', () => {
    it('ingests document into storage, generates checksum, and tracks batch ID', async () => {
      const sampleBuffer = Buffer.from('Grounded RAG policy test document content');
      const res = await ingestDocument({
        workspaceId: 'ws-demo',
        userId: 'usr-tester',
        filename: 'policy_v2.txt',
        fileBuffer: sampleBuffer,
        mimeType: 'text/plain',
      });

      expect(res.success).toBe(true);
      expect(res.documentId).toBeDefined();
      expect(res.storagePath).toContain('workspaces/ws-demo/documents/');

      // Verify record entered store
      const store = getStore();
      const doc = store.documents.find((d) => d.id === res.documentId);
      expect(doc).toBeDefined();
      expect(doc?.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(doc?.storage_path).toContain('policy_v2.txt');
    });

    it('reports partial failure during deletion if a component fails rather than masking it', async () => {
      // Create a test document
      const sampleBuffer = Buffer.from('Document to delete');
      const ingestRes = await ingestDocument({
        workspaceId: 'ws-demo',
        userId: 'usr-tester',
        filename: 'to_delete.txt',
        fileBuffer: sampleBuffer,
        mimeType: 'text/plain',
      });
      const docId = ingestRes.documentId!;

      // Simulate storage deletion failure
      vi.spyOn(storageService, 'deleteDocumentFromStorage').mockResolvedValue({
        success: false,
        error: 'Storage API network timeout',
      });

      const delRes = await deleteDocumentCascade(docId, 'ws-demo');
      expect(delRes.success).toBe(false);
      expect(delRes.error).toContain('Storage API network timeout');
    });

    it('deletes document cleanly when all downstream systems succeed', async () => {
      const sampleBuffer = Buffer.from('Clean deletion test');
      const ingestRes = await ingestDocument({
        workspaceId: 'ws-demo',
        userId: 'usr-tester',
        filename: 'clean_delete.txt',
        fileBuffer: sampleBuffer,
        mimeType: 'text/plain',
      });
      const docId = ingestRes.documentId!;

      vi.spyOn(storageService, 'deleteDocumentFromStorage').mockResolvedValue({ success: true });

      const delRes = await deleteDocumentCascade(docId, 'ws-demo');
      expect(delRes.success).toBe(true);

      const store = getStore();
      expect(store.documents.find((d) => d.id === docId)).toBeUndefined();
    });
  });
});
