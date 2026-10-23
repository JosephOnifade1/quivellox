'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Upload,
  ArrowRight,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Document } from '@/types';
import { Button } from '@/components/ui/Button';

export interface FirstUseWorkspaceStateProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

const RESEARCH_SUGGESTIONS = [
  'What key definitions, contractual terms, or SLAs are established in the corpus?',
  'Summarize the primary deliverables, operational timelines, and milestones.',
  'What compliance, data governance, and encryption requirements are specified?',
  'What exceptions, refund policies, or liability clauses are detailed?',
];

export const FirstUseWorkspaceState: React.FC<FirstUseWorkspaceStateProps> = ({
  onSelectPrompt,
  className = '',
}) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchCorpus() {
      try {
        const res = await fetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.documents)) {
            setDocs(data.documents);
          }
        }
      } catch (err) {
        console.error('Failed to load documents for first-use state', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchCorpus();
    return () => {
      mounted = false;
    };
  }, []);

  const readyDocs = docs.filter((d) => d.status === 'ready');
  const indexingDocs = docs.filter((d) =>
    ['queued', 'extracting', 'chunking', 'indexing'].includes(d.status)
  );
  const totalChunks = readyDocs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
        <span className="w-5 h-5 rounded-full border-2 border-[var(--accent-citron-muted)] border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono text-[var(--text-muted)]">Verifying workspace corpus status…</span>
      </div>
    );
  }

  // State A: Workspace has no documents uploaded
  if (docs.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-6 md:p-8 max-w-lg mx-auto space-y-4 select-none ${className}`}>
        <div className="w-12 h-12 rounded-[7px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-citron-muted)] shadow-xs">
          <Database className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-semibold text-base text-[var(--text-primary)] tracking-tight">
            Workspace Corpus Is Empty
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Quellivox strictly grounds every response in your private documents. Upload PDF, Markdown, or text files in your Knowledge Library to begin asking evidence-backed questions.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/app/knowledge">
            <Button variant="primary" size="md" icon={<Upload className="w-3.5 h-3.5" />}>
              Add Documents in Knowledge Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // State B: Documents exist but are still in extraction/indexing
  if (readyDocs.length === 0 && indexingDocs.length > 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-6 md:p-8 max-w-lg mx-auto space-y-4 select-none ${className}`}>
        <div className="w-12 h-12 rounded-[7px] bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] flex items-center justify-center text-[var(--status-warning)] shadow-xs">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-semibold text-base text-[var(--text-primary)] tracking-tight">
            Ingestion & Vector Indexing in Progress
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {indexingDocs.length} {indexingDocs.length === 1 ? 'document is' : 'documents are'} currently being parsed, chunked, and embedded into the vector index. Inquiry becomes available as soon as indexing finishes.
          </p>
        </div>
        <div className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[11px] font-mono text-[var(--text-muted)] w-full text-left space-y-1">
          {indexingDocs.slice(0, 3).map((d) => (
            <div key={d.id} className="flex items-center justify-between">
              <span className="truncate">{d.original_filename}</span>
              <span className="text-[var(--status-warning)] font-medium">[{d.status.toUpperCase()}]</span>
            </div>
          ))}
        </div>
        <Link href="/app/knowledge">
          <Button variant="secondary" size="sm">
            View Ingestion Pipeline
          </Button>
        </Link>
      </div>
    );
  }

  // State C: Fully Ready Workspace with Searchable Documents
  return (
    <div className={`flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 md:p-8 space-y-6 select-none ${className}`}>
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[11px] font-mono text-[var(--text-muted)] mb-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
          <span>
            {readyDocs.length} {readyDocs.length === 1 ? 'Document' : 'Documents'} Indexed · {totalChunks} Chunks Ready
          </span>
        </div>
        <h2 className="font-heading font-semibold text-xl text-[var(--text-primary)] tracking-tight">
          Evidence-Grounded Research Desk
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
          Every statement generated on this desk is derived strictly from retrieved passages. Click any suggestion below to test citation grounding.
        </p>
      </div>

      {/* Suggested Research Inquiries */}
      <div className="w-full space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center justify-between px-1">
          <span>Suggested Inquiry Prompts</span>
          <span className="text-[var(--text-faint)]">Click to populate</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {RESEARCH_SUGGESTIONS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(prompt)}
              className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--accent-citron-muted)] transition-all text-left group flex items-start justify-between gap-2 shadow-xs"
            >
              <span className="text-xs text-[var(--text-primary)] leading-snug line-clamp-2">
                {prompt}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
