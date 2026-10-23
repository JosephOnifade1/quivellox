'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  FileCode,
  AlertCircle,
  Loader2,
  Download,
  Search,
  ShieldCheck,
  Calendar,
  HardDrive,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Server,
} from 'lucide-react';
import { Document, DocumentChunk, DocumentStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatBytes,
  formatMimeType,
  formatArchivalDateTime,
} from '@/components/knowledge/knowledge-utils';

function DocumentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Chunk browser state
  const [chunkSearch, setChunkSearch] = useState('');
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  const fetchDoc = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Document not found in archival repository');
        if (res.status === 403) throw new Error('Forbidden: You lack authorization to inspect this document');
        throw new Error(`Failed to load document (HTTP ${res.status})`);
      }
      const data = await res.json();
      setDocument(data.document);
      setChunks(data.chunks || []);
    } catch (err) {
      console.error(err);
      setFetchError(err instanceof Error ? err.message : 'Error retrieving document');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDoc();
    }
  }, [documentId]);

  // Poll status while document is non-terminal (queued, extracting, chunking, indexing)
  useEffect(() => {
    if (!document) return;
    const isProcessing = ['queued', 'extracting', 'chunking', 'indexing'].includes(document.status);
    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/status`);
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.status && statusData.status !== document.status) {
            await fetchDoc(true);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [document, documentId]);

  // Retry ingestion
  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/retry`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to retry ingestion');
      }
      await fetchDoc(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  };

  // Delete document
  const handleDelete = async () => {
    if (!document) return;
    const confirmed = window.confirm(
      `Permanently delete "${document.original_filename}" and purge all vector embeddings from the repository?`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/documents?id=${documentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete document');
        setDeleting(false);
      } else {
        router.push('/app/knowledge');
      }
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter chunks by search
  const filteredChunks = useMemo(() => {
    if (!chunkSearch.trim()) return chunks;
    const q = chunkSearch.toLowerCase();
    return chunks.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        (c.section_title && c.section_title.toLowerCase().includes(q))
    );
  }, [chunks, chunkSearch]);

  const toggleExpandChunk = (chunkId: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-xs font-mono text-[var(--text-muted)] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-citron-muted)]" />
        <span>Loading archival source dossier…</span>
      </div>
    );
  }

  if (fetchError || !document) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <Link
          href="/app/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Ledger
        </Link>
        <EmptyState
          icon={<AlertCircle className="w-6 h-6 text-[var(--status-error)]" />}
          badge="ARCHIVAL ERROR"
          title="Document Dossier Unavailable"
          description={fetchError || 'The requested document record does not exist or has been removed.'}
          action={
            <Link href="/app/knowledge">
              <Button variant="secondary" size="sm">
                Return to Knowledge Ledger
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const mimeInfo = formatMimeType(document.mime_type, document.original_filename);
  const isProcessing = ['queued', 'extracting', 'chunking', 'indexing'].includes(document.status);

  // Lifecycle steps mapping
  const lifecycleSteps = [
    {
      id: 'vault',
      label: 'Vault Storage',
      description: 'Encrypted multi-tenant file archive',
      status: 'completed',
    },
    {
      id: 'extracting',
      label: 'Text Extraction',
      description: 'Document parser & layout analysis',
      status:
        document.status === 'failed'
          ? 'failed'
          : document.status === 'queued'
          ? 'pending'
          : document.status === 'extracting'
          ? 'active'
          : 'completed',
    },
    {
      id: 'chunking',
      label: 'Semantic Chunking',
      description: 'Recursive 512-token target windowing',
      status:
        document.status === 'failed'
          ? 'failed'
          : ['queued', 'extracting'].includes(document.status)
          ? 'pending'
          : document.status === 'chunking'
          ? 'active'
          : 'completed',
    },
    {
      id: 'indexing',
      label: 'Vector Indexing',
      description: 'pgvector / Dify Knowledge Base embeddings',
      status:
        document.status === 'failed'
          ? 'failed'
          : ['queued', 'extracting', 'chunking'].includes(document.status)
          ? 'pending'
          : document.status === 'indexing'
          ? 'active'
          : 'completed',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* 1. Breadcrumb & Operational Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] flex-wrap">
          <Link
            href="/app/knowledge"
            className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Knowledge Ledger</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-[var(--accent-citron-muted)]">
            {document.document_index || 'DOC'}
          </span>
          <span>/</span>
          <span className="text-[var(--text-primary)] truncate max-w-xs">
            {document.original_filename}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {document.status === 'failed' && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleRetry}
              isLoading={retrying}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Ingestion
            </Button>
          )}

          <a
            href={`/api/documents/${documentId}/download`}
            download={document.original_filename}
            className="inline-flex"
          >
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />}
            >
              Download Original
            </Button>
          </a>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={deleting}
            icon={<Trash2 className="w-3.5 h-3.5 text-[var(--status-error)]" />}
            className="text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
          >
            Delete Document
          </Button>
        </div>
      </div>

      {/* 2. Failure Banner if Ingestion Failed */}
      {document.status === 'failed' && (
        <div className="p-4 rounded-[8px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-[var(--status-error)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Ingestion Pipeline Error
              </h3>
              <p className="text-xs text-[var(--status-error)] font-mono">
                {document.processing_error || 'Vector indexing service reported an unrecoverable parsing error.'}
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRetry}
            isLoading={retrying}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Ingestion
          </Button>
        </div>
      )}

      {/* 3. Document Header Dossier Card */}
      <div className="p-5 md:p-6 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
            <FileCode className="w-6 h-6 text-[var(--accent-citron-muted)]" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-[var(--accent-citron-muted)] px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                {document.document_index || 'DOC'}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                {mimeInfo.label}
              </span>
              <Badge status={document.status} size="sm" dot={isProcessing}>
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />}
                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
              </Badge>
            </div>

            <h1 className="text-lg md:text-xl font-heading font-bold text-[var(--text-primary)] truncate">
              {document.original_filename}
            </h1>
          </div>
        </div>

        {/* 4. Ingestion Lifecycle State Machine */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-3">
            Ingestion Pipeline State Machine
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {lifecycleSteps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              const isFailed = step.status === 'failed';

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-[6px] border text-xs space-y-1 transition-colors ${
                    isActive
                      ? 'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]'
                      : isCompleted
                      ? 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40'
                      : isFailed
                      ? 'border-[var(--status-error-border)] bg-[var(--status-error-bg)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[var(--text-muted)]">STAGE 0{idx + 1}</span>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />}
                    {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--status-warning)]" />}
                    {isFailed && <XCircle className="w-3.5 h-3.5 text-[var(--status-error)]" />}
                  </div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {step.label}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Dense Archival Metadata Specification Table */}
      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[var(--accent-citron-muted)]" />
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)]">
              Archival Metadata Specification
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Verified Record
          </span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)] text-xs font-mono">
          {/* Row 1: Document ID & Index */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">Record Identifier</span>
              <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                <span>{document.id}</span>
                <button
                  onClick={() => copyToClipboard(document.id, 'id')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Copy Document ID"
                >
                  {copiedField === 'id' ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">Catalog Index</span>
              <span className="font-bold text-[var(--accent-citron-muted)]">
                {document.document_index || 'DOC'}
              </span>
            </div>
          </div>

          {/* Row 2: File Format & Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">MIME Format</span>
              <span className="text-[var(--text-primary)]">{document.mime_type || 'application/octet-stream'}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">File Size</span>
              <span className="text-[var(--text-primary)]">
                {formatBytes(document.file_size_bytes)} ({document.file_size_bytes.toLocaleString()} bytes)
              </span>
            </div>
          </div>

          {/* Row 3: Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">Ingestion Timestamp</span>
              <span className="text-[var(--text-primary)]">{formatArchivalDateTime(document.created_at)}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">Last Updated</span>
              <span className="text-[var(--text-primary)]">{formatArchivalDateTime(document.updated_at)}</span>
            </div>
          </div>

          {/* Row 4: Page Count & Chunk Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">Extracted Pages</span>
              <span className="text-[var(--text-primary)]">{document.page_count ?? 1}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px]">Indexed Passages</span>
              <span className="text-[var(--text-primary)]">{document.chunk_count} chunks</span>
            </div>
          </div>

          {/* Row 5: Storage Vault Path */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <span className="text-[var(--text-muted)] uppercase text-[10px] shrink-0">Storage Vault Path</span>
            <div className="flex items-center gap-1.5 truncate text-[var(--text-primary)]">
              <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{document.storage_path}</span>
              <button
                onClick={() => copyToClipboard(document.storage_path, 'path')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                title="Copy Vault Path"
              >
                {copiedField === 'path' ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Row 6: Checksum SHA-256 */}
          {document.checksum && (
            <div className="p-3.5 flex items-center justify-between gap-3">
              <span className="text-[var(--text-muted)] uppercase text-[10px] shrink-0">Cryptographic Checksum</span>
              <div className="flex items-center gap-1.5 truncate text-[var(--text-primary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)] shrink-0" />
                <span className="truncate">{document.checksum}</span>
                <button
                  onClick={() => copyToClipboard(document.checksum || '', 'checksum')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                  title="Copy Checksum"
                >
                  {copiedField === 'checksum' ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          {/* Row 7: Dify External Identifiers (if safe and present) */}
          {(document.dify_document_id || document.dify_batch_id) && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
              {document.dify_document_id && (
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <span className="text-[var(--text-muted)] uppercase text-[10px]">Dify Document ID</span>
                  <span className="text-[var(--text-primary)]">{document.dify_document_id}</span>
                </div>
              )}
              {document.dify_batch_id && (
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <span className="text-[var(--text-muted)] uppercase text-[10px]">Dify Batch ID</span>
                  <span className="text-[var(--text-primary)]">{document.dify_batch_id}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. Extracted Chunk Browser */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-citron-muted)]" />
            <h2 className="text-sm font-heading font-bold text-[var(--text-primary)]">
              Extracted Vector Chunks ({chunks.length})
            </h2>
          </div>

          {chunks.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                value={chunkSearch}
                onChange={(e) => setChunkSearch(e.target.value)}
                placeholder="Search chunk text…"
                className="w-full h-8 pl-8 pr-3 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          )}
        </div>

        {chunks.length === 0 ? (
          <div className="p-6 rounded-[8px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-2">
            <Info className="w-5 h-5 text-[var(--accent-citron-muted)] mx-auto" />
            <h3 className="text-xs font-mono font-semibold text-[var(--text-primary)]">
              {document.status === 'ready'
                ? 'Vector Embeddings Managed Remotely'
                : document.status === 'failed'
                ? 'Chunk Extraction Incomplete'
                : 'Indexing in Progress'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
              {document.status === 'ready'
                ? "This document's semantic vectors and passage chunks are indexed directly within the Dify Vector Knowledge Base. Raw passage segments are retrieved dynamically during conversational grounded search, and are not duplicated as relational database rows in PostgreSQL."
                : document.status === 'failed'
                ? 'Ingestion encountered an error prior to completing passage extraction and vector embedding creation.'
                : 'The document is currently being parsed, split, and indexed by the RAG service. Vector passages will become active upon completion.'}
            </p>
          </div>
        ) : filteredChunks.length === 0 ? (
          <div className="p-6 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center text-xs text-[var(--text-muted)]">
            No chunks match query &ldquo;{chunkSearch}&rdquo;.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredChunks.map((chunk, idx) => {
              const isExpanded = expandedChunks.has(chunk.id);
              const isLong = chunk.content.length > 280;

              return (
                <div
                  key={chunk.id || idx}
                  className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--accent-citron-muted)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 rounded-[3px] border border-[var(--border-subtle)]">
                        CHUNK #{chunk.chunk_index + 1}
                      </span>
                      {chunk.section_title && (
                        <span className="text-[var(--text-primary)] font-medium">
                          {chunk.section_title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {chunk.page_number && <span>Page {chunk.page_number}</span>}
                      {chunk.token_count && <span>{chunk.token_count} tokens</span>}
                    </div>
                  </div>

                  <div className="text-xs text-[var(--text-primary)] leading-relaxed border-l-2 border-[var(--accent-citron-muted)] pl-3 font-serif italic">
                    {isLong && !isExpanded ? (
                      <>
                        &ldquo;{chunk.content.slice(0, 280)}…&rdquo;
                        <button
                          onClick={() => toggleExpandChunk(chunk.id)}
                          className="ml-2 not-italic text-[10px] font-mono font-semibold text-[var(--accent-citron-muted)] hover:underline inline-flex items-center gap-0.5"
                        >
                          Show full text <ChevronDown className="w-3 h-3 inline" />
                        </button>
                      </>
                    ) : (
                      <>
                        &ldquo;{chunk.content}&rdquo;
                        {isLong && (
                          <button
                            onClick={() => toggleExpandChunk(chunk.id)}
                            className="ml-2 not-italic text-[10px] font-mono font-semibold text-[var(--accent-citron-muted)] hover:underline inline-flex items-center gap-0.5"
                          >
                            Collapse <ChevronUp className="w-3 h-3 inline" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-citron-muted)]" />
          Loading document evidence…
        </div>
      }
    >
      <DocumentDetailContent />
    </React.Suspense>
  );
}
