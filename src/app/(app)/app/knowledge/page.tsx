'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  ExternalLink,
  X,
  FileCode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Database,
  Info,
} from 'lucide-react';
import { Document, DocumentStatus } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatBytes,
  formatMimeType,
  formatArchivalDate,
  filterDocuments,
  sortDocuments,
  areAllSelected,
  isIndeterminate,
  SortKey,
  SortDirection,
  StatusFilterOption,
} from '@/components/knowledge/knowledge-utils';

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Upload UI state
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // In-flight action states
  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);

  // Fetch document catalog
  const fetchDocuments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/documents');
      if (!res.ok) {
        throw new Error(`Failed to load knowledge records (HTTP ${res.status})`);
      }
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : 'Error fetching document repository');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const handleUpload = () => fetchDocuments(true);
    window.addEventListener('document_uploaded', handleUpload);
    return () => window.removeEventListener('document_uploaded', handleUpload);
  }, []);

  // Poll in-progress documents every 3 seconds until all reach terminal status (ready/failed)
  useEffect(() => {
    const hasActiveDocs = documents.some((d) =>
      ['queued', 'extracting', 'chunking', 'indexing'].includes(d.status)
    );

    if (!hasActiveDocs) return;

    const interval = setInterval(() => {
      fetchDocuments(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  // Handle Retry Ingestion
  const handleRetry = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setRetryingDocId(id);
      const res = await fetch(`/api/documents/${id}/retry`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to retry ingestion');
      }
      await fetchDocuments(true);
    } catch (err) {
      console.error('Error retrying ingestion:', err);
    } finally {
      setRetryingDocId(null);
    }
  };

  // Handle Delete Document
  const handleDelete = async (id: string, filename: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${filename}" and purge all vector embeddings?`
    );
    if (!confirmed) return;

    try {
      setDeletingDocId(id);
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete document');
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await fetchDocuments(true);
      }
    } catch (e) {
      console.error('Error deleting document:', e);
    } finally {
      setDeletingDocId(null);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    // Client-side validation
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(`File exceeds maximum allowed size of 25 MB (${formatBytes(file.size)}).`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || 'Failed to process document');
      } else {
        setShowUploadZone(false);
      }
      await fetchDocuments(true);
    } catch (e) {
      console.error(e);
      setUploadError(e instanceof Error ? e.message : 'Network error during upload');
      await fetchDocuments(true);
    } finally {
      setUploading(false);
    }
  };

  // Filtered and Sorted documents
  const filteredDocs = useMemo(() => {
    return filterDocuments(documents, search, statusFilter);
  }, [documents, search, statusFilter]);

  const sortedDocs = useMemo(() => {
    return sortDocuments(filteredDocs, sortKey, sortDirection);
  }, [filteredDocs, sortKey, sortDirection]);

  // Stats derivation from real data
  const stats = useMemo(() => {
    const total = documents.length;
    const ready = documents.filter((d) => d.status === 'ready').length;
    const processing = documents.filter((d) =>
      ['queued', 'extracting', 'chunking', 'indexing'].includes(d.status)
    ).length;
    const failed = documents.filter((d) => d.status === 'failed').length;
    const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
    return { total, ready, processing, failed, totalChunks };
  }, [documents]);

  // Selection synchronization
  const allVisibleSelected = useMemo(() => {
    return areAllSelected(sortedDocs, selectedIds);
  }, [sortedDocs, selectedIds]);

  const indeterminate = useMemo(() => {
    return isIndeterminate(sortedDocs, selectedIds);
  }, [sortedDocs, selectedIds]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      // Deselect visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        sortedDocs.forEach((d) => next.delete(d.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        sortedDocs.forEach((d) => next.add(d.id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sort toggle handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3 h-3 text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[var(--accent-citron-muted)]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[var(--accent-citron-muted)]" />
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header & Archival Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
              Knowledge Ledger
            </h1>
            <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
              Archival Catalog
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            Curated repository of authorized source documents, vector embeddings, and ingestion records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="surface"
            size="sm"
            onClick={() => fetchDocuments()}
            isLoading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh Ledger"
          >
            Refresh
          </Button>

          <Button
            variant="citron"
            size="sm"
            onClick={() => setShowUploadZone(!showUploadZone)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Document
          </Button>
        </div>
      </div>

      {/* 2. Compact Archival Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Total Documents
            </span>
            <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
              {stats.total}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Ready for Retrieval
            </span>
            <span className="text-lg font-mono font-bold text-[var(--status-success)]">
              {stats.ready}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[5px] bg-[var(--status-success-bg)] border border-[var(--status-success-border)] flex items-center justify-center text-[var(--status-success)]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Indexing Active
            </span>
            <span className="text-lg font-mono font-bold text-[var(--status-warning)]">
              {stats.processing}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[5px] bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] flex items-center justify-center text-[var(--status-warning)]">
            <Loader2 className={`w-4 h-4 ${stats.processing > 0 ? 'animate-spin' : ''}`} />
          </div>
        </div>

        <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Vector Chunks
            </span>
            <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
              {stats.totalChunks}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-citron-muted)]">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Upload Drawer / Zone */}
      {showUploadZone && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
          className={`relative rounded-[8px] border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-[var(--accent-citron)] bg-[var(--accent-citron)]/5'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
          }`}
        >
          <button
            onClick={() => setShowUploadZone(false)}
            className="absolute top-3 right-3 p-1 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Close upload panel"
          >
            <X className="w-4 h-4" />
          </button>

          <input
            type="file"
            id="doc-upload"
            className="sr-only"
            accept=".pdf,.txt,.md,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <div className="w-12 h-12 rounded-[8px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-3">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-citron-muted)]" />
            ) : (
              <Upload className="w-6 h-6 text-[var(--text-muted)]" />
            )}
          </div>

          <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
            <label
              htmlFor="doc-upload"
              className="text-[var(--accent-citron-muted)] cursor-pointer hover:underline font-semibold"
            >
              Choose file
            </label>{' '}
            or drop archival document here
          </div>

          <p className="text-[11px] font-mono text-[var(--text-muted)]">
            PDF · Markdown · TXT · DOC (Max 25 MB) — Verified multi-tenant vault storage & pgvector indexing
          </p>

          {uploadError && (
            <div className="mt-4 p-3 rounded-[6px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-xs text-[var(--status-error)] flex items-center justify-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Filter, Search, and Status Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by filename or catalog index (e.g. DOC-001)…"
            className="w-full h-9 pl-9 pr-8 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs md:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs & Results Count */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          <div className="inline-flex rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5 text-xs font-mono">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-[4px] transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-[4px] transition-colors ${
                statusFilter === 'ready'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--status-success)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Ready ({stats.ready})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-2.5 py-1 rounded-[4px] transition-colors ${
                statusFilter === 'processing'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--status-warning)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Processing ({stats.processing})
            </button>
            {stats.failed > 0 && (
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2.5 py-1 rounded-[4px] transition-colors ${
                  statusFilter === 'failed'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--status-error)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Failed ({stats.failed})
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-[var(--text-muted)] px-2.5 py-1.5 rounded-[5px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] whitespace-nowrap">
            Showing {sortedDocs.length} of {documents.length}
          </div>
        </div>
      </div>

      {/* 5. Contextual Selection Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-[6px] border border-[var(--accent-citron-muted)]/40 bg-[var(--bg-surface-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--accent-citron-muted)] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              {selectedIds.size}
            </span>
            <span className="text-[var(--text-primary)] font-medium">
              {selectedIds.size === 1 ? 'document' : 'documents'} selected
            </span>
            <span className="text-[var(--text-muted)] hidden md:inline">·</span>
            <span className="text-[11px] text-[var(--text-muted)] hidden md:inline flex items-center gap-1">
              <Info className="w-3 h-3 text-[var(--text-muted)] inline shrink-0" />
              Batch mutation API is not supported by current server. Deselect to inspect or manage individual documents.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      {/* 6. Document Catalog Table */}
      {loadError ? (
        <div className="p-8 rounded-[8px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[var(--status-error)] mx-auto" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Failed to Load Repository
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {loadError}
          </p>
          <Button variant="secondary" size="sm" onClick={() => fetchDocuments()}>
            Retry Connection
          </Button>
        </div>
      ) : sortedDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-5 h-5" />}
          badge="LEDGER CATALOG"
          title={
            search || statusFilter !== 'all'
              ? 'No matching documents found'
              : 'Repository is currently empty'
          }
          description={
            search || statusFilter !== 'all'
              ? `No archival records match "${search || statusFilter}". Reset your query to inspect the workspace library.`
              : 'Add your first research document to initiate recursive chunking, private vault storage, and semantic vector indexing.'
          }
          action={
            search || statusFilter !== 'all' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="citron"
                size="sm"
                onClick={() => setShowUploadZone(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Upload Document
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox selector */}
              <TableHead className="w-10 text-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all visible documents"
                  className="rounded-[3px] border-[var(--border-subtle)] text-[var(--accent-citron-muted)] focus:ring-[var(--accent-citron)] cursor-pointer"
                />
              </TableHead>

              {/* Document & Index */}
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <span>Document & Index</span>
                  {renderSortIndicator('name')}
                </button>
              </TableHead>

              {/* Status */}
              <TableHead className="w-32">
                <button
                  onClick={() => handleSort('status')}
                  className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <span>Status</span>
                  {renderSortIndicator('status')}
                </button>
              </TableHead>

              {/* File Size */}
              <TableHead className="w-24 text-right">
                <button
                  onClick={() => handleSort('size')}
                  className="group inline-flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] w-full"
                >
                  <span>Size</span>
                  {renderSortIndicator('size')}
                </button>
              </TableHead>

              {/* Chunks Count */}
              <TableHead className="w-24 text-right">
                <button
                  onClick={() => handleSort('chunks')}
                  className="group inline-flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] w-full"
                >
                  <span>Chunks</span>
                  {renderSortIndicator('chunks')}
                </button>
              </TableHead>

              {/* Indexed Timestamp */}
              <TableHead className="w-28 text-right">
                <button
                  onClick={() => handleSort('date')}
                  className="group inline-flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] w-full"
                >
                  <span>Indexed</span>
                  {renderSortIndicator('date')}
                </button>
              </TableHead>

              {/* Row Actions */}
              <TableHead className="w-32 text-right">
                <span>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedDocs.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              const mimeInfo = formatMimeType(doc.mime_type, doc.original_filename);
              const isProcessing = ['queued', 'extracting', 'chunking', 'indexing'].includes(doc.status);

              return (
                <TableRow
                  key={doc.id}
                  className={isSelected ? 'bg-[var(--accent-citron)]/5' : undefined}
                >
                  {/* Row Checkbox */}
                  <TableCell className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(doc.id)}
                      aria-label={`Select ${doc.original_filename}`}
                      className="rounded-[3px] border-[var(--border-subtle)] text-[var(--accent-citron-muted)] focus:ring-[var(--accent-citron)] cursor-pointer"
                    />
                  </TableCell>

                  {/* Document Name, MIME Format, and Index */}
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-7 h-7 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                        <FileCode className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 rounded-[3px] border border-[var(--border-subtle)]">
                            {doc.document_index || 'DOC'}
                          </span>
                          <span className="text-[9px] font-mono text-[var(--text-muted)] px-1 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                            {mimeInfo.label}
                          </span>
                          <Link
                            href={`/app/knowledge/${doc.id}`}
                            className="text-xs font-medium text-[var(--text-primary)] truncate hover:text-[var(--accent-citron-muted)] hover:underline transition-colors"
                            title={`Inspect ${doc.original_filename}`}
                          >
                            {doc.original_filename}
                          </Link>
                        </div>
                        {doc.status === 'failed' && doc.processing_error && (
                          <p
                            className="text-[10px] text-[var(--status-error)] truncate max-w-md mt-0.5"
                            title={doc.processing_error}
                          >
                            Error: {doc.processing_error}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="w-32">
                    <Badge status={doc.status} size="sm" dot={isProcessing}>
                      {isProcessing && (
                        <Loader2 className="w-2.5 h-2.5 animate-spin mr-1 inline" />
                      )}
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </Badge>
                  </TableCell>

                  {/* File Size */}
                  <TableCell className="w-24 text-right font-mono text-xs text-[var(--text-muted)]">
                    {formatBytes(doc.file_size_bytes)}
                  </TableCell>

                  {/* Chunk Count */}
                  <TableCell className="w-24 text-right font-mono text-xs">
                    <span className="text-[var(--text-primary)] font-medium">
                      {doc.chunk_count}
                    </span>{' '}
                    <span className="text-[var(--text-muted)] text-[10px]">chunks</span>
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="w-28 text-right font-mono text-xs text-[var(--text-muted)]">
                    {formatArchivalDate(doc.created_at)}
                  </TableCell>

                  {/* Row Actions */}
                  <TableCell className="w-32 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Retry button for failed documents */}
                      {doc.status === 'failed' && (
                        <button
                          onClick={(e) => handleRetry(doc.id, e)}
                          disabled={retryingDocId === doc.id}
                          className="p-1.5 rounded-[4px] border border-[var(--status-error-border)] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] transition-colors disabled:opacity-50"
                          title="Retry ingestion"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${retryingDocId === doc.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                      )}

                      {/* Download original document */}
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        download={doc.original_filename}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-[4px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                        title="Download original file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {/* View Dossier */}
                      <Link
                        href={`/app/knowledge/${doc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-[4px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                        title="Open Source Dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* Delete document */}
                      <button
                        onClick={(e) => handleDelete(doc.id, doc.original_filename, e)}
                        disabled={deletingDocId === doc.id}
                        className="p-1.5 rounded-[4px] border border-[var(--border-subtle)] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] transition-colors disabled:opacity-50"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
