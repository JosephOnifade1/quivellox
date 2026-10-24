'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Plus,
  Clock,
  ArrowRight,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  MessageSquare,
  Activity,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Document, Conversation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatBytes, formatMimeType, formatArchivalDate } from '@/components/knowledge/knowledge-utils';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface ProfileSummary {
  displayName: string;
  workspaceName: string;
}

export default function DashboardOverviewPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, convsRes, actRes, profRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/conversations'),
        fetch('/api/activity'),
        fetch('/api/profile').catch(() => null),
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
      if (convsRes.ok) {
        const convsData = await convsRes.json();
        setConversations(convsData.conversations || []);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivity(actData.activity || []);
      }
      if (profRes && profRes.ok) {
        const profData = await profRes.json();
        setProfile({
          displayName: profData.displayName || 'Researcher',
          workspaceName: profData.workspaceName || 'My Workspace',
        });
      }
    } catch (e) {
      console.error('Error fetching dashboard overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === 'ready').length;
  const processingDocs = documents.filter((d) =>
    ['queued', 'extracting', 'chunking', 'indexing'].includes(d.status)
  ).length;
  const failedDocs = documents.filter((d) => d.status === 'failed').length;
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  const recentDocs = documents.slice(0, 5);
  const recentConversations = conversations.slice(0, 4);
  const recentActivity = activity.slice(0, 5);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Workspace Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
              {profile?.displayName ? `Welcome back, ${profile.displayName}` : 'Research Workspace'}
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
              {profile?.workspaceName || 'Active Vault'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            Grounded retrieval-augmented generation engine and verified evidence repository.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/app/knowledge">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Document
            </Button>
          </Link>

          <Link href="/app/ask">
            <Button
              variant="citron"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Ask Quivellox
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Operational Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Indexed Documents
          </span>
          <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
            {totalDocs}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] block">
            {readyDocs} ready for retrieval
          </span>
        </div>

        <div className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Vector Chunks
          </span>
          <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
            {totalChunks}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] block">
            512-token target window
          </span>
        </div>

        <div className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Active Processing
          </span>
          <div className={`text-xl font-mono font-bold ${processingDocs > 0 ? 'text-[var(--status-warning)]' : 'text-[var(--text-primary)]'}`}>
            {processingDocs}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] block">
            {processingDocs > 0 ? 'Vector indexing underway' : 'All jobs completed'}
          </span>
        </div>

        <div className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Research Sessions
          </span>
          <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
            {conversations.length}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] block">
            Multi-turn dialogs recorded
          </span>
        </div>
      </div>

      {/* 3. Contextual Attention Banners (if failed or processing jobs exist) */}
      {failedDocs > 0 && (
        <div className="p-4 rounded-[6px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-4 h-4 text-[var(--status-error)] shrink-0" />
            <span className="text-[var(--status-error)] font-medium">
              {failedDocs} {failedDocs === 1 ? 'document requires' : 'documents require'} attention. Ingestion failed during vector indexing.
            </span>
          </div>
          <Link href="/app/knowledge">
            <Button variant="danger" size="xs">
              Inspect in Knowledge Ledger &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Primary Research Launcher & Prompt Shortcuts */}
      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-heading font-bold text-[var(--text-primary)]">
              Grounded Research Launcher
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Pose an inquiry grounded in your uploaded knowledge base with cited source passages.
            </p>
          </div>
          <Link href="/app/ask">
            <Button variant="secondary" size="xs" icon={<ExternalLink className="w-3 h-3" />}>
              Open Research Desk
            </Button>
          </Link>
        </div>

        {readyDocs === 0 ? (
          <div className="p-6 rounded-[6px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)] text-center space-y-2">
            <Database className="w-5 h-5 text-[var(--text-muted)] mx-auto" />
            <p className="text-xs text-[var(--text-primary)] font-medium">
              No documents ready for retrieval yet.
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Upload research manuals, policies, or technical briefs in the Knowledge Ledger to enable grounded AI answers.
            </p>
            <Link href="/app/knowledge" className="inline-block pt-1">
              <Button variant="citron" size="xs" icon={<Plus className="w-3 h-3" />}>
                Upload Document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              'Summarize the core governance and compliance rules across our knowledge base.',
              'What are the primary operational procedures and escalation paths defined in our documents?',
              'Compare the service-level agreement uptime commitments against severity tiers.',
              'Extract the key technical requirements and architectural constraints specified in our files.',
            ].map((prompt, idx) => (
              <Link
                key={idx}
                href={`/app/ask?q=${encodeURIComponent(prompt)}`}
                className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-elevated)] transition-colors flex items-start justify-between gap-3 group text-left"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[var(--accent-citron-muted)] uppercase tracking-wider block">
                    INQUIRY TEMPLATE 0{idx + 1}
                  </span>
                  <p className="text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-citron-muted)] transition-colors line-clamp-2">
                    &ldquo;{prompt}&rdquo;
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 5. Split Section: Recent Knowledge & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Knowledge Records (7 cols) */}
        <div className="lg:col-span-7 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--accent-citron-muted)]" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                Recent Knowledge Records
              </h2>
            </div>
            <Link
              href="/app/knowledge"
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              View ledger &rarr;
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
              <p>No documents uploaded in this workspace.</p>
              <Link href="/app/knowledge">
                <Button variant="secondary" size="xs">
                  Upload First Document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentDocs.map((doc) => {
                const mime = formatMimeType(doc.mime_type, doc.original_filename);
                return (
                  <Link
                    key={doc.id}
                    href={`/app/knowledge/${doc.id}`}
                    className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[var(--bg-surface-elevated)]/40 transition-colors group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 rounded-[3px] border border-[var(--border-subtle)]">
                          {doc.document_index || 'DOC'}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] px-1 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                          {mime.label}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-citron-muted)] transition-colors">
                          {doc.original_filename}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-2">
                        <span>{formatBytes(doc.file_size_bytes)}</span>
                        <span>·</span>
                        <span>{doc.chunk_count} chunks</span>
                        <span>·</span>
                        <span>{formatArchivalDate(doc.created_at)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Badge status={doc.status} size="xs">
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Conversations (5 cols) */}
        <div className="lg:col-span-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--accent-citron-muted)]" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                Recent Research Dialogs
              </h2>
            </div>
            <Link
              href="/app/conversations"
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              All sessions &rarr;
            </Link>
          </div>

          {recentConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
              <p>No research dialogs initiated yet.</p>
              <Link href="/app/ask">
                <Button variant="secondary" size="xs">
                  Start First Inquiry
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentConversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/ask?conversationId=${c.id}`}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-surface-elevated)]/40 transition-colors group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-citron-muted)] transition-colors">
                      {c.title}
                    </p>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatArchivalDate(c.updated_at)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent Audit Events Ledger */}
      {recentActivity.length > 0 && (
        <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-citron-muted)]" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                Workspace Audit Ledger
              </h2>
            </div>
            <Link
              href="/app/activity"
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Full audit log &rarr;
            </Link>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {recentActivity.map((act) => (
              <div key={act.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron-muted)] shrink-0" />
                  <span className="text-[var(--text-primary)] truncate text-xs font-sans">
                    {act.description}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    {act.type}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
