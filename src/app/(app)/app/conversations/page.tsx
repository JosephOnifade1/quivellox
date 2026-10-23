'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  Sparkles,
  X,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Conversation } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatArchivalDateTime, formatArchivalDate } from '@/components/knowledge/knowledge-utils';

export default function ConversationsArchivePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(`Permanently delete conversation "${title}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete conversation');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.last_message && c.last_message.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
              Research Sessions Archive
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
              Grounded Dialogs
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            Persisted multi-turn dialogues with verified source grounding, passage citations, and audit records.
          </p>
        </div>

        <Link href="/app/ask">
          <Button
            variant="citron"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Inquiry
          </Button>
        </Link>
      </div>

      {/* 2. Search & Counter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search research sessions by inquiry topic, keyword, or session ID…"
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
          {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}
        </div>
      </div>

      {/* 3. Conversations Ledger */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs font-mono text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-citron-muted)]" />
          <span>Loading persistent research sessions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" />}
          badge="SESSION ARCHIVE"
          title={search ? 'No matching research sessions' : 'No research sessions yet'}
          description={
            search
              ? `No archived sessions matched query "${search}". Reset your search to view all sessions.`
              : 'Pose your first grounded question in Ask Quellivox to generate an interactive research dialogue with verified citations.'
          }
          action={
            search ? (
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Reset Filter
              </Button>
            ) : (
              <Link href="/app/ask">
                <Button variant="citron" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
                  Start Research
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden divide-y divide-[var(--border-subtle)]">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-4 md:p-5 flex items-start justify-between gap-4 hover:bg-[var(--bg-surface-elevated)]/40 transition-colors group"
            >
              <Link
                href={`/app/ask?conversationId=${c.id}`}
                className="flex items-start gap-3.5 min-w-0 flex-1"
              >
                <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[var(--accent-citron-muted)] transition-colors">
                  <MessageSquare className="w-4 h-4 text-[var(--accent-citron-muted)]" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-citron-muted)] transition-colors truncate">
                      {c.title}
                    </span>
                  </div>

                  {c.last_message && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {c.last_message}
                    </p>
                  )}

                  <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-3 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {formatArchivalDate(c.updated_at)}
                    </span>
                    <span>·</span>
                    <span>ID: {c.id.slice(0, 13)}…</span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <Link href={`/app/ask?conversationId=${c.id}`}>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    title="Resume Session"
                  >
                    Open
                  </Button>
                </Link>

                <button
                  onClick={(e) => handleDelete(c.id, c.title, e)}
                  disabled={deletingId === c.id}
                  className="p-1.5 rounded-[4px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--status-error)] hover:border-[var(--status-error-border)] hover:bg-[var(--status-error-bg)] transition-colors disabled:opacity-50"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
