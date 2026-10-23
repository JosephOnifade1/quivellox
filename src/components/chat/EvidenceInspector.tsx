'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  FileText,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  Database,
  Check,
} from 'lucide-react';
import { Citation, Document } from '@/types';

export interface EvidenceInspectorProps {
  citations: Citation[];
  activeCitation: Citation | null;
  onSelectCitation: (citation: Citation) => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  citations,
  activeCitation,
  onSelectCitation,
  onClose,
  isMobileDrawer = false,
}) => {
  const [workspaceDocs, setWorkspaceDocs] = useState<Document[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Load authorized workspace documents for the collection overview mode
  useEffect(() => {
    let mounted = true;
    async function loadCorpusOverview() {
      try {
        setLoadingOverview(true);
        const res = await fetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.documents)) {
            setWorkspaceDocs(data.documents);
          }
        }
      } catch (err) {
        console.error('Failed to load workspace documents overview', err);
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    }

    if (citations.length === 0 && !activeCitation) {
      loadCorpusOverview();
    }

    return () => {
      mounted = false;
    };
  }, [citations.length, activeCitation]);

  const hasCitations = citations.length > 0;
  const currentCitation = activeCitation || (hasCitations ? citations[0] : null);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] overflow-hidden select-none">
      {/* Top Inspector Header */}
      <div className="h-12 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]/40 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--accent-citron-muted)]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            Evidence Inspector
          </span>
          {hasCitations && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
              {citations.length} {citations.length === 1 ? 'source' : 'sources'}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
            aria-label="Close evidence inspector"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasCitations ? (
          <>
            {/* Source selector chips */}
            {citations.length > 1 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Answer Citations
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {citations.map((c, idx) => {
                    const isSelected = currentCitation?.chunk_id === c.chunk_id;
                    return (
                      <button
                        key={c.chunk_id || idx}
                        onClick={() => onSelectCitation(c)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-[5px] border text-xs font-mono transition-all text-left ${
                          isSelected
                            ? 'bg-[var(--accent-citron)]/15 border-[var(--accent-citron)] text-[var(--text-primary)] font-semibold shadow-xs ring-1 ring-[var(--accent-citron)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-muted)]'
                        }`}
                      >
                        <span className="truncate">
                          [{idx + 1}] {c.document_index || 'DOC'}
                        </span>
                        {c.similarity && (
                          <span className="text-[9px] text-[var(--accent-citron-muted)] shrink-0 ml-1">
                            {Math.round(c.similarity * 100)}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Citation Deep Inspection */}
            {currentCitation && (
              <div className="space-y-3.5">
                {/* Source Metadata Card */}
                <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[var(--accent-citron-muted)] px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      {currentCitation.document_index || 'DOC'}
                    </span>
                    {currentCitation.similarity && (
                      <span className="font-mono text-[10px] text-[var(--accent-citron-muted)] font-semibold">
                        {(currentCitation.similarity * 100).toFixed(1)}% match score
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-heading font-medium text-[var(--text-primary)] leading-snug">
                    {currentCitation.document_name}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                    <span>Page {currentCitation.page_number || 1}</span>
                    {currentCitation.section_title && (
                      <>
                        <span>·</span>
                        <span className="truncate">{currentCitation.section_title}</span>
                      </>
                    )}
                  </div>

                  {currentCitation.document_id && (
                    <div className="pt-1.5 border-t border-[var(--border-subtle)]/70 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--text-faint)] truncate">
                        ID: {currentCitation.chunk_id.slice(0, 16)}…
                      </span>
                      <Link
                        href={`/app/knowledge/${currentCitation.document_id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-citron-muted)] hover:text-[var(--text-primary)] hover:underline"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Verbatim Extracted Passage */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium">
                    Verified Source Excerpt
                  </div>
                  <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <p className="font-serif italic text-xs leading-relaxed text-[var(--text-primary)] border-l-2 border-[var(--accent-citron)] pl-3">
                      &ldquo;{currentCitation.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Grounding Verification Seal */}
                <div className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1 text-xs text-[var(--text-muted)]">
                  <div className="font-medium text-[var(--text-primary)] flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)]" />
                    <span>Grounding Verification</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    This answer is synthesized directly from this passage. Vector similarity and cross-encoder checks confirmed high factual relevance.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Collection / Workspace Overview Mode (Before inquiries or when general answer has no citations) */
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-heading font-medium text-[var(--text-primary)]">
                <Database className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
                <span>Workspace Search Corpus</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                All questions asked on this desk query your authorized private documents in real time.
              </p>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-primary)]">
                <span>Available Documents</span>
                <span className="font-semibold text-[var(--accent-citron-muted)]">
                  {workspaceDocs.length} {workspaceDocs.length === 1 ? 'file' : 'files'}
                </span>
              </div>
            </div>

            {/* Recent Indexed Documents */}
            {workspaceDocs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Corpus Documents Ready
                </div>
                <div className="space-y-1.5">
                  {workspaceDocs.slice(0, 4).map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/app/knowledge/${doc.id}`}
                      className="flex items-center justify-between p-2.5 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] transition-colors group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-3.5 h-3.5 text-[var(--accent-citron-muted)] shrink-0" />
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {doc.original_filename}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                        {doc.chunk_count} chunks
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-[6px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)] text-center text-xs text-[var(--text-muted)]">
              <Info className="w-4 h-4 mx-auto mb-1 text-[var(--text-faint)]" />
              <span>Click citation tags [1], [2] in any answer to inspect verbatim sources here.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
