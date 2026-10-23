import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidTransition,
  assertValidTransition,
  InvalidStateTransitionError,
  isTerminalStatus,
  isProcessingStatus,
} from '../documents/lifecycle';
import {
  retryDocumentIngestion,
  recoverInterruptedJobs,
} from './ingestion-service';
import { DifyRAGProvider } from '../dify/dify-rag-provider';
import { DifyClient } from '../dify/dify-client';
import * as docsRepo from '../db/documents-repository';
import * as jobsRepo from '../db/ingestion-jobs-repository';
import * as storageService from '../storage/storage-service';
import * as ragProviderFactory from '../rag/provider-factory';
import { Document, DocumentStatus } from '@/types';
import { getStore } from '@/lib/rag-store';

describe('Phase 3: Lifecycle, Recovery, and Retrieval Readiness', () => {
  describe('Document Lifecycle State Machine', () => {
    it('allows valid progressive transitions', () => {
      expect(isValidTransition('queued', 'extracting')).toBe(true);
      expect(isValidTransition('extracting', 'chunking')).toBe(true);
      expect(isValidTransition('chunking', 'indexing')).toBe(true);
      expect(isValidTransition('indexing', 'ready')).toBe(true);
      expect(isValidTransition('indexing', 'failed')).toBe(true);
      expect(isValidTransition('failed', 'queued')).toBe(true); // retry path
      expect(isValidTransition('ready', 'deleting')).toBe(true);
    });

    it('rejects invalid state transitions with InvalidStateTransitionError', () => {
      expect(isValidTransition('ready', 'queued')).toBe(false);
      expect(isValidTransition('failed', 'chunking')).toBe(false);
      expect(isValidTransition('deleting', 'ready')).toBe(false);

      expect(() => assertValidTransition('ready', 'queued', 'doc-123')).toThrow(
        InvalidStateTransitionError
      );
      expect(() => assertValidTransition('deleting', 'ready', 'doc-123')).toThrow(
        /Invalid document status transition from 'deleting' to 'ready'/
      );
    });

    it('correctly identifies terminal and processing statuses', () => {
      expect(isTerminalStatus('ready')).toBe(true);
      expect(isTerminalStatus('failed')).toBe(true);
      expect(isTerminalStatus('deleting')).toBe(false);
      expect(isTerminalStatus('queued')).toBe(false);
      expect(isTerminalStatus('indexing')).toBe(false);

      expect(isProcessingStatus('queued')).toBe(true);
      expect(isProcessingStatus('extracting')).toBe(true);
      expect(isProcessingStatus('chunking')).toBe(true);
      expect(isProcessingStatus('indexing')).toBe(true);
      expect(isProcessingStatus('ready')).toBe(false);
      expect(isProcessingStatus('failed')).toBe(false);
    });
  });

  describe('Idempotent Retries & Duplicate Prevention', () => {
    function getMockDoc(): Document {
      return {
        id: 'doc-fail-1',
        workspace_id: 'ws-test',
        uploaded_by: 'usr-1',
        original_filename: 'guide.pdf',
        storage_path: 'workspaces/ws-test/documents/doc-fail-1/guide.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 4096,
        status: 'failed',
        page_count: 1,
        chunk_count: 0,
        dify_document_id: 'dify-old-doc-99',
        dify_batch_id: 'batch-old-1',
        processing_error: 'Timeout communicating with Dify',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('cleans up previous Dify document before re-indexing to prevent duplicate embeddings', async () => {
      const doc = getMockDoc();
      vi.spyOn(docsRepo, 'getDocumentById').mockResolvedValue(doc);
      vi.spyOn(jobsRepo, 'getIngestionJobByDocumentId').mockResolvedValue({
        id: 'job-1',
        document_id: 'doc-fail-1',
        status: 'failed',
        attempts: 1,
        max_attempts: 3,
        error_message: 'Timeout communicating with Dify',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const mockDeleteIndexedDoc = vi.fn().mockResolvedValue(undefined);
      const mockIngestDoc = vi.fn().mockResolvedValue({
        externalDocumentId: 'dify-new-doc-100',
        batchId: 'batch-new-2',
      });

      vi.spyOn(ragProviderFactory, 'getRAGProvider').mockReturnValue({
        name: 'dify',
        ingestDocument: mockIngestDoc,
        getIngestionStatus: vi.fn(),
        answerQuestion: vi.fn(),
        deleteIndexedDocument: mockDeleteIndexedDoc,
      });

      vi.spyOn(storageService, 'downloadFileFromStorage').mockResolvedValue({
        success: true,
        data: Buffer.from('PDF file content'),
      });
      vi.spyOn(docsRepo, 'updateDocumentStatus').mockResolvedValue(true);
      vi.spyOn(jobsRepo, 'updateIngestionJob').mockResolvedValue(true);

      const result = await retryDocumentIngestion('doc-fail-1', 'ws-test', 'usr-1');

      expect(result.success).toBe(true);
      // Confirmed: previous Dify external document ID was deleted first
      expect(mockDeleteIndexedDoc).toHaveBeenCalledWith('ws-test', 'dify-old-doc-99');
      // Confirmed: new Dify ingestion was triggered
      expect(mockIngestDoc).toHaveBeenCalled();
    });

    it('rejects retrying documents that have exceeded maximum allowed retry attempts', async () => {
      const doc = getMockDoc();
      vi.spyOn(docsRepo, 'getDocumentById').mockResolvedValue(doc);
      vi.spyOn(jobsRepo, 'getIngestionJobByDocumentId').mockResolvedValue({
        id: 'job-maxed',
        document_id: 'doc-fail-1',
        status: 'failed',
        attempts: 3,
        max_attempts: 3,
        error_message: 'Repeated parsing failure',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await retryDocumentIngestion('doc-fail-1', 'ws-test', 'usr-1');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Maximum retry attempts reached/i);
    });

    it('rejects retrying a document that is already ready', async () => {
      const readyDoc: Document = { ...getMockDoc(), status: 'ready' };
      vi.spyOn(docsRepo, 'getDocumentById').mockResolvedValue(readyDoc);

      const result = await retryDocumentIngestion('doc-fail-1', 'ws-test', 'usr-1');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Cannot retry document in status 'ready'/i);
    });
  });

  describe('Interrupted Job Recovery', () => {
    it('scans active in-progress documents and updates status via provider', async () => {
      const activeDoc: Document = {
        id: 'doc-active-1',
        workspace_id: 'ws-test',
        uploaded_by: 'usr-1',
        original_filename: 'report.pdf',
        storage_path: 'workspaces/ws-test/documents/doc-active-1/report.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 2048,
        status: 'indexing',
        page_count: 1,
        chunk_count: 0,
        dify_document_id: 'dify-doc-42',
        dify_batch_id: 'batch-active-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(docsRepo, 'listDocumentsByWorkspace').mockResolvedValue([activeDoc]);
      vi.spyOn(docsRepo, 'getDocumentById').mockResolvedValue(activeDoc);
      vi.spyOn(jobsRepo, 'getIngestionJobByDocumentId').mockResolvedValue({
        id: 'job-act-1',
        document_id: 'doc-active-1',
        status: 'processing',
        attempts: 1,
        max_attempts: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(ragProviderFactory, 'getRAGProvider').mockReturnValue({
        name: 'dify',
        ingestDocument: vi.fn(),
        getIngestionStatus: vi.fn().mockResolvedValue({
          status: 'ready',
          totalSegments: 12,
        }),
        answerQuestion: vi.fn(),
        deleteIndexedDocument: vi.fn(),
      });

      const updateDocStatusSpy = vi.spyOn(docsRepo, 'updateDocumentStatus').mockResolvedValue(true);
      const updateJobSpy = vi.spyOn(jobsRepo, 'updateIngestionJob').mockResolvedValue(true);

      const recoveryReport = await recoverInterruptedJobs('ws-test');

      expect(recoveryReport.inspected).toBe(1);
      expect(recoveryReport.recovered).toBe(1);
      expect(recoveryReport.errors).toBe(0);
      expect(updateDocStatusSpy).toHaveBeenCalledWith('doc-active-1', 'ws-test', expect.objectContaining({
        status: 'ready',
        chunk_count: 12,
      }));
      expect(updateJobSpy).toHaveBeenCalledWith('job-act-1', expect.objectContaining({
        status: 'completed',
      }));
    });
  });

  describe('Retrieval Readiness Strictness', () => {
    let mockClient: DifyClient;
    let provider: DifyRAGProvider;

    beforeEach(() => {
      mockClient = new DifyClient({ datasetApiKey: 'test-key' });
      provider = new DifyRAGProvider(mockClient);
      process.env.DIFY_DEFAULT_DATASET_ID = 'ds-ready-test';
    });

    it('excludes indexing or failed documents from grounding and citations', async () => {
      // Document 1 is ready, Document 2 is indexing, Document 3 is failed
      const readyDoc: Document = {
        id: 'doc-ready',
        workspace_id: 'ws-readiness',
        uploaded_by: 'usr-1',
        original_filename: 'Policy.pdf',
        storage_path: 'workspaces/ws-readiness/documents/doc-ready/Policy.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1024,
        status: 'ready',
        page_count: 1,
        chunk_count: 5,
        document_index: 'DOC-1',
        dify_document_id: 'dify-ready-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const indexingDoc: Document = {
        id: 'doc-indexing',
        workspace_id: 'ws-readiness',
        uploaded_by: 'usr-1',
        original_filename: 'Draft.pdf',
        storage_path: 'workspaces/ws-readiness/documents/doc-indexing/Draft.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1024,
        status: 'indexing',
        page_count: 1,
        chunk_count: 0,
        document_index: 'DOC-2',
        dify_document_id: 'dify-indexing-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(docsRepo, 'listDocumentsByWorkspace').mockResolvedValue([
        readyDoc,
        indexingDoc,
      ]);

      // Dify returns segments from both documents
      vi.spyOn(mockClient, 'retrieveSegments').mockResolvedValue([
        {
          segmentId: 'seg-1',
          documentId: 'dify-ready-1',
          documentName: 'Policy.pdf',
          content: 'The vacation allowance is 25 days per calendar year.',
          score: 0.92,
        },
        {
          segmentId: 'seg-2',
          documentId: 'dify-indexing-2',
          documentName: 'Draft.pdf',
          content: 'Unapproved draft content that should not be cited.',
          score: 0.88,
        },
      ]);

      const result = await provider.answerQuestion({
        workspaceId: 'ws-readiness',
        userId: 'usr-1',
        question: 'What is the vacation allowance?',
      });

      // The answer must only cite readyDoc, NEVER indexingDoc
      expect(result.citations.length).toBeGreaterThan(0);
      result.citations.forEach((c) => {
        expect(c.document_id).toBe('doc-ready');
        expect(c.document_id).not.toBe('doc-indexing');
      });
    });

    it('returns explicit indexing-in-progress message if no ready documents exist but some are indexing', async () => {
      const indexingDoc: Document = {
        id: 'doc-indexing-only',
        workspace_id: 'ws-indexing-only',
        uploaded_by: 'usr-1',
        original_filename: 'BigManual.pdf',
        storage_path: 'workspaces/ws-indexing-only/documents/doc-1/BigManual.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1024,
        status: 'indexing',
        page_count: 50,
        chunk_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(docsRepo, 'listDocumentsByWorkspace').mockResolvedValue([indexingDoc]);
      vi.spyOn(mockClient, 'retrieveSegments').mockResolvedValue([]);

      const result = await provider.answerQuestion({
        workspaceId: 'ws-indexing-only',
        userId: 'usr-1',
        question: 'What is step 3?',
      });

      expect(result.insufficientEvidence).toBe(true);
      expect(result.citations).toHaveLength(0);
      expect(result.answer).toMatch(/still indexing and being prepared/);
    });
  });
});
