'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SystemStatusBadge } from './SystemStatusBadge';
import { UserNavMenu } from './UserNavMenu';
import Link from 'next/link';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenSearch?: () => void;
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenSearch,
  title,
  description,
  breadcrumbs = [],
  action,
}) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 md:px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          type="button"
          className="md:hidden p-1.5 rounded-[5px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb & Title */}
        <div className="flex flex-col overflow-hidden">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] truncate">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <span className="text-[var(--border-strong)]">/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-[var(--text-primary)] transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-primary)] font-medium truncate">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {title && (
            <div className="flex items-center gap-2 overflow-hidden">
              <h1 className="text-sm font-heading font-semibold tracking-tight text-[var(--text-primary)] truncate">
                {title}
              </h1>
              {description && (
                <span className="hidden xl:inline text-xs text-[var(--text-muted)] truncate">
                  — {description}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center / Right-side Controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Global Search Entry Point */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 h-8 px-2.5 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--border-strong)] text-xs text-[var(--text-muted)] transition-all select-none shadow-xs group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)]"
          aria-label="Search workspace documents or navigate"
        >
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          <span className="hidden sm:inline text-xs text-[var(--text-faint)] group-hover:text-[var(--text-muted)]">
            Search or jump to…
          </span>
          <kbd className="font-mono text-[10px] px-1 py-0.5 rounded-[3px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] leading-none">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>

        {/* System Diagnostics / Provider Health */}
        <SystemStatusBadge className="hidden md:block" />

        {/* Theme Toggle */}
        <ThemeToggle className="hidden sm:inline-flex" />

        {/* User Account / Profile Menu */}
        <UserNavMenu />

        {/* Contextual Action Button if passed */}
        {action && <div className="ml-1">{action}</div>}
      </div>
    </header>
  );
};
