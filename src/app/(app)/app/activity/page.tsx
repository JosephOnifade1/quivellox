'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  FileText,
  MessageSquare,
  Building2,
  CheckCircle2,
  XCircle,
  Upload,
  Trash2,
  Zap,
  RefreshCw,
  Clock,
  X,
  Server,
  Layers,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface UIActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  resource_type?: string;
  resource_id?: string | null;
  metadata?: Record<string, unknown>;
}

function eventIcon(type: string): React.ReactNode {
  if (type.startsWith('document.ready')) return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />;
  if (type.startsWith('document.failed')) return <XCircle className="w-3.5 h-3.5 text-[var(--status-error)]" />;
  if (type.startsWith('document.uploaded')) return <Upload className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />;
  if (type.startsWith('document.deleted')) return <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
  if (type.startsWith('document.')) return <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
  if (type.startsWith('query.')) return <Zap className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />;
  if (type.startsWith('conversation.')) return <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
  if (type.startsWith('workspace.')) return <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
  return <Activity className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
}

function groupByDate(items: UIActivityItem[]): [string, UIActivityItem[]][] {
  const map = new Map<string, UIActivityItem[]>();
  for (const item of items) {
    const date = new Date(item.timestamp);
    const key = isNaN(date.getTime())
      ? 'Undated Operations'
      : date.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries());
}

export default function ActivityAuditPage() {
  const [activity, setActivity] = useState<UIActivityItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/activity');
      if (!res.ok) throw new Error('Failed to load operational activity events');
      const data = await res.json();
      setActivity(data.activity || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error loading activity';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activity;
    return activity.filter(
      (a) =>
        a.description.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }, [activity, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
              Audit & Ingestion Ledger
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
              Operational Trace
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            Chronological log tracking document ingestion, storage vault transitions, grounded queries, and workspace events.
          </p>
        </div>

        <Button
          variant="surface"
          size="sm"
          onClick={() => fetchActivity()}
          isLoading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Log
        </Button>
      </div>

      {/* 2. Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter events by description, event type (e.g. document.uploaded), or resource ID…"
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

        <div className="text-[11px] font-mono text-[var(--text-muted)] px-3 py-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] whitespace-nowrap">
          {filtered.length} recorded events
        </div>
      </div>

      {/* 3. Event Ledger */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs font-mono text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-citron-muted)]" />
          <span>Loading verified operational audit log…</span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-[8px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-center space-y-3">
          <XCircle className="w-8 h-8 text-[var(--status-error)] mx-auto" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Failed to Retrieve Audit Log</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchActivity()}>
            Retry Connection
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-5 h-5" />}
          badge="AUDIT LOG"
          title={search ? 'No matching operational events' : 'No audit events recorded'}
          description={
            search
              ? `No events match "${search}". Reset your search query to inspect the workspace activity.`
              : 'Upload a document or submit a research query in Ask Quellivox to generate operational audit entries.'
          }
          action={
            search ? (
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Reset Filter
              </Button>
            ) : (
              <Link href="/app/knowledge">
                <Button variant="citron" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
                  Upload Document
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden divide-y divide-[var(--border-subtle)]">
          {grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date Group Header */}
              <div className="px-5 py-2.5 bg-[var(--bg-surface-elevated)]/50 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>{dateLabel}</span>
                </div>
                <span>{items.length} {items.length === 1 ? 'operation' : 'operations'}</span>
              </div>

              {/* Items in date group */}
              <div className="divide-y divide-[var(--border-subtle)]">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-[var(--bg-surface-elevated)]/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                        {eventIcon(item.type)}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] font-bold text-[var(--accent-citron-muted)]">
                            {item.type}
                          </span>
                          {item.resource_id && (
                            <span className="hidden sm:inline">Ref: {item.resource_id.slice(0, 12)}…</span>
                          )}
                          <span>·</span>
                          <span>Event ID: {item.id.slice(0, 8)}…</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 text-right">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
