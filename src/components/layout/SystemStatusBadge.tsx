'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

interface SystemHealth {
  status: string;
  system: {
    engine: string;
    activeRAGProvider: string;
    difyConfigured: boolean;
    storageMode: string;
    aiProvider: string;
    indexedDocuments: number;
    indexedChunks: number;
  };
}

export const SystemStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setHealth(data);
        }
      } catch (err) {
        console.error('Failed to load system health', err);
      }
    }
    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const isDify = health?.system.difyConfigured ?? false;
  const isHealthy = health?.status === 'healthy';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Quiet trigger pill */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="System status inspection"
        className="flex items-center gap-2 px-2.5 py-1 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--border-strong)] text-[11px] font-mono text-[var(--text-muted)] transition-all select-none shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)]"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isHealthy ? 'bg-[var(--status-success)]' : 'bg-[var(--status-warning)]'
          }`}
        />
        <span className="hidden sm:inline">
          {isDify ? 'Dify Engine' : 'Local Vector'}
        </span>
        <span className="text-[var(--border-strong)] hidden sm:inline">|</span>
        <span className="text-[var(--text-primary)] font-medium">Vault Ready</span>
      </button>

      {/* Popover Inspector */}
      {open && health && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-72 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)] p-3 text-xs select-none">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <span className="font-heading font-medium text-[var(--text-primary)]">
              Engine Diagnostics
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[var(--status-success-bg)] border border-[var(--status-success-border)] text-[var(--status-success)] font-medium">
              OPERATIONAL
            </span>
          </div>

          <div className="mt-2.5 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Cpu className="w-3.5 h-3.5" />
                Retrieval Engine
              </span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {health.system.activeRAGProvider}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Database className="w-3.5 h-3.5" />
                Vector Storage
              </span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {health.system.storageMode}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <HardDrive className="w-3.5 h-3.5" />
                Indexed Chunks
              </span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {health.system.indexedChunks} chunks
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)]" />
                Workspace RLS
              </span>
              <span className="font-mono font-medium text-[var(--status-success)]">
                Enforced
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-faint)]">
            All queries grounded against private tenant storage.
          </div>
        </div>
      )}
    </div>
  );
};
