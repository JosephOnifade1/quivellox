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
} from 'lucide-react';

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

export default function ProfilePage() {
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
  const [copiedId, setCopiedId] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (!res.ok) {
        throw new Error('Failed to load profile');
      }
      const data: ProfileData = await res.json();
      setProfile(data);
      setDisplayName(data.displayName);
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

  const handleCopyId = () => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
    if (!confirm('Are you sure you want to sign out?')) return;
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
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[400px] text-sm text-[var(--text-muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[var(--accent-citron-muted)]" />
        Loading account details…
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
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Heading */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Profile & Account
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage your credentials, research identity, and workspace access.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--status-error)]/30 text-[var(--status-error)] text-xs font-medium hover:bg-[var(--status-error-bg)] transition-colors disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl border border-[var(--status-error)]/40 bg-[var(--status-error-bg)] text-xs text-[var(--status-error)] flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-xl border border-[var(--status-success)]/40 bg-[var(--status-success-bg)] text-xs text-[var(--status-success)] flex items-center gap-3">
          <Check className="w-4 h-4 shrink-0" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-citron)] text-[var(--accent-citron-text)] font-mono font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">
              {profile?.displayName}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-[var(--accent-citron-muted)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <Shield className="w-3 h-3" /> {profile?.role}
            </span>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-1 flex items-center gap-3 flex-wrap">
            <span>{profile?.email}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Joined{' '}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : 'Recently'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Account & Identity Settings
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5" /> Full Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/60 text-sm text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Active Workspace Info */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Active Workspace Boundary
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">WORKSPACE NAME</span>
                <span className="font-semibold text-[var(--text-primary)] text-sm">
                  {profile?.workspaceName}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">WORKSPACE ID</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
                    {profile?.workspaceId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors shrink-0"
                    title="Copy Workspace ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            {copiedId && (
              <span className="text-[10px] text-[var(--status-success)] font-mono block">
                Workspace ID copied to clipboard!
              </span>
            )}
          </div>

          {/* Security & Password Change */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Security & Password Update
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Leave these fields blank if you do not wish to change your password.
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
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Multi-tenant workspace isolation active
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-xs font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
