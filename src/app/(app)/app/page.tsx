'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Plus,
  Clock,
  BookOpen,
  ArrowRight,
  Database,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Document } from '@/types';
import { ActivityEvent } from '@/lib/rag-store';

export default function OverviewPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, actRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/activity'),
      ]);
      const docsData = await docsRes.json();
      const actData = await actRes.json();
      setDocuments(docsData.documents || []);
      setActivity(actData.activity || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpload = () => fetchData();
    window.addEventListener('document_uploaded', handleUpload);
    return () => window.removeEventListener('document_uploaded', handleUpload);
  }, []);

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const totalPages = documents.reduce((acc, d) => acc + (d.page_count || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--accent-citron-muted)] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron)]" />
            WORKSPACE: RESEARCH VAULT · ONLINE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Your knowledge, within reach.
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Grounded retrieval-augmented generation engine & evidence verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/ask"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Ask Quellivox
          </Link>
          <Link
            href="/app/knowledge"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
          >
            <Plus className="w-4 h-4 text-[var(--text-muted)]" /> Add Doc
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Indexed Documents
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {documents.length}
          </div>
          <div className="text-[11px] text-[var(--status-success)] flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> All verified ready
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Vector Chunks
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {totalChunks}
          </div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
            512 token target window
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Extracted Pages
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {totalPages}
          </div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
            PDF / Markdown / Text
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Search Mode
          </div>
          <div className="text-base font-semibold text-[var(--accent-citron-muted)] mt-1">
            Dense + Sparse Hybrid
          </div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
            HNSW + Full-Text Rerank
          </div>
        </div>
      </div>

      {/* Primary Action Tiles */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/app/ask"
          className="group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-citron)]/60 hover:bg-[var(--accent-citron)]/5 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-citron)]/10 border border-[var(--accent-citron)]/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-[var(--accent-citron-muted)]" />
          </div>
          <div className="font-semibold text-sm text-[var(--text-primary)] mb-1 flex items-center justify-between">
            Ask Quellivox
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Query your indexed library in natural language and inspect exact cited passage excerpts.
          </p>
        </Link>

        <Link
          href="/app/knowledge"
          className="group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-citron)]/60 hover:bg-[var(--accent-citron)]/5 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="font-semibold text-sm text-[var(--text-primary)] mb-1 flex items-center justify-between">
            Knowledge Library
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Upload new manuals, manage vector partition states, and inspect individual passage chunks.
          </p>
        </Link>

        <Link
          href="/app/conversations"
          className="group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-citron)]/60 hover:bg-[var(--accent-citron)]/5 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="font-semibold text-sm text-[var(--text-primary)] mb-1 flex items-center justify-between">
            Persisted Sessions
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Review past multi-turn dialogues with preserved source grounding and citation links.
          </p>
        </Link>
      </div>

      {/* Suggested Prompt Sandbox Box */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Curated Knowledge Questions
          </span>
          <span className="text-[10px] font-mono text-[var(--accent-citron-muted)]">
            Ready to test
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              q: 'What is the refund window and does it apply to digital products?',
              doc: 'DOC-003 · Product Refund Terms',
            },
            {
              q: 'What is the SLA uptime guarantee and Severity 1 response time?',
              doc: 'DOC-002 · Enterprise SLA 2025',
            },
            {
              q: 'How does Quellivox handle chunk boundaries and hybrid retrieval?',
              doc: 'DOC-001 · Architecture v2.4',
            },
            {
              q: 'What data encryption and AI training policies are enforced?',
              doc: 'DOC-004 · Security & Compliance',
            },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={`/app/ask?q=${encodeURIComponent(item.q)}`}
              className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-citron)]/60 hover:bg-[var(--accent-citron)]/5 transition-all text-left group"
            >
              <div className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-citron-muted)] transition-colors">
                &ldquo;{item.q}&rdquo;
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1.5 flex items-center justify-between">
                <span>{item.doc}</span>
                <ArrowRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Ledger Feed */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              System Audit & Ingestion Ledger
            </span>
          </div>
          <Link
            href="/app/activity"
            className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            View all events &rarr;
          </Link>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {activity.slice(0, 5).map((act) => (
            <div key={act.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-citron)] mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                    {act.description}
                  </p>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    Event: {act.type}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
