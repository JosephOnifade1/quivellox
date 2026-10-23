'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  X,
  FileText,
} from 'lucide-react';
import { Citation } from '@/types';
import { AnswerRenderer } from '@/components/chat/AnswerRenderer';
import { EvidenceInspector } from '@/components/chat/EvidenceInspector';
import { ResearchComposer } from '@/components/chat/ResearchComposer';
import { FirstUseWorkspaceState } from '@/components/chat/FirstUseWorkspaceState';

interface ChatMessage {
  id: string;
  conversation_id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  searching?: boolean;
  insufficientEvidence?: boolean;
  queryTimeMs?: number;
  created_at?: string;
}

function AskInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const conversationIdParam = searchParams.get('conversationId');

  const [conversationId, setConversationId] = useState<string | null>(conversationIdParam);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(!!conversationIdParam);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load existing persistent conversation if conversationId is in URL
  useEffect(() => {
    if (conversationIdParam) {
      const loadConversation = async () => {
        try {
          setLoadingSession(true);
          const res = await fetch(`/api/conversations?id=${conversationIdParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages);
              const withCites = data.messages.find(
                (m: ChatMessage) => m.citations && m.citations.length > 0
              );
              if (withCites?.citations?.[0]) {
                setActiveCitation(withCites.citations[0]);
              }
            }
          }
        } catch (err) {
          console.error('[AskPage] Failed to load conversation:', err);
        } finally {
          setLoadingSession(false);
        }
      };
      loadConversation();
    }
  }, [conversationIdParam]);

  // Handle URL pre-fill inquiry
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0 && messages.length === 0) {
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCitationClick = (citation: Citation) => {
    setActiveCitation(citation);
    setPanelOpen(true);
    // On small mobile screens, open drawer
    if (window.innerWidth < 1024) {
      setMobileDrawerOpen(true);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.searching
            ? {
                ...m,
                searching: false,
                content: m.content || 'Inquiry cancelled by researcher.',
              }
            : m
        )
      );
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setActiveCitation(null);
    router.replace('/app/ask');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const searchingId = `s-${Date.now()}`;
    const searchingMsg: ChatMessage = {
      id: searchingId,
      role: 'assistant',
      content: '',
      searching: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, searchingMsg]);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: text,
          conversationId: conversationId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        window.history.replaceState(null, '', `/app/ask?conversationId=${data.conversationId}`);
      }

      const newAssistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No answer generated.',
        citations: data.citations || [],
        insufficientEvidence: data.insufficientEvidence,
        queryTimeMs: data.queryTimeMs,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== searchingId).concat(newAssistantMsg)
      );

      if (data.citations && data.citations.length > 0) {
        setActiveCitation(data.citations[0]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.error('[AskPage] Inquiry execution error:', err);
      setMessages((prev) =>
        prev.filter((m) => m.id !== searchingId).concat({
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `Unable to retrieve an evidence-backed answer. Reason: ${err.message || 'Connection error'}. Please verify that your documents are indexed in Knowledge and try again.`,
          citations: [],
          created_at: new Date().toISOString(),
        })
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Get citations from latest assistant message for inspector
  const latestAssistantWithCitations = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.citations && m.citations.length > 0);
  const currentInspectorCitations = latestAssistantWithCitations?.citations || [];

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg-main)]">
      {/* Central Conversation Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Desk Header Toolbar */}
        <div className="h-12 px-4 md:px-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0 select-none">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
            <span className="font-semibold text-[var(--text-primary)]">Evidence Inquiry Desk</span>
            <span className="text-[var(--border-strong)] hidden sm:inline">·</span>
            <span className="hidden sm:inline">Verified Citation Engine</span>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={resetConversation}
                className="h-7 px-2 rounded-[4px] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                title="Start a new research conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">New Inquiry</span>
              </button>
            )}

            {/* Evidence Inspector Toggle */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileDrawerOpen(!mobileDrawerOpen);
                } else {
                  setPanelOpen(!panelOpen);
                }
              }}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
              <span>Evidence</span>
              <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                {currentInspectorCitations.length}
              </span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loadingSession ? (
            <div className="flex items-center justify-center h-full text-xs font-mono text-[var(--text-muted)] gap-2 select-none">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-citron-muted)]" />
              <span>Restoring authenticated research session…</span>
            </div>
          ) : messages.length === 0 ? (
            <FirstUseWorkspaceState
              onSelectPrompt={(prompt) => {
                setComposerValue(prompt);
                sendMessage(prompt);
              }}
            />
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-2xl px-4 py-3 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] shadow-xs leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // Assistant answer
                return (
                  <div key={msg.id} className="space-y-3">
                    {/* Operational header badge */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-1 select-none">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron)]" />
                        <span className="text-[var(--text-primary)] font-medium">
                          Grounded Synthesis
                        </span>
                        {msg.citations && msg.citations.length > 0 && (
                          <span className="text-[var(--accent-citron-muted)]">
                            · {msg.citations.length} cited {msg.citations.length === 1 ? 'passage' : 'passages'}
                          </span>
                        )}
                        {msg.queryTimeMs && (
                          <span className="text-[var(--text-faint)] hidden sm:inline">
                            · {msg.queryTimeMs}ms
                          </span>
                        )}
                      </div>

                      {!msg.searching && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[var(--status-success)]" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Searching Shimmer Box */}
                    {msg.searching ? (
                      <div className="flex items-center gap-3 p-4 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-muted)] shadow-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-citron-muted)] shrink-0" />
                        <span className="font-mono text-xs">
                          Executing hybrid vector retrieval and cross-encoder verification…
                        </span>
                      </div>
                    ) : (
                      /* Synthesized Answer Box */
                      <div className="p-4 md:p-5 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs">
                        <AnswerRenderer
                          content={msg.content}
                          citations={msg.citations}
                          activeCitation={activeCitation}
                          onCitationClick={handleCitationClick}
                        />
                      </div>
                    )}

                    {/* Source Cards Row (Underneath Answer) */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium px-1 select-none">
                          Retrieved Source Evidence ({msg.citations.length})
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {msg.citations.map((c, i) => {
                            const isSelected = activeCitation?.chunk_id === c.chunk_id;
                            return (
                              <button
                                key={c.chunk_id || i}
                                type="button"
                                onClick={() => handleCitationClick(c)}
                                className={`text-left flex items-start gap-2.5 p-2.5 rounded-[6px] border transition-all group select-none ${
                                  isSelected
                                    ? 'bg-[var(--accent-citron)]/10 border-[var(--accent-citron)] ring-1 ring-[var(--accent-citron)] shadow-xs'
                                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-elevated)]/50'
                                }`}
                              >
                                <span
                                  className={`inline-flex items-center justify-center font-mono text-[10px] px-1.5 py-0.5 rounded-[3px] border font-bold shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'bg-[var(--accent-citron)] text-[#151713] border-transparent'
                                      : 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)]">
                                      {c.document_index || 'DOC'}
                                    </span>
                                    <span className="text-xs font-medium text-[var(--text-primary)] truncate font-heading">
                                      {c.document_name}
                                    </span>
                                  </div>
                                  <p className="font-serif italic text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1">
                                    &ldquo;{c.quote}&rdquo;
                                  </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Research Query Composer */}
        <ResearchComposer
          onSendMessage={sendMessage}
          isLoading={loading}
          onStopGeneration={handleStopGeneration}
          initialValue={composerValue}
        />
      </div>

      {/* Desktop Persistent Evidence Inspector */}
      {panelOpen && (
        <div className="hidden lg:flex w-80 xl:w-96 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col h-full overflow-hidden shadow-xs">
          <EvidenceInspector
            citations={currentInspectorCitations}
            activeCitation={activeCitation}
            onSelectCitation={(c) => setActiveCitation(c)}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}

      {/* Mobile Evidence Inspector Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto flex flex-col w-80 max-w-[90vw] h-full bg-[var(--bg-surface)] z-50 shadow-[var(--panel-shadow)]">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-[4px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] z-10"
              aria-label="Close inspector drawer"
            >
              <X className="w-4 h-4" />
            </button>
            <EvidenceInspector
              citations={currentInspectorCitations}
              activeCitation={activeCitation}
              onSelectCitation={(c) => setActiveCitation(c)}
              onClose={() => setMobileDrawerOpen(false)}
              isMobileDrawer
            />
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
        <div className="flex items-center justify-center h-full text-xs font-mono text-[var(--text-muted)] gap-2 select-none">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-citron-muted)]" />
          <span>Initializing Evidence Desk…</span>
        </div>
      }
    >
      <AskInterface />
    </Suspense>
  );
}
