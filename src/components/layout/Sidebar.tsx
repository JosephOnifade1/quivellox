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
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

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

  const primaryNav = [
    {
      name: 'Home',
      href: '/app',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Ask',
      href: '/app/ask',
      icon: Sparkles,
      exact: false,
      badge: 'RAG',
    },
    {
      name: 'Knowledge',
      href: '/app/knowledge',
      icon: FileText,
      exact: false,
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

  const handleSignOut = async () => {
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
  };

  return (
    <aside
      className={`flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] w-64 select-none shrink-0 ${className}`}
    >
      {/* Top Header & Brand */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <Link href="/app" onClick={onCloseMobile} className="focus:outline-none">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Workspace Context Switcher */}
      <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30">
        <WorkspaceSwitcher />
      </div>

      {/* Primary Action Button */}
      <div className="px-3 pt-3">
        <button
          onClick={onAddDocumentClick}
          type="button"
          className="w-full h-9 flex items-center justify-center gap-2 rounded-[6px] bg-[#151713] text-[#F5F4EE] hover:bg-[#20231E] dark:bg-[#F5F4EE] dark:text-[#151713] dark:hover:bg-[#ECEBE3] font-medium text-xs tracking-tight shadow-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)]"
        >
          <PlusCircle className="w-4 h-4 text-[var(--accent-citron)]" />
          <span>Add Documents</span>
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-2.5 py-1 font-semibold">
          Evidence Desk
        </div>
        {primaryNav.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-2.5 py-2 rounded-[5px] text-xs font-medium transition-all ${
                active
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-l-2 border-l-[var(--accent-citron)] border-y border-r border-transparent font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]/60 border border-transparent'
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
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--accent-citron)]/20 border border-[var(--accent-citron-muted)]/40 text-[var(--text-primary)] font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-2.5 py-1 font-semibold">
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
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[5px] text-xs font-medium transition-all ${
                active
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-l-2 border-l-[var(--accent-citron)] border-y border-r border-transparent font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]/60 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 text-[var(--text-muted)]" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleSignOut}
          type="button"
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[5px] text-xs font-medium text-[var(--status-error)]/85 hover:text-[var(--status-error)] hover:bg-[var(--status-error-bg)] transition-all border border-transparent mt-1"
        >
          <LogOut className="w-4 h-4 text-[var(--status-error)]/85" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer Info / Evidence Desk Version */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 text-[11px] font-mono text-[var(--text-muted)]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--text-primary)]">v1.0.0-PROD</span>
          <span className="inline-flex items-center gap-1 text-[var(--status-success)] text-[10px]">
            <ShieldCheck className="w-3 h-3 text-[var(--status-success)]" />
            Isolated
          </span>
        </div>
        <div className="mt-1 text-[10px] text-[var(--text-faint)] truncate">
          Grounded Research Desk
        </div>
      </div>
    </aside>
  );
};
