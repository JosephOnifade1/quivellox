'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  MessageSquare,
  Activity,
  Settings,
  User,
  PlusCircle,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface SidebarProps {
  onAddDocumentClick?: () => void;
  className?: string;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onAddDocumentClick,
  className = '',
  onCloseMobile,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/app',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Knowledge',
      href: '/app/knowledge',
      icon: FileText,
      exact: false,
    },
    {
      name: 'Ask Quellivox',
      href: '/app/ask',
      icon: Sparkles,
      exact: false,
      badge: 'RAG',
    },
    {
      name: 'Conversations',
      href: '/app/conversations',
      icon: MessageSquare,
      exact: false,
    },
    {
      name: 'Activity',
      href: '/app/activity',
      icon: Activity,
      exact: false,
    },
  ];

  const secondaryNav = [
    {
      name: 'Workspace Settings',
      href: '/app/settings/workspace',
      icon: Settings,
    },
    {
      name: 'Profile & Account',
      href: '/app/settings/profile',
      icon: User,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] w-64 select-none shrink-0 ${className}`}
    >
      {/* Top Header & Brand */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <Link href="/app" onClick={onCloseMobile} className="focus:outline-none">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Workspace Selector Bar */}
      <div className="px-3 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/50">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-citron-muted)] shrink-0" />
            <span className="truncate font-medium">Research Workspace</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 rounded font-mono">
            DEV
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-3 pt-3">
        <button
          onClick={onAddDocumentClick}
          type="button"
          className="w-full h-9 flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent-citron)] text-[var(--accent-citron-text)] hover:bg-[var(--accent-citron-muted)] font-semibold text-xs tracking-wide shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-citron)]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Documents</span>
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 font-semibold">
          Knowledge Desk
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-2.5 py-2 rounded-[8px] text-xs font-medium transition-all ${
                active
                  ? 'bg-[var(--accent-citron)]/15 text-[var(--text-primary)] border border-[var(--accent-citron)]/40 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    active ? 'text-[var(--accent-citron-muted)]' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-citron)] text-[var(--accent-citron-text)] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 font-semibold">
          Settings & Config
        </div>
        {secondaryNav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-xs font-medium transition-all ${
                active
                  ? 'bg-[var(--accent-citron)]/15 text-[var(--text-primary)] border border-[var(--accent-citron)]/40 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 text-[var(--text-muted)]" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/signout', {
                method: 'POST',
                headers: { Accept: 'application/json' },
              });
            } catch (err) {
              console.error('Sign out error', err);
            } finally {
              window.location.href = '/login';
            }
          }}
          type="button"
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-xs font-medium text-[var(--status-error)]/80 hover:text-[var(--status-error)] hover:bg-[var(--status-error)]/10 transition-all border border-transparent mt-1"
        >
          <LogOut className="w-4 h-4 text-[var(--status-error)]/80" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer Info / Evidence Desk Version */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 text-[11px] font-mono text-[var(--text-muted)]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--text-primary)]">v1.0.0-PROD</span>
          <span className="inline-flex items-center gap-1 text-[var(--status-success)] text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
            pgvector live
          </span>
        </div>
        <div className="mt-1 text-[10px] text-[var(--text-muted)] truncate">
          Grounded RAG Engine Active
        </div>
      </div>
    </aside>
  );
};
