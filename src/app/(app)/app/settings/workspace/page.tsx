'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Database,
  Server,
  Check,
  Save,
  ShieldCheck,
  Loader2,
  Copy,
  AlertCircle,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface WorkspaceData {
  id: string;
  name: string;
  ownerId: string;
  isOwner: boolean;
  role: string;
  difyDatasetId: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [retrievalTopK, setRetrievalTopK] = useState('4');
  const [chunkWindow, setChunkWindow] = useState('512');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/workspace');
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load workspace settings');
        }
        const data = await res.json();
        setWorkspace(data);
        setWorkspaceName(data.name || '');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading workspace';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, []);

  const handleCopyId = () => {
    if (!workspace?.id) return;
    navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.isOwner) return;

    if (!workspaceName.trim()) {
      setError('Workspace name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceName.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update workspace');
      }

      const resData = await res.json();
      if (resData.workspace) {
        setWorkspace((prev) =>
          prev ? { ...prev, name: resData.workspace.name, updatedAt: resData.workspace.updatedAt } : null
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating workspace';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[300px] text-sm text-[var(--text-muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[var(--accent-citron-muted)]" /> Loading workspace configuration…
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Workspace Settings
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Tune retrieval hyperparameters, vector index partitions, and enterprise policies.
            </p>
          </div>
          {workspace && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider border ${
                workspace.isOwner
                  ? 'border-[var(--accent-citron)]/40 bg-[var(--accent-citron)]/10 text-[var(--accent-citron-muted)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
              }`}
            >
              {workspace.role}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-[var(--status-error)]/30 bg-[var(--status-error-bg)] flex items-center gap-2.5 text-xs text-[var(--status-error)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="p-3.5 rounded-lg border border-[var(--status-success)]/30 bg-[var(--status-success-bg)] flex items-center gap-2.5 text-xs text-[var(--status-success)]">
          <Check className="w-4 h-4 shrink-0" />
          <span>Workspace configuration saved successfully.</span>
        </div>
      )}

      {!workspace?.isOwner && (
        <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
          <ShieldAlert className="w-4 h-4 text-[var(--accent-citron-muted)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Read-only mode: You are a member of this workspace. Only the workspace owner can modify workspace name and indexing parameters.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span>Workspace Parameters</span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
              <Users className="w-3 h-3" />
              <span>{workspace?.memberCount || 1} Member{workspace?.memberCount === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5" /> Workspace Name
            </label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={!workspace?.isOwner || saving}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors disabled:opacity-60"
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
                disabled={!workspace?.isOwner || saving}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors disabled:opacity-60"
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
                disabled={!workspace?.isOwner || saving}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors disabled:opacity-60"
              >
                <option value="256">256 tokens (Dense precision)</option>
                <option value="512">512 tokens (Balanced)</option>
                <option value="1024">1024 tokens (Long context)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-citron-muted)]" />
                Multi-Tenant Partition Guarantee
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Copy Workspace ID"
              >
                {copied ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Workspace ID: <code className="font-mono text-[var(--text-primary)] bg-[var(--bg-main)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">{workspace?.id || '…'}</code>.
              Row-Level Security (RLS) policies enforce cryptographic tenant isolation at both the document catalog and vector index boundaries.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={!workspace?.isOwner || saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-xs font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving…' : saved ? 'Settings Saved' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
