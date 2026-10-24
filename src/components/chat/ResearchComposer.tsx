'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Loader2, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ResearchComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const ResearchComposer: React.FC<ResearchComposerProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  disabled = false,
  placeholder = 'Inquire across your indexed documents with grounded citations…',
  initialValue = '',
  className = '',
}) => {
  const [input, setInput] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 md:p-4 shrink-0 ${className}`}>
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Scope and Grounding Header Badge */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[var(--text-muted)] select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
              <Database className="w-3 h-3 text-[var(--accent-citron-muted)]" />
              Scope: Authorized Workspace Corpus
            </span>
            <span className="text-[var(--border-strong)] hidden sm:inline">·</span>
            <span className="hidden sm:inline">Top-4 hybrid reranked</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--status-success)] text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>Zero Hallucination Filter</span>
          </div>
        </div>

        {/* Textarea Input Container */}
        <form onSubmit={handleSubmit} className="relative rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-main)] focus-within:border-[var(--border-strong)] focus-within:ring-1 focus-within:ring-[var(--accent-citron)] transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={2}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] p-3 pr-24 focus:outline-none transition-colors max-h-48 leading-relaxed"
          />

          {/* Action buttons inside textarea footer */}
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            {isLoading && onStopGeneration ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="h-8 px-2.5 rounded-[5px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error)] hover:opacity-90 text-xs font-mono font-medium flex items-center gap-1 transition-all"
                title="Cancel ongoing query"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className="h-8 px-3 rounded-[5px] bg-[#20221D] text-[#FAF8F1] hover:bg-[#2F322B] dark:bg-[#FAF8F1] dark:text-[#20221D] dark:hover:bg-[#EAE8DF] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)] select-none"
                title="Execute inquiry (Enter)"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5 text-[var(--accent-citron)]" />
              </button>
            )}
          </div>
        </form>

        {/* Keyboard Hints & Operational Disclaimer */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[var(--text-muted)] select-none">
          <span>Press ↵ Enter to inquire · Shift+↵ for newline</span>
          <span className="hidden md:inline text-[var(--text-faint)]">
            Every statement backed by verified chunk offset
          </span>
        </div>
      </div>
    </div>
  );
};
