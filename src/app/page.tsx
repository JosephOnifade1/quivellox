'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Search,
  Layers,
  Database,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  FileCode,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors selection:bg-[var(--accent-citron)] selection:text-[var(--accent-citron-text)]">
      {/* ─── 1. ARCHIVAL NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-50 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Category */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-citron-muted)] group-hover:border-[var(--accent-citron-muted)] transition-colors">
              QV
            </div>
            <div className="space-y-0.5">
              <span className="font-heading font-bold text-base tracking-tight text-[var(--text-primary)] block leading-none">
                Quellivox
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] block leading-none">
                The Evidence Desk
              </span>
            </div>
          </Link>

          {/* Section Anchors */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <a href="#workflow" className="hover:text-[var(--text-primary)] transition-colors">
              Ingestion Workflow
            </a>
            <a href="#citations" className="hover:text-[var(--text-primary)] transition-colors">
              Verifiable Citations
            </a>
            <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">
              Vault Isolation
            </a>
            <Link href="/app" className="hover:text-[var(--text-primary)] transition-colors">
              Workspace Desk
            </Link>
          </nav>

          {/* Actions & Theme */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="citron" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Initialize Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. EDITORIAL HERO SECTION ─── */}
      <section className="pt-16 md:pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-6 space-y-6">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-citron-muted)] font-semibold">
              Archival Knowledge Workstation
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
              Answers grounded in verified evidence.
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed max-w-xl">
              Quellivox is an editorial research workstation for rigorous document inquiry. Ingest internal manuals, policies, and technical specifications into an isolated vault, ask natural-language questions, and inspect the exact cited source passages that validate every answer.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/signup">
                <Button variant="citron" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Start Research Free
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="secondary" size="md">
                  Existing Workspace Sign In
                </Button>
              </Link>
            </div>

            <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
              <span>PDF · Markdown · TXT</span>
              <span>·</span>
              <span>Dify & pgvector RAG</span>
              <span>·</span>
              <span>Multi-Tenant Vault</span>
            </div>
          </div>

          {/* Right Column: Genuine Interactive Product Evidence Mockup */}
          <div className="lg:col-span-6">
            <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-lg overflow-hidden">
              {/* Card Window Bar */}
              <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/60 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--border-strong)]" />
                  <span>quellivox.internal / app / ask</span>
                </div>
                <span className="text-[10px] text-[var(--accent-citron-muted)] font-bold">
                  EVIDENCE-GROUNDED
                </span>
              </div>

              {/* Inquiry Prompt Sample */}
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50 space-y-1">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Research Question
                </div>
                <div className="text-xs font-medium text-[var(--text-primary)]">
                  &ldquo;What is the severity 1 incident response SLA and escalation timeline?&rdquo;
                </div>
              </div>

              {/* Grounded Answer Sample with Cited Excerpt */}
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                    <span>Synthesized Response</span>
                    <span className="text-[var(--status-success)] flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> 2 Sources Cited
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    Severity 1 critical incidents require an initial operational response within{' '}
                    <strong className="text-[var(--text-primary)] font-semibold">15 minutes</strong>{' '}
                    and mandatory executive notification within 60 minutes. Escalation paths are automatically dispatched to the on-call engineering lead.
                  </p>
                </div>

                {/* Quoted Verbatim Passage */}
                <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 space-y-1.5 font-serif italic text-xs border-l-2 border-l-[var(--accent-citron-muted)] text-[var(--text-primary)]">
                  <div className="not-italic flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span className="font-bold text-[var(--accent-citron-muted)]">
                      EXCERPT · DOC-002: Service_Level_Agreement.pdf
                    </span>
                    <span>Page 8 · Section 3.2</span>
                  </div>
                  <p className="leading-relaxed">
                    &ldquo;For all Severity 1 outages, the response team must acknowledge receipt within 15 minutes of trigger and establish an active command bridge…&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Cosine Similarity: 0.912</span>
                  <span>512-Token HNSW Partition</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. THE 4-STAGE INGESTION WORKFLOW ─── */}
      <section id="workflow" className="py-16 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-citron-muted)] font-semibold">
              Deterministic Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text-primary)] tracking-tight">
              A transparent, auditable ingestion pipeline.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Every document passes through a verifiable state machine ensuring tamper-resistant storage, disciplined chunking, and dual-layer vector indexing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <div className="text-[10px] font-mono text-[var(--accent-citron-muted)] font-bold">
                STAGE 01
              </div>
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                Private Vault Storage
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Raw files are validated and stored in encrypted multi-tenant Supabase Storage with SHA-256 integrity checksums.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <div className="text-[10px] font-mono text-[var(--accent-citron-muted)] font-bold">
                STAGE 02
              </div>
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                Layout & Text Parsing
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Structured text, metadata, page numbers, and section boundaries are extracted from PDF, Markdown, and TXT files.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <div className="text-[10px] font-mono text-[var(--accent-citron-muted)] font-bold">
                STAGE 03
              </div>
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                Semantic Window Splitting
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Text is split into 512-token target passages with 64-token semantic overlaps to prevent boundary context clipping.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <div className="text-[10px] font-mono text-[var(--accent-citron-muted)] font-bold">
                STAGE 04
              </div>
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                Vector Grounding & HNSW
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Embeddings are indexed in pgvector or Dify Knowledge Base partitions, ready for rapid cosine similarity retrieval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. CITATIONS & VERIFIABILITY PROMISE ─── */}
      <section id="citations" className="py-16 border-t border-[var(--border-subtle)] px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-citron-muted)] font-semibold">
              Grounding Over Guesswork
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text-primary)] tracking-tight">
              Inspect the evidence behind every sentence.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Unlike generic LLM chat interfaces that hallucinate plausible answers, Quellivox links every claim directly to a cited source passage. If your indexed documents do not contain sufficient evidence to answer, the engine states it plainly rather than fabricating facts.
            </p>

            <div className="space-y-2.5 pt-2 text-xs font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>Exact verbatim passage inspection in side drawer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>Page number and section title references</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>Explicit insufficient-evidence fallback handling</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Citation Verification Ledger</span>
                <span>Active Vault Inspection</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[var(--accent-citron-muted)]">DOC-001 · Architecture_Overview.pdf</span>
                    <span>Similarity 0.94</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans italic">
                    &ldquo;Tenant data boundaries are strictly enforced via PostgreSQL Row-Level Security policies tied to verified session tokens.&rdquo;
                  </p>
                </div>

                <div className="p-3 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[var(--accent-citron-muted)]">DOC-004 · Security_Compliance.md</span>
                    <span>Similarity 0.88</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans italic">
                    &ldquo;Under no circumstances are customer documents utilized to train foundational public model weights.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. SECURITY & TENANT ISOLATION ─── */}
      <section id="security" className="py-16 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-citron-muted)] font-semibold">
              Security Specifications
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text-primary)] tracking-tight">
              Engineered for private enterprise research.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Your research files remain private to your authenticated workspace partition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <Lock className="w-5 h-5 text-[var(--accent-citron-muted)]" />
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                Row-Level Security (RLS)
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Database queries and retrieval matches are enforced at the database layer via PostgreSQL RLS policies tied to verified session tokens.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-citron-muted)]" />
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                No Model Training
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your uploaded documents and queries are processed solely in memory during generation. They are never retained for model retraining.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-main)] space-y-2">
              <Database className="w-5 h-5 text-[var(--accent-citron-muted)]" />
              <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">
                Signed Vault Access
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Original files in Supabase Storage are private by default. Downloads require short-lived, authenticated cryptographic signatures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FINAL CALL TO ACTION ─── */}
      <section className="py-20 border-t border-[var(--border-subtle)] px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
            Begin your research in Quellivox.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-lg mx-auto">
            Initialize your private workspace, index your documents, and start asking grounded questions with verifiable citations in minutes.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button variant="citron" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                Initialize Workspace
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="md">
                Sign In to Existing Vault
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 7. COMPACT ARCHIVAL FOOTER ─── */}
      <footer className="py-8 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-primary)]">QUELLIVOX</span>
            <span>·</span>
            <span>The Evidence Desk</span>
          </div>

          <div className="text-[11px]">
            Grounded Retrieval-Augmented Generation Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
