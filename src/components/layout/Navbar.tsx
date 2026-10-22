'use client';

import React from 'react';
import { Menu, ShieldCheck, Database, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  title,
  description,
  breadcrumbs = [],
  action,
}) => {
  return (
    <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          type="button"
          className="md:hidden p-2 rounded-[8px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb & Title */}
        <div className="flex flex-col">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-[var(--text-primary)] transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-primary)] font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {title && (
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold tracking-tight text-[var(--text-primary)]">
                {title}
              </h1>
              {description && (
                <span className="hidden lg:inline text-xs text-[var(--text-muted)]">
                  — {description}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right-side Controls */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[11px] font-mono text-[var(--text-muted)]">
          <Database className="w-3.5 h-3.5 text-[var(--accent-citron-muted)]" />
          <span>RLS Enforced</span>
          <span className="text-[var(--border-strong)]">|</span>
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)]" />
          <span>Private Vault</span>
        </div>

        <ThemeToggle className="hidden md:inline-flex" />

        {action && <div className="ml-1">{action}</div>}
      </div>
    </header>
  );
};
