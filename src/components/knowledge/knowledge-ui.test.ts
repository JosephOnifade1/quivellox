import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatMimeType,
  formatArchivalDate,
  formatArchivalDateTime,
  filterDocuments,
  sortDocuments,
  areAllSelected,
  isIndeterminate,
} from './knowledge-utils';
import { Document } from '@/types';

const SAMPLE_DOCS: Document[] = [
  {
    id: 'doc-1',
    workspace_id: 'ws-1',
    uploaded_by: 'user-1',
    original_filename: 'Security_Audit_2025.pdf',
    storage_path: 'vault/ws-1/doc-1/Security_Audit_2025.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 204800, // 200 KB
    checksum: 'sha256:abcd1234',
    status: 'ready',
    page_count: 12,
    chunk_count: 34,
    processing_error: null,
    document_index: 'DOC-001',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:05:00Z',
  },
  {
    id: 'doc-2',
    workspace_id: 'ws-1',
    uploaded_by: 'user-1',
    original_filename: 'API_Architecture_Spec.md',
    storage_path: 'vault/ws-1/doc-2/API_Architecture_Spec.md',
    mime_type: 'text/markdown',
    file_size_bytes: 15360, // 15 KB
    checksum: 'sha256:efgh5678',
    status: 'indexing',
    page_count: 3,
    chunk_count: 8,
    processing_error: null,
    document_index: 'DOC-002',
    created_at: '2026-02-15T14:30:00Z',
    updated_at: '2026-02-15T14:32:00Z',
  },
  {
    id: 'doc-3',
    workspace_id: 'ws-1',
    uploaded_by: 'user-1',
    original_filename: 'Corrupt_Dataset.csv',
    storage_path: 'vault/ws-1/doc-3/Corrupt_Dataset.csv',
    mime_type: 'text/csv',
    file_size_bytes: 512, // 512 B
    checksum: 'sha256:ijkl9012',
    status: 'failed',
    page_count: 1,
    chunk_count: 0,
    processing_error: 'Encoding failure: invalid UTF-8 bytes at offset 42',
    document_index: 'DOC-003',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T09:01:00Z',
  },
];

describe('Knowledge UI Utilities', () => {
  describe('formatBytes', () => {
    it('formats 0 or negative bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-10)).toBe('0 B');
      expect(formatBytes(null)).toBe('0 B');
    });

    it('formats bytes under 1 KB', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(15360)).toBe('15.0 KB');
      expect(formatBytes(204800)).toBe('200.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
    });
  });

  describe('formatMimeType', () => {
    it('detects PDF', () => {
      expect(formatMimeType('application/pdf', 'sample.pdf')).toEqual({ label: 'PDF', ext: '.pdf' });
    });

    it('detects Markdown', () => {
      expect(formatMimeType('text/markdown', 'notes.md')).toEqual({ label: 'MD', ext: '.md' });
    });

    it('detects CSV and Text', () => {
      expect(formatMimeType('text/csv', 'data.csv')).toEqual({ label: 'CSV', ext: '.csv' });
      expect(formatMimeType('text/plain', 'log.txt')).toEqual({ label: 'TXT', ext: '.txt' });
    });
  });

  describe('formatArchivalDate & DateTime', () => {
    it('formats date cleanly', () => {
      expect(formatArchivalDate('2026-01-10T10:00:00Z')).toBe('2026-01-10');
      expect(formatArchivalDate(null)).toBe('—');
    });

    it('formats datetime with UTC indicator', () => {
      expect(formatArchivalDateTime('2026-01-10T10:00:00Z')).toBe('2026-01-10 10:00:00 UTC');
      expect(formatArchivalDateTime(null)).toBe('—');
    });
  });

  describe('filterDocuments', () => {
    it('returns all documents when no filter or search is applied', () => {
      const res = filterDocuments(SAMPLE_DOCS, '', 'all');
      expect(res.length).toBe(3);
    });

    it('filters by status ready', () => {
      const res = filterDocuments(SAMPLE_DOCS, '', 'ready');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('doc-1');
    });

    it('filters by status processing', () => {
      const res = filterDocuments(SAMPLE_DOCS, '', 'processing');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('doc-2');
    });

    it('filters by status failed', () => {
      const res = filterDocuments(SAMPLE_DOCS, '', 'failed');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('doc-3');
    });

    it('filters by search term in document title or index', () => {
      const res1 = filterDocuments(SAMPLE_DOCS, 'architecture', 'all');
      expect(res1.length).toBe(1);
      expect(res1[0].id).toBe('doc-2');

      const res2 = filterDocuments(SAMPLE_DOCS, 'DOC-003', 'all');
      expect(res2.length).toBe(1);
      expect(res2[0].id).toBe('doc-3');
    });
  });

  describe('sortDocuments', () => {
    it('sorts by name ascending and descending', () => {
      const asc = sortDocuments(SAMPLE_DOCS, 'name', 'asc');
      expect(asc[0].original_filename).toBe('API_Architecture_Spec.md');

      const desc = sortDocuments(SAMPLE_DOCS, 'name', 'desc');
      expect(desc[0].original_filename).toBe('Security_Audit_2025.pdf');
    });

    it('sorts by size ascending and descending', () => {
      const asc = sortDocuments(SAMPLE_DOCS, 'size', 'asc');
      expect(asc[0].id).toBe('doc-3'); // 512 B

      const desc = sortDocuments(SAMPLE_DOCS, 'size', 'desc');
      expect(desc[0].id).toBe('doc-1'); // 200 KB
    });

    it('sorts by chunks ascending and descending', () => {
      const asc = sortDocuments(SAMPLE_DOCS, 'chunks', 'asc');
      expect(asc[0].id).toBe('doc-3'); // 0 chunks

      const desc = sortDocuments(SAMPLE_DOCS, 'chunks', 'desc');
      expect(desc[0].id).toBe('doc-1'); // 34 chunks
    });

    it('sorts by date ascending and descending', () => {
      const asc = sortDocuments(SAMPLE_DOCS, 'date', 'asc');
      expect(asc[0].id).toBe('doc-1'); // Jan 2026

      const desc = sortDocuments(SAMPLE_DOCS, 'date', 'desc');
      expect(desc[0].id).toBe('doc-3'); // Mar 2026
    });
  });

  describe('selection helpers', () => {
    it('computes areAllSelected correctly', () => {
      const selected = new Set(['doc-1', 'doc-2', 'doc-3']);
      expect(areAllSelected(SAMPLE_DOCS, selected)).toBe(true);

      const partial = new Set(['doc-1']);
      expect(areAllSelected(SAMPLE_DOCS, partial)).toBe(false);
    });

    it('computes isIndeterminate correctly', () => {
      const partial = new Set(['doc-1']);
      expect(isIndeterminate(SAMPLE_DOCS, partial)).toBe(true);

      const full = new Set(['doc-1', 'doc-2', 'doc-3']);
      expect(isIndeterminate(SAMPLE_DOCS, full)).toBe(false);

      const empty = new Set<string>();
      expect(isIndeterminate(SAMPLE_DOCS, empty)).toBe(false);
    });
  });
});
