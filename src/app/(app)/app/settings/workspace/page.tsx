'use client';

import React, { useState } from 'react';
import { Building2, Database, Key, Server, Check, Save, ShieldCheck } from 'lucide-react';

export default function WorkspaceSettingsPage() {
  const [workspaceName, setWorkspaceName] = useState('Research Workspace');
  const [retrievalTopK, setRetrievalTopK] = useState('4');
  const [chunkWindow, setChunkWindow] = useState('512');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[var(--border-subtle)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Workspace Settings
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Tune retrieval hyperparameters, vector index partitions, and enterprise policies.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Workspace Parameters
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5" /> Workspace Name
            </label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
                <Database className="w-3.5 h-3.5" /> Retrieval Top-K Passages
              </label>
              <select
                value={retrievalTopK}
                onChange={(e) => setRetrievalTopK(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
              >
                <option value="3">3 candidate chunks</option>
                <option value="4">4 candidate chunks (recommended)</option>
                <option value="6">6 candidate chunks</option>
                <option value="8">8 candidate chunks</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
                <Server className="w-3.5 h-3.5" /> Chunk Target Window
              </label>
              <select
                value={chunkWindow}
                onChange={(e) => setChunkWindow(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
              >
                <option value="256">256 tokens (Dense precision)</option>
                <option value="512">512 tokens (Balanced)</option>
                <option value="1024">1024 tokens (Long context)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-citron-muted)]" />
              Multi-Tenant Partition Guarantee
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Workspace ID: <code className="font-mono text-[var(--text-primary)]">ws-demo-77492a</code>.
              Row-Level Security (RLS) policies enforce cryptographic tenant isolation at both the document catalog and vector index boundaries.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-xs font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Settings Saved' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
