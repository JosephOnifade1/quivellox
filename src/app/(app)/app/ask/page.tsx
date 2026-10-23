'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  ChevronRight,
  ChevronLeft,
  Info,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Citation } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  searching?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'What is the refund window and does it apply to digital products?',
  'What is the SLA uptime guarantee and Severity 1 response time?',
  'How does Quellivox handle chunk boundaries and hybrid retrieval?',
  'What data encryption and AI training policies are enforced?',
];

function CitationBadge({ idx, onClick }: { idx: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-[10px] font-mono font-bold hover:scale-110 active:scale-95 transition-transform mx-1 align-baseline shadow-xs"
      title={`Inspect cited passage [${idx}]`}
    >
      {idx}
    </button>
  );
}

function MessageBubble({
  msg,
  onCitationClick,
}: {
  msg: Message;
  onCitationClick: (c: Citation) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (content: string, citations?: Citation[]) => {
    if (!citations?.length) {
      return (
        <div className="text-sm leading-relaxed whitespace-pre-line">
          {content}
        </div>
      );
    }

    const parts = content.split(/(\[\d+\])/g);
    return (
      <div className="text-sm leading-relaxed whitespace-pre-line">
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const idx = parseInt(match[1]);
            const cit = citations[idx - 1] || citations.find((c, cIdx) => cIdx + 1 === idx);
            if (cit) {
              return (
                <CitationBadge
                  key={i}
                  idx={idx}
                  onClick={() => onCitationClick(cit)}
                />
              );
            }
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl px-4 py-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron)]" />
          {msg.searching ? 'Grounded Retrieval Engine' : 'Quellivox AI'}
          {msg.citations && msg.citations.length > 0 && (
            <span className="text-[var(--accent-citron-muted)]">
              · {msg.citations.length} verified passages retrieved
            </span>
          )}
        </div>
        {!msg.searching && (
          <button
            onClick={handleCopy}
            className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {msg.searching ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-citron-muted)] shrink-0" />
          <span>Executing hybrid dense vector search & cross-encoder reranking…</span>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs">
          {renderContent(msg.content, msg.citations)}
        </div>
      )}

      {/* Cited sources preview cards */}
      {msg.citations && msg.citations.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Retrieved Sources ({msg.citations.length})
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {msg.citations.map((c, i) => (
              <button
                key={c.chunk_id || i}
                onClick={() => onCitationClick(c)}
                className="text-left flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] hover:border-[var(--accent-citron)]/60 hover:bg-[var(--accent-citron)]/5 transition-all group"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)]">
                      {c.document_index || 'DOC'}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                      {c.document_name}
                    </span>
                  </div>
                  {c.section_title && (
                    <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                      {c.section_title}
                    </div>
                  )}
                  <p className="text-[10px] text-[var(--text-muted)] italic mt-1 line-clamp-1">
                    &ldquo;{c.quote}&rdquo;
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AskInterface() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      role: 'user',
      content: 'What is the refund window and does it apply to digital products?',
    },
    {
      id: 'msg-init-2',
      role: 'assistant',
      content:
        'The standard refund window is **14 calendar days** from the date of initial purchase or contract execution. [1]\n\nHowever, **digital product licenses, API consumption tiers, and active subscription seats are explicitly excluded** from standard return policies once usage exceeds 50 queries or 10 document uploads [2]. For defective digital software, exceptions are only granted if a reproducible defect is reported to technical support within **7 days** of provisioning.',
      citations: [
        {
          chunk_id: 'chk-301',
          document_id: 'doc-003',
          document_name: 'Product_Refund_and_Commercial_Terms_v3.1.pdf',
          document_index: 'DOC-003',
          page_number: 2,
          section_title: 'General Refund Window',
          quote:
            'Customers are entitled to initiate a return or refund within 14 calendar days from the date of initial purchase or contract execution.',
          similarity: 0.94,
        },
        {
          chunk_id: 'chk-302',
          document_id: 'doc-003',
          document_name: 'Product_Refund_and_Commercial_Terms_v3.1.pdf',
          document_index: 'DOC-003',
          page_number: 3,
          section_title: 'Digital Goods & SaaS Exceptions',
          quote:
            'Digital product licenses, API consumption tiers, and active subscription seats are explicitly excluded from standard return policies once usage exceeds 50 queries...',
          similarity: 0.89,
        },
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0) {
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCitationClick = (c: Citation) => {
    setActiveCitation(c);
    setPanelOpen(true);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const searchingId = `s-${Date.now()}`;
    const searchingMsg: Message = {
      id: searchingId,
      role: 'assistant',
      content: '',
      searching: true,
    };

    setMessages((prev) => [...prev, userMsg, searchingMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== searchingId)
          .concat({
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.answer || 'No answer generated.',
            citations: data.citations || [],
          })
      );

      if (data.citations && data.citations.length > 0) {
        setActiveCitation(data.citations[0]);
      }
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== searchingId)
          .concat({
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: 'Could not connect to the retrieval server. Please try again.',
            citations: [],
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Chat Flow */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top Chat Bar */}
        <div className="h-12 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
            <span className="font-semibold text-[var(--text-primary)]">Ask Quellivox</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span>Grounded RAG Pipeline</span>
          </div>

          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
            {panelOpen ? 'Hide Evidence' : 'Show Evidence'}
            {panelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onCitationClick={handleCitationClick}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggested Prompts Pill Bar */}
        <div className="px-5 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/20 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] shrink-0">
            Suggested:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(q)}
              className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-citron)]/60 text-[11px] text-[var(--text-primary)] truncate max-w-xs transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Composer Bar */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask anything about your uploaded documents…"
                rows={1}
                className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-4 py-3 focus:outline-none focus:border-[var(--accent-citron)] transition-colors shadow-inner"
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="h-11 w-11 rounded-xl bg-[var(--accent-citron)] text-[var(--accent-citron-text)] flex items-center justify-center hover:bg-[var(--accent-citron-muted)] transition-colors disabled:opacity-40 shrink-0 shadow-sm"
              title="Send query"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] text-center mt-2">
            Enter to send · Shift+Enter for newline · Real-time hybrid search & source attribution
          </p>
        </div>
      </div>

      {/* Evidence Inspector Panel (Right Drawer) */}
      {panelOpen && (
        <div className="w-80 md:w-96 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col h-full overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]/30">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent-citron-muted)]" />
              <span className="text-[11px] font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Evidence Inspector
              </span>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeCitation ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-[var(--accent-citron)]/30 bg-[var(--accent-citron)]/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)]">
                      {activeCitation.document_index || 'DOC'}
                    </span>
                    {activeCitation.similarity && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-citron-muted)] font-semibold">
                        Score: {(activeCitation.similarity * 100).toFixed(1)}% match
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                    {activeCitation.document_name}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">
                    Page {activeCitation.page_number || 1}
                    {activeCitation.section_title ? ` · ${activeCitation.section_title}` : ''}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Extracted Verbatim Passage
                  </div>
                  <div className="p-3.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed italic border-l-2 border-[var(--accent-citron)] pl-3">
                      &ldquo;{activeCitation.quote}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 space-y-1.5 text-[11px] text-[var(--text-muted)]">
                  <div className="font-semibold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" /> Grounding Guarantee
                  </div>
                  <p className="leading-relaxed">
                    This answer statement was derived directly from this passage. No ungrounded hallucinations were permitted during synthesis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                <Info className="w-8 h-8 text-[var(--border-strong)]" />
                <div className="text-xs font-medium text-[var(--text-primary)]">
                  No source passage selected
                </div>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Click any numbered evidence badge [1], [2] in an answer to inspect its original verbatim excerpt, page number, and similarity score here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing Ask workspace…
        </div>
      }
    >
      <AskInterface />
    </Suspense>
  );
}
