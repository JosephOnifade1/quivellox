'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Eye,
  Layers,
  Sparkles,
  X,
  FileCode,
} from 'lucide-react';
import { Document, DocumentChunk } from '@/types';
import { INITIAL_CHUNKS } from '@/lib/rag-store';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  queued: { label: 'Queued', color: 'text-[var(--status-info)] bg-[var(--status-info-bg)]', icon: Clock },
  extracting: { label: 'Extracting', color: 'text-[var(--status-warning)] bg-[var(--status-warning-bg)]', icon: Loader2 },
  chunking: { label: 'Chunking', color: 'text-[var(--status-warning)] bg-[var(--status-warning-bg)]', icon: Loader2 },
  indexing: { label: 'Indexing', color: 'text-[var(--status-warning)] bg-[var(--status-warning-bg)]', icon: Loader2 },
  ready: { label: 'Ready', color: 'text-[var(--status-success)] bg-[var(--status-success-bg)]', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-[var(--status-error)] bg-[var(--status-error-bg)]', icon: XCircle },
};

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<Document | null>(null);
  const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const handleUpload = () => fetchDocuments();
    window.addEventListener('document_uploaded', handleUpload);
    return () => window.removeEventListener('document_uploaded', handleUpload);
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowUploadZone(false);
        fetchDocuments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document and its vector embeddings?')) return;
    try {
      await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (e) {
      console.error(e);
    }
  };

  const openInspector = (doc: Document) => {
    setInspectDoc(doc);
    // Find chunks for this document
    const filtered = INITIAL_CHUNKS.filter((c) => c.document_id === doc.id);
    setDocChunks(filtered.length > 0 ? filtered : [
      {
        id: `chk-${doc.id}-1`,
        document_id: doc.id,
        workspace_id: 'ws-demo',
        chunk_index: 0,
        page_number: 1,
        section_title: 'Document Body Extraction',
        content: `Extracted content for ${doc.original_filename}. Text indexed and prepared for pgvector cosine similarity search.`,
        token_count: 92,
        created_at: doc.created_at,
      }
    ]);
  };

  const filteredDocs = documents.filter((d) =>
    d.original_filename.toLowerCase().includes(search.toLowerCase()) ||
    (d.document_index && d.document_index.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Knowledge Library
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Index manuals, policies, and contracts for high-precision grounded retrieval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </div>
      </div>

      {/* Upload Drop Zone */}
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
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? 'border-[var(--accent-citron)] bg-[var(--accent-citron)]/5'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
          }`}
        >
          <input
            type="file"
            id="doc-upload"
            className="sr-only"
            accept=".pdf,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-3">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-citron-muted)]" />
            ) : (
              <Upload className="w-6 h-6 text-[var(--text-muted)]" />
            )}
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
            <label
              htmlFor="doc-upload"
              className="text-[var(--accent-citron-muted)] cursor-pointer hover:underline"
            >
              Browse file
            </label>{' '}
            or drag and drop here
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)]">
            PDF · Markdown · TXT · Automatic recursive chunking & vector indexing
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title or index (e.g. DOC-001)…"
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-[var(--text-muted)] px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
        </div>
      </div>

      {/* Documents Table / Grid */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          <div className="col-span-6">Document & Index</div>
          <div className="col-span-2">Chunks / Pages</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 text-[var(--border-strong)]" />
            <div className="text-sm font-medium text-[var(--text-primary)]">
              No matching documents
            </div>
            <p className="text-[11px] text-[var(--text-muted)] text-center max-w-sm">
              Upload documents or reset your search filter to inspect your workspace library.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredDocs.map((doc) => {
              const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.ready;
              const StatusIcon = status.icon;

              return (
                <div
                  key={doc.id}
                  className="px-5 py-3.5 grid grid-cols-12 items-center hover:bg-[var(--bg-surface-elevated)]/40 transition-colors"
                >
                  <div className="col-span-6 flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      <FileCode className="w-4 h-4 text-[var(--accent-citron-muted)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)]">
                          {doc.document_index || 'DOC'}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {doc.original_filename}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                        <span>{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-xs text-[var(--text-muted)] font-mono">
                    <span className="text-[var(--text-primary)] font-medium">
                      {doc.chunk_count}
                    </span>{' '}
                    chunks · {doc.page_count || 1} pp
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${status.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openInspector(doc)}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                      title="Inspect extracted chunks"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chunk Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]/30">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent-citron-muted)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Vector Chunk Inspector — {inspectDoc.document_index}
                </span>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="text-xs text-[var(--text-muted)]">
                Showing extracted semantic passages for{' '}
                <strong className="text-[var(--text-primary)]">
                  {inspectDoc.original_filename}
                </strong>
                . Each chunk is indexed with dense vector embeddings and metadata for retrieval.
              </div>

              {docChunks.map((chunk, idx) => (
                <div
                  key={chunk.id || idx}
                  className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--accent-citron-muted)]">
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
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
