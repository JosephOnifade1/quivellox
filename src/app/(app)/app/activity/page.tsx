'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

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

function eventDotColor(type: string): string {
  if (type.startsWith('document.ready')) return 'bg-[var(--status-success)]';
  if (type.startsWith('document.failed')) return 'bg-[var(--status-error)]';
  if (type.startsWith('query.')) return 'bg-[var(--accent-citron)]';
  if (type.startsWith('document.uploaded')) return 'bg-[var(--accent-citron-muted)]';
  return 'bg-[var(--border-strong)]';
}

function groupByDate(items: UIActivityItem[]): [string, UIActivityItem[]][] {
  const map = new Map<string, UIActivityItem[]>();
  for (const item of items) {
    const date = new Date(item.timestamp);
    const key = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries());
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<UIActivityItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/activity');
        if (!res.ok) throw new Error('Failed to load activity events');
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
    fetchActivity();
  }, []);

  const filtered = activity.filter((a) =>
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByDate(filtered);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[var(--border-subtle)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Audit &amp; Ingestion Ledger
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Chronological event log tracking document ingestion, embeddings, queries, and workspace changes.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by description or event type…"
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
        />
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
          <span>Chronological Ledger</span>
          <span>{filtered.length} Recorded Events</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-citron-muted)]" />
            <span>Loading audit events…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-8 h-8 text-[var(--status-error)]" />
            <p className="text-sm text-[var(--text-muted)]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Activity className="w-10 h-10 text-[var(--border-strong)]" />
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {search ? 'No matching activity events' : 'No activity yet'}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] text-center max-w-xs leading-relaxed">
              {search
                ? 'Try adjusting your filter terms.'
                : 'Upload a document or run a query to see activity events appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {grouped.map(([dateLabel, items]) => (
              <div key={dateLabel}>
                {/* Date group header */}
                <div className="px-5 py-2 bg-[var(--bg-surface-elevated)]/20 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {dateLabel}
                </div>
                {items.map((item) => (
                  <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-[var(--bg-surface-elevated)]/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1 shrink-0">
                        <div className={`absolute -left-0.5 -top-0.5 w-2 h-2 rounded-full ${eventDotColor(item.type)}`} />
                        <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                          {eventIcon(item.type)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                          {item.description}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] mt-1">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                            {item.type}
                          </span>
                          <span className="hidden sm:inline">Event ID: {item.id.slice(0, 8)}…</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 text-right">
                      <div>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
