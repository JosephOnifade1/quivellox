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
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatArchivalDateTime, formatArchivalDate } from '@/components/knowledge/knowledge-utils';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="flex flex-col items-center justify-center min-h-[350px] text-xs font-mono text-[var(--text-muted)] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-citron-muted)]" />
        <span>Loading workspace configuration…</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
              Workspace Settings
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
              Tenant Partition
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            Configure workspace identity, vector knowledge partition metadata, and multi-tenant security boundaries.
          </p>
        </div>

        {workspace && (
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded font-semibold uppercase tracking-wider border ${
              workspace.isOwner
                ? 'border-[var(--accent-citron)]/40 bg-[var(--accent-citron)]/10 text-[var(--accent-citron-muted)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
            }`}
          >
            ROLE: {workspace.role}
          </span>
        )}
      </div>

      {/* 2. Notification Alerts */}
      {error && (
        <div className="p-3.5 rounded-[6px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] flex items-center gap-2.5 text-xs text-[var(--status-error)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="p-3.5 rounded-[6px] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] flex items-center gap-2.5 text-xs text-[var(--status-success)]">
          <Check className="w-4 h-4 shrink-0" />
          <span>Workspace configuration updated and persisted successfully.</span>
        </div>
      )}

      {/* 3. Non-Owner Advisory */}
      {!workspace?.isOwner && (
        <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 flex items-start gap-3 text-xs text-[var(--text-muted)]">
          <ShieldAlert className="w-4 h-4 text-[var(--accent-citron-muted)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            You are currently accessing this workspace with <strong className="text-[var(--text-primary)]">{workspace?.role}</strong> permissions. Workspace configuration edits are restricted to the verified workspace owner.
          </p>
        </div>
      )}

      {/* 4. Workspace Configuration Form */}
      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        <form onSubmit={handleSave} className="p-5 md:p-6 space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Workspace Identity
            </span>

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                Workspace Name
              </label>
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={!workspace?.isOwner}
                placeholder="Workspace Name"
                required
                className={`w-full h-9 px-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors ${
                  !workspace?.isOwner ? 'cursor-not-allowed opacity-60' : ''
                }`}
              />
            </div>
          </div>

          {/* Read-Only Archival Metadata */}
          <div className="pt-5 border-t border-[var(--border-subtle)] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Archival Partition Specifications
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">WORKSPACE ID</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-primary)] truncate text-xs">{workspace?.id}</span>
                  <button
                    type="button"
                    onClick={() => workspace?.id && handleCopyText(workspace.id, 'ws_id')}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Copy Workspace ID"
                  >
                    {copiedId === 'ws_id' ? (
                      <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">OWNER IDENTIFIER</span>
                <span className="text-[var(--text-primary)] truncate block text-xs">{workspace?.ownerId}</span>
              </div>

              <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">DIFY DATASET PARTITION</span>
                <span className="text-[var(--text-primary)] truncate block text-xs">
                  {workspace?.difyDatasetId || 'Active local pgvector fallback'}
                </span>
              </div>

              <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">CREATION TIMESTAMP</span>
                <span className="text-[var(--text-primary)] block text-xs">
                  {formatArchivalDate(workspace?.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions (only if owner) */}
          {workspace?.isOwner && (
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Row-Level Security (RLS) partition enforced
              </span>
              <Button
                type="submit"
                variant="citron"
                size="sm"
                isLoading={saving}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Workspace
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
