'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  FileCode,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Document, DocumentChunk } from '@/types';

function DocumentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok) {
          throw new Error('Document not found');
        }
        const data = await res.json();
        setDocument(data.document);
        setChunks(data.chunks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (documentId) {
      fetchDoc();
    }
  }, [documentId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this document and its vector embeddings?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/documents?id=${documentId}`, { method: 'DELETE' });
      router.push('/app/knowledge');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[var(--accent-citron-muted)]" /> Loading document details…
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link
          href="/app/knowledge"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge library
        </Link>
        <div className="p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[var(--status-error)] mx-auto" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Document not found</h2>
          <p className="text-xs text-[var(--text-muted)]">This document may have been deleted or does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <Link
          href="/app/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Library
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--status-error)]/30 text-[var(--status-error)] text-xs font-medium hover:bg-[var(--status-error-bg)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting…' : 'Delete Document'}
          </button>
        </div>
      </div>

      {/* Document Overview Banner */}
      <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
            <FileCode className="w-6 h-6 text-[var(--accent-citron-muted)]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-[var(--accent-citron-muted)] px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)]">
                {document.document_index || 'DOC'}
              </span>
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">
                {document.original_filename}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-[var(--status-success)] bg-[var(--status-success-bg)]">
                <CheckCircle2 className="w-3 h-3" /> Ready for retrieval
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)] text-xs">
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">FILE SIZE</span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">
                  {(document.file_size_bytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">EXTRACTED PAGES</span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">
                  {document.page_count || 1} pages
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">INDEXED CHUNKS</span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">
                  {document.chunk_count} passages
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">UPLOAD DATE</span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chunks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-citron-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Extracted Vector Chunks ({chunks.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            512-token target window · pgvector HNSW
          </span>
        </div>

        <div className="space-y-3">
          {chunks.map((chunk, idx) => (
            <div
              key={chunk.id || idx}
              className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2 hover:border-[var(--border-strong)] transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span className="font-bold text-[var(--accent-citron-muted)]">
                  Chunk #{chunk.chunk_index + 1}
                </span>
                <span>
                  Page {chunk.page_number || 1} · {chunk.token_count || 85} tokens
                </span>
              </div>

              {chunk.section_title && (
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {chunk.section_title}
                </div>
              )}

              <p className="text-xs text-[var(--text-muted)] leading-relaxed italic border-l-2 border-[var(--accent-citron)] pl-3">
                &ldquo;{chunk.content}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-sm font-mono text-[var(--text-muted)] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-citron-muted)]" />
          Loading document evidence...
        </div>
      }
    >
      <DocumentDetailContent />
    </React.Suspense>
  );
}

