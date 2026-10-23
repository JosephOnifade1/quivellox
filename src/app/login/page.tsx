'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowRight, Lock, Mail, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Authentication service is not configured. Check your environment variables.');
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        // Map Supabase error codes to user-friendly messages
        if (
          authError.message.toLowerCase().includes('invalid login') ||
          authError.message.toLowerCase().includes('invalid credentials') ||
          authError.message.toLowerCase().includes('email not confirmed')
        ) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (authError.message.toLowerCase().includes('too many requests')) {
          setError('Too many sign-in attempts. Please wait a moment and try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Refresh the page so the middleware picks up the new session cookie
      // and redirects to the protected destination.
      router.refresh();
      router.push(redirectTo.startsWith('/app') ? redirectTo : '/app');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              AUTHENTICATED KNOWLEDGE VAULT
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Sign in to Quellivox
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Access your workspace documents, vector indices, and research conversations.
            </p>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-citron-muted)] shrink-0" />
            <span>End-to-end encrypted · Session-scoped workspace isolation</span>
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

          {/* Form */}
          <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)]">
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-medium text-[var(--text-muted)]"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-[var(--text-muted)]">
            Need an account?{' '}
            <Link href="/signup" className="text-[var(--accent-citron-muted)] font-medium hover:underline">
              Create a workspace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)] text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing authentication…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
