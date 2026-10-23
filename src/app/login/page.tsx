'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Sparkles, ArrowRight, ShieldCheck, Key, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('architect@quellivox.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/app');
    }, 600);
  };

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/app');
    }, 400);
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

          {/* 1-Click Portfolio Demo Callout */}
          <div className="p-4 rounded-xl border border-[var(--accent-citron)]/40 bg-[var(--accent-citron)]/5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[var(--accent-citron-muted)] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-[var(--text-primary)]">Upwork / Portfolio Reviewer Mode</span>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Click below to immediately enter the authenticated workspace with pre-indexed documents, semantic citations, and RAG pipelines.
                </p>
              </div>
            </div>
            <button
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-xs font-semibold hover:bg-[var(--accent-citron-muted)] transition-all shadow-sm"
            >
              {loading ? 'Launching workspace…' : 'Enter as Lead Engineer (1-Click)'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)]">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)]">
                    Password
                  </label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Demo enabled
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-sm font-medium text-[var(--text-primary)] transition-colors mt-2"
              >
                Sign in with credentials
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
