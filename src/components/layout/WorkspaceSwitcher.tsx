'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FolderOpen, ChevronDown, Check, Settings, ShieldCheck, Database } from 'lucide-react';

interface WorkspaceInfo {
  id: string;
  name: string;
  role: string;
  memberCount?: number;
  difyDatasetId?: string | null;
}

export const WorkspaceSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceInfo>({
    id: 'ws-default',
    name: 'Research Workspace',
    role: 'owner',
    memberCount: 1,
  });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function loadWorkspace() {
      try {
        const res = await fetch('/api/workspace');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.id) {
            setWorkspace({
              id: data.id,
              name: data.name || 'Research Workspace',
              role: data.role || (data.isOwner ? 'owner' : 'member'),
              memberCount: data.memberCount || 1,
              difyDatasetId: data.difyDatasetId,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load workspace metadata', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadWorkspace();
    return () => {
      mounted = false;
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
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

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] transition-all select-none shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)]"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-citron-muted)] shrink-0" />
          <span className="truncate font-medium">{loading ? 'Loading…' : workspace.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 rounded-[3px] font-mono border border-[var(--border-subtle)]/70 uppercase">
            {workspace.role === 'owner' ? 'Owner' : 'Member'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)] p-1.5 text-xs">
          {/* Active Workspace Info Card */}
          <div className="px-2 py-2 rounded-[4px] bg-[var(--bg-surface-elevated)]/60 border border-[var(--border-subtle)]/60 mb-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-primary)]">
              <span className="truncate font-heading">{workspace.name}</span>
              <span className="flex items-center gap-1 text-[var(--accent-citron-muted)] text-[10px]">
                <Check className="w-3 h-3 text-[var(--accent-citron)]" />
                Active
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Database className="w-2.5 h-2.5" />
                RLS Scoped
              </span>
              <span>·</span>
              <span>
                {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {/* Quick Partition Notice */}
          <div className="px-2 py-1.5 text-[10px] text-[var(--text-muted)] leading-tight flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[var(--status-success)] shrink-0" />
            <span>Multi-tenant isolation active</span>
          </div>

          <div className="border-t border-[var(--border-subtle)] my-1" />

          {/* Workspace Settings Link */}
          <Link
            href="/app/settings/workspace"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Workspace Settings</span>
          </Link>
        </div>
      )}
    </div>
  );
};
