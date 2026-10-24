'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface ProfileInfo {
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export const UserNavMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo>({
    displayName: 'Researcher',
    email: '',
    role: 'Workspace Member',
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setProfile({
              displayName: data.displayName || 'Researcher',
              email: data.email || '',
              role: data.role || (data.isOwner ? 'Workspace Owner' : 'Workspace Member'),
              avatarUrl: data.avatarUrl,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    }
    loadProfile();
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

  const initials = profile.displayName
    ? profile.displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'R';

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
    } catch (err) {
      console.error('Sign out failed', err);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1 pl-1.5 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--border-strong)] transition-all select-none shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)]"
      >
        <div className="w-6 h-6 rounded-[4px] bg-[#20221D] dark:bg-[#FAF8F1] text-[#FAF8F1] dark:text-[#20221D] text-[10px] font-mono font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <span className="text-xs font-medium text-[var(--text-primary)] hidden lg:inline max-w-[110px] truncate">
          {profile.displayName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)] p-1.5 text-xs select-none">
          <div className="px-2.5 py-2 border-b border-[var(--border-subtle)]">
            <div className="font-heading font-medium text-[var(--text-primary)] truncate">
              {profile.displayName}
            </div>
            <div className="font-mono text-[10px] text-[var(--text-muted)] truncate mt-0.5">
              {profile.email || 'Authenticated Researcher'}
            </div>
            <div className="mt-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                {profile.role}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/app/settings/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Account</span>
            </Link>
            <Link
              href="/app/settings/workspace"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Workspace Settings</span>
            </Link>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
