'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock, FileText, CheckCircle2, Search, Filter } from 'lucide-react';
import { ActivityEvent } from '@/lib/rag-store';

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/activity');
        const data = await res.json();
        setActivity(data.activity || []);
      } catch (err) {
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

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[var(--border-subtle)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Audit & Ingestion Ledger
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Detailed cryptographic event ledger tracking document ingestion, embeddings, and queries.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by description or event type…"
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
        />
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
          <span>Chronological Ledger</span>
          <span>{filtered.length} Recorded Events</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Activity className="w-10 h-10 text-[var(--border-strong)]" />
            <div className="text-sm font-medium text-[var(--text-primary)]">
              No matching activity events
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-citron)] mt-1.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {item.description}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                        {item.type}
                      </span>
                      <span>Event ID: {item.id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 text-right">
                  <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                  <div>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
