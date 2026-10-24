'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FileText,
  Sparkles,
  MessageSquare,
  Activity,
  Settings,
  User,
  X,
  File,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface DocumentResult {
  id: string;
  original_filename: string;
  document_index?: string;
  chunk_count?: number;
  status: string;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Document';
  href: string;
  icon: React.ReactNode;
  meta?: string;
}

export const CommandMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentResult[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseNavItems: CommandItem[] = [
    {
      id: 'nav-home',
      title: 'Overview',
      category: 'Navigation',
      href: '/app',
      icon: <LayoutDashboard className="w-4 h-4" />,
      meta: 'Dashboard & summary',
    },
    {
      id: 'nav-ask',
      title: 'Ask Quivellox',
      category: 'Navigation',
      href: '/app/ask',
      icon: <Sparkles className="w-4 h-4 text-[var(--accent-citron-muted)]" />,
      meta: 'Grounded inquiry & citations',
    },
    {
      id: 'nav-knowledge',
      title: 'Knowledge Library',
      category: 'Navigation',
      href: '/app/knowledge',
      icon: <FileText className="w-4 h-4" />,
      meta: 'Document repository & indexing',
    },
    {
      id: 'nav-conversations',
      title: 'Conversations',
      category: 'Navigation',
      href: '/app/conversations',
      icon: <MessageSquare className="w-4 h-4" />,
      meta: 'Research history',
    },
    {
      id: 'nav-activity',
      title: 'Activity Log',
      category: 'Navigation',
      href: '/app/activity',
      icon: <Activity className="w-4 h-4" />,
      meta: 'Workspace audit trail',
    },
    {
      id: 'nav-workspace',
      title: 'Workspace Settings',
      category: 'Navigation',
      href: '/app/settings/workspace',
      icon: <Settings className="w-4 h-4" />,
      meta: 'Tenant & member config',
    },
    {
      id: 'nav-profile',
      title: 'Profile & Account',
      category: 'Navigation',
      href: '/app/settings/profile',
      icon: <User className="w-4 h-4" />,
      meta: 'Personal researcher profile',
    },
  ];

  // Fetch real documents matching search query
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDocuments([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setDocuments([]);
      return;
    }

    let active = true;
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await fetch(`/api/documents?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.documents)) {
            setDocuments(data.documents.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Command search error', err);
      } finally {
        if (active) setLoadingDocs(false);
      }
    };

    const debounce = setTimeout(fetchDocs, 180);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [query, isOpen]);

  // Combine items
  const filteredNavItems = baseNavItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.meta && item.meta.toLowerCase().includes(query.toLowerCase()))
  );

  const documentItems: CommandItem[] = documents.map((doc) => ({
    id: `doc-${doc.id}`,
    title: doc.original_filename,
    category: 'Document',
    href: `/app/knowledge/${doc.id}`,
    icon: <File className="w-4 h-4 text-[var(--accent-citron-muted)]" />,
    meta: `${doc.document_index || 'DOC'} · ${doc.chunk_count || 0} chunks · [${doc.status.toUpperCase()}]`,
  }));

  const allItems = [...documentItems, ...filteredNavItems];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, documents.length]);

  const executeAction = (item: CommandItem) => {
    onClose();
    router.push(item.href);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        executeAction(allItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-xl rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)] overflow-hidden flex flex-col max-h-[75vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspace documents or jump to…"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none"
          />
          {loadingDocs && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)] mr-2 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
            aria-label="Close command search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)] font-mono">
              No matching destinations or documents found.
            </div>
          ) : (
            <>
              {documentItems.length > 0 && (
                <div className="px-2 pt-1.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Workspace Documents
                </div>
              )}
              {documentItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => executeAction(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[5px] text-xs transition-colors select-none text-left ${
                      isSelected
                        ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-l-2 border-l-[var(--accent-citron)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {item.icon}
                      <span className="truncate font-medium text-[var(--text-primary)]">
                        {item.title}
                      </span>
                    </div>
                    {item.meta && (
                      <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                        {item.meta}
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredNavItems.length > 0 && (
                <div className="px-2 pt-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Navigation
                </div>
              )}
              {filteredNavItems.map((item, idx) => {
                const actualIdx = idx + documentItems.length;
                const isSelected = selectedIndex === actualIdx;
                return (
                  <button
                    key={item.id}
                    onClick={() => executeAction(item)}
                    onMouseEnter={() => setSelectedIndex(actualIdx)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[5px] text-xs transition-colors select-none text-left ${
                      isSelected
                        ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-l-2 border-l-[var(--accent-citron)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span className="font-medium text-[var(--text-primary)]">{item.title}</span>
                    </div>
                    {item.meta && (
                      <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                        {item.meta}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px]">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px]">ESC</kbd> Close
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-faint)]">Evidence Desk Shell</span>
        </div>
      </div>
    </div>
  );
};
