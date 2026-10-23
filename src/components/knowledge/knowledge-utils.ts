import { Document, DocumentStatus } from '@/types';

export type StatusFilterOption = 'all' | 'ready' | 'processing' | 'failed';

export type SortKey = 'name' | 'status' | 'size' | 'chunks' | 'date';
export type SortDirection = 'asc' | 'desc';

/**
 * Format raw byte size into human-readable compact notation
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Derives a clean extension and badge label from MIME type and filename
 */
export function formatMimeType(
  mime?: string | null,
  filename?: string | null
): { label: string; ext: string } {
  const lowerName = (filename || '').toLowerCase();
  const lowerMime = (mime || '').toLowerCase();

  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
    return { label: 'PDF', ext: '.pdf' };
  }
  if (lowerMime.includes('markdown') || lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    return { label: 'MD', ext: '.md' };
  }
  if (lowerMime.includes('plain') || lowerName.endsWith('.txt')) {
    return { label: 'TXT', ext: '.txt' };
  }
  if (lowerMime.includes('word') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
    return { label: 'DOC', ext: '.doc' };
  }
  if (lowerMime.includes('csv') || lowerName.endsWith('.csv')) {
    return { label: 'CSV', ext: '.csv' };
  }
  if (lowerMime.includes('json') || lowerName.endsWith('.json')) {
    return { label: 'JSON', ext: '.json' };
  }

  // Fallback to extension or 'RAW'
  const dotIndex = lowerName.lastIndexOf('.');
  if (dotIndex > 0) {
    const ext = lowerName.slice(dotIndex);
    return { label: ext.replace('.', '').toUpperCase(), ext };
  }

  return { label: 'FILE', ext: '' };
}

/**
 * Formats ISO timestamps into compact archival date representation
 */
export function formatArchivalDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return '—';
  }
}

/**
 * Formats ISO timestamps into detailed date and time for dossier view
 */
export function formatArchivalDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  } catch {
    return '—';
  }
}

/**
 * Filter documents by search string and status category
 */
export function filterDocuments(
  docs: Document[],
  searchQuery: string,
  statusFilter: StatusFilterOption
): Document[] {
  const query = searchQuery.trim().toLowerCase();

  return docs.filter((doc) => {
    // 1. Text filter (original_filename or document_index)
    if (query.length > 0) {
      const matchName = doc.original_filename.toLowerCase().includes(query);
      const matchIndex = doc.document_index ? doc.document_index.toLowerCase().includes(query) : false;
      if (!matchName && !matchIndex) {
        return false;
      }
    }

    // 2. Status category filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'ready') return doc.status === 'ready';
    if (statusFilter === 'failed') return doc.status === 'failed';
    if (statusFilter === 'processing') {
      return ['queued', 'extracting', 'chunking', 'indexing'].includes(doc.status);
    }

    return true;
  });
}

/**
 * Sort documents stably by chosen key and direction
 */
export function sortDocuments(
  docs: Document[],
  sortKey: SortKey,
  sortDirection: SortDirection
): Document[] {
  const multiplier = sortDirection === 'asc' ? 1 : -1;

  return [...docs].sort((a, b) => {
    switch (sortKey) {
      case 'name': {
        const nameA = a.original_filename.toLowerCase();
        const nameB = b.original_filename.toLowerCase();
        return nameA.localeCompare(nameB) * multiplier;
      }
      case 'status': {
        const order: Record<DocumentStatus, number> = {
          failed: 0,
          queued: 1,
          extracting: 2,
          chunking: 3,
          indexing: 4,
          ready: 5,
          deleting: 6,
        };
        const statusA = order[a.status] ?? 99;
        const statusB = order[b.status] ?? 99;
        return (statusA - statusB) * multiplier;
      }
      case 'size': {
        const sizeA = a.file_size_bytes ?? 0;
        const sizeB = b.file_size_bytes ?? 0;
        return (sizeA - sizeB) * multiplier;
      }
      case 'chunks': {
        const chunksA = a.chunk_count ?? 0;
        const chunksB = b.chunk_count ?? 0;
        return (chunksA - chunksB) * multiplier;
      }
      case 'date':
      default: {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        return (timeA - timeB) * multiplier;
      }
    }
  });
}

/**
 * Checks if all visible documents are selected
 */
export function areAllSelected(visibleDocs: Document[], selectedIds: Set<string>): boolean {
  if (visibleDocs.length === 0) return false;
  return visibleDocs.every((d) => selectedIds.has(d.id));
}

/**
 * Checks if some but not all visible documents are selected
 */
export function isIndeterminate(visibleDocs: Document[], selectedIds: Set<string>): boolean {
  if (visibleDocs.length === 0) return false;
  const count = visibleDocs.filter((d) => selectedIds.has(d.id)).length;
  return count > 0 && count < visibleDocs.length;
}
