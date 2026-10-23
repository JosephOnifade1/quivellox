'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowRight, Building2, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export default function SignupPage() {
  const router = useRouter();

  const [workspaceName, setWorkspaceName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedWorkspace = workspaceName.trim();

    if (!trimmedEmail || !password || !trimmedName || !trimmedWorkspace) {
      setError('All fields are required.');
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Authentication service is not configured. Check your environment variables.');
        return;
      }

      const { error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            display_name: trimmedName,
            workspace_name: trimmedWorkspace,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered') ||
            authError.message.toLowerCase().includes('user already exists')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (authError.message.toLowerCase().includes('password')) {
          setError('Password does not meet requirements. Use at least 8 characters.');
        } else if (authError.message.toLowerCase().includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Supabase may require email confirmation depending on project settings.
      // Show success state; the handle_new_user trigger creates the workspace.
      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
        <header className="h-16 px-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <Link href="/" className="focus:outline-none">
            <Logo size="md" />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 mx-auto text-[var(--accent-citron)]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Workspace created</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Check your email to confirm your account. Once confirmed, you can sign in to access your workspace.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors"
            >
              Go to Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top Header */}
      <header className="h-16 px-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <Link href="/" className="focus:outline-none">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--accent-citron-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron)]" />
              CREATE WORKSPACE
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Deploy your knowledge assistant
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Establish your isolated vector partition and begin indexing enterprise documents.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--status-error)]/40 bg-[var(--status-error)]/8 text-xs text-[var(--status-error)]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-6 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs">
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="signup-workspace"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
                >
                  Workspace Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="signup-workspace"
                    type="text"
                    required
                    disabled={loading}
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Research Workspace"
                    className="w-full h-9 pl-9 pr-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    disabled={loading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-9 pl-9 pr-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
                >
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-9 pl-9 pr-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
                >
                  Password <span className="text-[var(--text-muted)] font-normal">(min 8 characters)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-9 pr-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-[6px] bg-[#151713] text-[#F5F4EE] hover:bg-[#20231E] dark:bg-[#F5F4EE] dark:text-[#151713] dark:hover:bg-[#ECEBE3] text-sm font-medium transition-all shadow-xs mt-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)]"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Creating workspace…
                  </>
                ) : (
                  <>
                    Initialize Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--accent-citron-muted)] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
