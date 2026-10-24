'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Check,
  Save,
  KeyRound,
  Building2,
  Copy,
  LogOut,
  Loader2,
  AlertCircle,
  Calendar,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatArchivalDateTime, formatArchivalDate } from '@/components/knowledge/knowledge-utils';

interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  themePreference?: string;
  workspaceId: string;
  workspaceName: string;
  isOwner: boolean;
  role: string;
  createdAt: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (!res.ok) {
        throw new Error('Failed to load profile record');
      }
      const data: ProfileData = await res.json();
      setProfile(data);
      setDisplayName(data.displayName || '');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Could not load user profile. Please check your session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedSuccess(false);

    if (newPassword && newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          password: newPassword ? newPassword.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSavedSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchProfile();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out of Quivellox?');
    if (!confirmed) return;

    setSigningOut(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-mono text-[var(--text-muted)] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-citron-muted)]" />
        <span>Loading account identity…</span>
      </div>
    );
  }

  const initials = (profile?.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* 1. Header & Sign Out Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight text-[var(--text-primary)]">
              Profile & Account
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
              Identity Settings
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            Manage your research identity, security credentials, and authorized workspace partition.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          isLoading={signingOut}
          icon={<LogOut className="w-3.5 h-3.5 text-[var(--status-error)]" />}
          className="text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
        >
          Sign Out
        </Button>
      </div>

      {/* 2. Notification Banners */}
      {errorMessage && (
        <div className="p-3.5 rounded-[6px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-xs text-[var(--status-error)] flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 rounded-[6px] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-xs text-[var(--status-success)] flex items-center gap-2.5">
          <Check className="w-4 h-4 shrink-0" />
          <span>Profile updates persisted successfully.</span>
        </div>
      )}

      {/* 3. Account Identity Banner */}
      <div className="p-5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-14 h-14 rounded-[8px] bg-[var(--accent-citron)] text-[var(--accent-citron-text)] font-mono font-bold text-lg flex items-center justify-center shrink-0">
          {initials}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
              {profile?.displayName}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-[var(--accent-citron-muted)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <Shield className="w-3 h-3" /> {profile?.role}
            </span>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-3 flex-wrap">
            <span>{profile?.email}</span>
            <span>·</span>
            <span>Account created {formatArchivalDate(profile?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 4. Settings Form */}
      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        <form onSubmit={handleSaveProfile} className="p-5 md:p-6 space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Personal Identity
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Researcher Name"
                  required
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                  Primary Email (Read-Only)
                </label>
                <input
                  value={profile?.email || ''}
                  disabled
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/60 text-sm text-[var(--text-muted)] cursor-not-allowed font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Active Workspace Info */}
          <div className="pt-5 border-t border-[var(--border-subtle)] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Active Workspace Boundary
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">WORKSPACE NAME</span>
                <span className="font-semibold text-[var(--text-primary)] text-sm">
                  {profile?.workspaceName}
                </span>
              </div>

              <div className="p-3.5 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">USER ID</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[var(--text-primary)] truncate">
                    {profile?.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => profile?.id && handleCopyText(profile.id, 'user_id')}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Copy User ID"
                  >
                    {copiedId === 'user_id' ? (
                      <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Password Update */}
          <div className="pt-5 border-t border-[var(--border-subtle)] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Security Credentials
            </span>
            <p className="text-xs text-[var(--text-muted)]">
              Leave password fields empty to maintain your current credentials.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-9 px-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Multi-tenant vault encryption active
            </span>
            <Button
              type="submit"
              variant="citron"
              size="sm"
              isLoading={saving}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
