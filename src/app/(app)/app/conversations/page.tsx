'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Search, Plus, Trash2, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { Conversation } from '@/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message && c.last_message.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Persisted Conversations
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Past multi-turn research sessions with grounded citations.
          </p>
        </div>
        <Link
          href="/app/ask"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Conversation
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search past research dialogues…"
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
        />
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageSquare className="w-10 h-10 text-[var(--border-strong)]" />
            <div className="text-sm font-medium text-[var(--text-primary)]">
              No conversations found
            </div>
            <p className="text-[11px] text-[var(--text-muted)] text-center max-w-sm">
              Ask your first question in the knowledge workspace to establish a persistent research session.
            </p>
            <Link
              href="/app/ask"
              className="mt-2 inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-xs font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Start Research
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/app/ask?q=${encodeURIComponent(c.title)}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-surface-elevated)]/40 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[var(--accent-citron)] transition-colors">
                    <MessageSquare className="w-4 h-4 text-[var(--accent-citron-muted)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-citron-muted)] transition-colors truncate">
                      {c.title}
                    </div>
                    {c.last_message && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                        {c.last_message}
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>Session ID: {c.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--status-error)] hover:border-[var(--status-error)] transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
