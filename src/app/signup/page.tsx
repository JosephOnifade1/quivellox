'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Sparkles, ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('Research Workspace');
  const [name, setName] = useState('Senior Research Lead');
  const [email, setEmail] = useState('lead@quellivox.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/app');
    }, 600);
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
              CREATE WORKSPACE
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Deploy your knowledge assistant
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Establish your isolated vector partition and begin indexing enterprise documents.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--panel-shadow)]">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Workspace Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Work Email
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
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Password
                </label>
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
                className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors mt-2"
              >
                {loading ? 'Creating workspace…' : 'Initialize Workspace'}
                <ArrowRight className="w-4 h-4" />
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
