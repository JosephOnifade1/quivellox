'use client';

import React, { useState } from 'react';
import { User, Mail, Shield, Check, Save } from 'lucide-react';

export default function ProfilePage() {
  const [name, setName] = useState('Staff AI Architect');
  const [email, setEmail] = useState('architect@quellivox.internal');
  const [role, setRole] = useState('Lead Systems Engineer');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[var(--border-subtle)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Profile & Account
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Manage your credentials, research identity, and session permissions.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Identity Configuration
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Account Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Shield className="w-3.5 h-3.5" /> Security Role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-citron)] transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Multi-tenant security isolation active
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-xs font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Changes Saved' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
