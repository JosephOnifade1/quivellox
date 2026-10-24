'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCode,
  CheckCircle2,
  Database,
  Terminal,
  Menu,
  X,
  Layers,
  Sparkles,
  Shield,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors selection:bg-[#D8F36A] selection:text-[#151713]">
      {/* ─── 1. TOP NAVIGATION ─── */}
      <header className="sticky top-0 z-50 bg-[var(--bg-main)]/95 dark:bg-[#111814]/95 backdrop-blur-md border-b border-[var(--border-subtle)]/80 dark:border-[#222C26]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand Wordmark & Descriptor */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" subtitle="Private knowledge workspace" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-9 text-sm text-[var(--text-muted)]">
            <a href="#platform" className="hover:text-[var(--text-primary)] transition-colors">
              Platform
            </a>
            <a href="#evidence-chain" className="hover:text-[var(--text-primary)] transition-colors">
              How it works
            </a>
            <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">
              Security
            </a>
            <a href="#documentation" className="hover:text-[var(--text-primary)] transition-colors">
              Documentation
            </a>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden sm:flex items-center gap-5">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-muted)] transition-colors px-1 py-1"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[6px] bg-[#D8F36A] text-[#151713] text-sm font-bold hover:bg-[#cbe65e] active:scale-95 transition-all shadow-xs"
            >
              <span>Open workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#151713] dark:text-[#F5F4EE]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-6 py-4 border-b border-[var(--border-subtle)] dark:border-[#222C26] bg-[var(--bg-main)] dark:bg-[#111814] space-y-3 text-sm">
            <a
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[var(--text-muted)]"
            >
              Platform
            </a>
            <a
              href="#evidence-chain"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[var(--text-muted)]"
            >
              How it works
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[var(--text-muted)]"
            >
              Security
            </a>
            <a
              href="#documentation"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[var(--text-muted)]"
            >
              Documentation
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-center py-2.5 rounded-[6px] border border-[var(--border-subtle)] dark:border-[#343930] text-sm font-semibold text-[var(--text-primary)]"
              >
                Sign in
              </Link>
              <Link
                href="/app"
                className="text-center py-2.5 rounded-[6px] bg-[#D8F36A] text-[#151713] text-sm font-bold"
              >
                Open workspace &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SECTION ─── */}
      <section id="platform" className="pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          {/* Left Column: Editorial Headline & Messaging */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            {/* Monospace Eyebrow */}
            <div className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              PRIVATE KNOWLEDGE / VERIFIED ANSWERS
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[var(--text-primary)] leading-[1.08]">
              Your documents. <br />
              Understood. <br />
              Every answer, traceable.
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed max-w-md">
              Ask questions across your private documents and get grounded answers with direct access to the exact passages and sources behind every claim. Quellivox connects your knowledge with trusted retrieval and verifiable evidence.
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-[6px] bg-[#20221D] text-[#FAF8F1] dark:bg-[#FAF8F1] dark:text-[#20221D] text-xs font-bold hover:bg-[#2F322B] dark:hover:bg-[#EAE8DF] transition-colors shadow-xs"
              >
                <span>Explore the workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href="#evidence-chain"
                className="inline-flex items-center justify-center h-11 px-5 rounded-[6px] border border-[var(--border-subtle)] dark:border-[#343930] bg-[var(--bg-surface)] dark:bg-[#1E231B] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] dark:hover:bg-[#292D26] transition-colors"
              >
                How it works
              </a>
            </div>

            {/* Quiet Metadata Line */}
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[var(--text-faint)]">
              <Lock className="w-3.5 h-3.5" />
              <span>Private by design · Source-linked answers</span>
            </div>
          </div>

          {/* Right Column: High-Fidelity Quellivox Workspace Mockup Centerpiece */}
          <div className="lg:col-span-7">
            <div className="rounded-[10px] border border-[#2E3B33] bg-[#18211D] text-[#F5F4EE] shadow-2xl overflow-hidden">
              {/* Mockup App Header */}
              <div className="px-4 py-2.5 border-b border-[#2E3B33] bg-[#131B17] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-[4px] bg-[#222C26] border border-[#2E3B33] flex items-center justify-center text-[10px] font-bold text-[#D8F36A]">
                    QV
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#222C26] border border-[#2E3B33] text-[11px] text-[#E1E5DE]">
                    <span>Acme Corp Workspace</span>
                    <ChevronDown className="w-3 h-3 text-[#8E9387]" />
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-[#111714] border border-[#2E3B33] text-[#8E9387] text-[11px] w-56">
                  <Search className="w-3 h-3" />
                  <span className="flex-1 truncate">Search documents…</span>
                  <span className="text-[9px] px-1 rounded bg-[#222C26]">⌘K</span>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#8E9387]">
                    <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                    <span className="hidden sm:inline">Dify Connected</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#222C26] border border-[#2E3B33] text-[10px] font-bold flex items-center justify-center text-[#E1E5DE]">
                    JO
                  </div>
                </div>
              </div>

              {/* Mockup Workspace Body: 3-column Layout */}
              <div className="grid grid-cols-12 min-h-[440px]">
                {/* 1. Mini-Sidebar */}
                <div className="col-span-2 hidden md:flex flex-col justify-between p-3 border-r border-[#2E3B33] bg-[#141C18] text-[11px] font-mono text-[#8E9387]">
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 rounded text-[#8E9387]">Home</div>
                    <div className="px-2 py-1.5 rounded bg-[#222C26] text-[#D8F36A] font-semibold flex items-center justify-between border-l-2 border-[#D8F36A]">
                      <span>Ask</span>
                    </div>
                    <div className="px-2 py-1.5 rounded text-[#8E9387]">Knowledge</div>
                    <div className="px-2 py-1.5 rounded text-[#8E9387]">Conversations</div>
                    <div className="px-2 py-1.5 rounded text-[#8E9387]">Activity</div>
                  </div>

                  <div className="space-y-1 pt-4 border-t border-[#2E3B33] text-[10px]">
                    <div className="px-2 py-1">Settings</div>
                    <div className="px-2 py-1">Profile</div>
                    <div className="px-2 py-1 text-[#E1E5DE] font-semibold truncate">
                      Acme Corp &rarr;
                    </div>
                  </div>
                </div>

                {/* 2. Central Conversation Area (Warm Archival Card) */}
                <div className="col-span-12 md:col-span-6 p-4 bg-[var(--bg-surface)] text-[var(--text-primary)] space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-xs font-heading font-bold text-[var(--text-primary)]">
                      Ask Quellivox
                    </div>

                    {/* Question Composer Box */}
                    <div className="p-2.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-main)] flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-primary)] font-medium truncate">
                        What is the incident escalation timeline?
                      </span>
                      <div className="w-6 h-6 rounded bg-[#20221D] text-[#FAF8F1] flex items-center justify-center shrink-0">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center gap-1">
                        All documents <ChevronDown className="w-2.5 h-2.5" />
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center gap-1">
                        Top-4 reranked <ChevronDown className="w-2.5 h-2.5" />
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#D8F36A]/20 border border-[#B7CE58]/50 text-[var(--text-primary)] font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#15803D]" /> Zero hallucination filter
                      </span>
                    </div>

                    {/* Synthesized Answer Card */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block font-semibold">
                        Answer
                      </span>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                        The incident <strong className="font-semibold">escalation timeline</strong> is defined in the security incident response policy. Initial detection and triage occurs <strong className="font-semibold">within 15 minutes</strong>, followed by escalation to the security team <strong className="font-semibold">within 1 hour</strong>. If the incident is critical, <strong className="font-semibold">senior leadership is notified within 4 hours</strong>.{' '}
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold">
                          <span className="px-1 py-0.2 rounded bg-[#D8F36A] text-[#151713] border border-[#B7CE58]">[1]</span>
                          <span className="px-1 py-0.2 rounded bg-[#D8F36A] text-[#151713] border border-[#B7CE58]">[2]</span>
                        </span>
                      </p>

                      <div className="space-y-1 text-xs text-[var(--text-muted)] pt-1">
                        <div className="font-semibold text-[11px] text-[var(--text-primary)]">Key points</div>
                        <ul className="space-y-0.5 text-[11px] pl-3 list-disc">
                          <li>Initial detection and triage: 0–15 minutes</li>
                          <li>Escalation to security team: within 1 hour</li>
                          <li>Senior leadership notification (critical): within 4 hours</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-faint)]">
                    <span>2 sources · 3.4k tokens · 42s</span>
                  </div>
                </div>

                {/* 3. Evidence Inspector Panel */}
                <div className="col-span-12 md:col-span-4 p-3.5 bg-[#18211D] text-[11px] space-y-3 border-t md:border-t-0 md:border-l border-[#2E3B33]">
                  {/* Inspector Tabs */}
                  <div className="flex items-center justify-between border-b border-[#2E3B33] pb-2 text-[10px] font-mono uppercase tracking-wider text-[#8E9387]">
                    <div className="flex items-center gap-3">
                      <span className="text-[#D8F36A] font-bold pb-1 border-b border-[#D8F36A]">Evidence 2</span>
                      <span>Sources</span>
                      <span>Details</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E9387]">
                    <span>Source 1 of 2</span>
                    <div className="flex items-center gap-1 text-[#E1E5DE]">
                      <ChevronLeft className="w-3 h-3 cursor-pointer" />
                      <ChevronRight className="w-3 h-3 cursor-pointer" />
                    </div>
                  </div>

                  {/* Document Card */}
                  <div className="p-2.5 rounded-[6px] bg-[#222C26] border border-[#2E3B33] space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-[2px] bg-[#E11D48]/20 border border-[#E11D48]/40 text-[#FB7185] flex items-center justify-center shrink-0 mt-0.5 text-[8px] font-bold">
                        PDF
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#F5F4EE] truncate text-xs">
                          security-incident-response.pdf
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#8E9387] mt-0.5">
                          <span className="px-1 rounded bg-[#18211D] border border-[#2E3B33] text-[#D8F36A]">
                            DOC-001
                          </span>
                          <span className="px-1 rounded bg-[#18211D] border border-[#2E3B33] text-[#15803D]">
                            READY
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-[#8E9387] pt-1 border-t border-[#2E3B33]">
                      94.2% match · Page 12 · Chunk 4
                    </div>

                    {/* Verbatim Excerpt Quote */}
                    <div className="p-2 rounded bg-[#18211D] border border-[#2E3B33] font-serif italic text-[11px] leading-relaxed text-[#E1E5DE]">
                      &ldquo;The initial detection and triage must be completed{' '}
                      <mark className="bg-[#D8F36A] text-[#151713] not-italic font-sans font-semibold px-0.5 rounded">
                        within 15 minutes
                      </mark>{' '}
                      of alert identification. Escalation to the security team shall occur{' '}
                      <mark className="bg-[#D8F36A] text-[#151713] not-italic font-sans font-semibold px-0.5 rounded">
                        within 1 hour
                      </mark>
                      …&rdquo;
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E9387] pt-1">
                    <span className="hover:text-[#F5F4EE] cursor-pointer flex items-center gap-1">
                      View document &rarr;
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#8E9387]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. THE EVIDENCE CHAIN SECTION (DARK FOREST CONTRAST) ─── */}
      <section id="evidence-chain" className="py-20 md:py-24 px-6 bg-[#111814] text-[#F5F4EE] border-t border-[#222C26]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="max-w-2xl space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#D8F36A] font-semibold">
              THE EVIDENCE CHAIN
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F5F4EE] leading-tight">
              Not just an answer. <br />
              A path back to the source.
            </h2>
            <p className="text-sm sm:text-base text-[#A3A89D] leading-relaxed max-w-xl">
              Every answer is grounded in your documents, with direct links to the exact passages used. No guesswork. No black boxes.
            </p>
          </div>

          {/* 3 Connected Stages Composition with Connectors */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-3">
            {/* Stage 1: Question */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A3A89D]">
                <span className="w-5 h-5 rounded-full border border-[#D8F36A] text-[#D8F36A] flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <span>Question</span>
              </div>

              <div className="p-4 rounded-[8px] border border-[#2E3B33] bg-[#18211D] space-y-3 shadow-md">
                <div className="p-3 rounded-[6px] border border-[#2E3B33] bg-[#111814] flex items-center justify-between gap-2">
                  <span className="text-xs text-[#F5F4EE] font-medium truncate">
                    What is the incident escalation timeline?
                  </span>
                  <div className="w-5 h-5 rounded bg-[#D8F36A] text-[#151713] flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8E9387]">
                  <span className="px-2 py-0.5 rounded bg-[#222C26] border border-[#2E3B33]">
                    All documents &or;
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#222C26] border border-[#2E3B33]">
                    Top-4 reranked &or;
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Connector Arrow 1 */}
            <div className="hidden lg:flex items-center justify-center px-1 text-[#4A554D]">
              <ArrowRight className="w-5 h-5 text-[#8E9387]" />
            </div>

            {/* Stage 2: Retrieved Passage (Elevated Paper Card) */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A3A89D]">
                <span className="w-5 h-5 rounded-full border border-[#D8F36A] text-[#D8F36A] flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <span>Retrieved Passage</span>
              </div>

              <div className="p-4 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="w-3.5 h-3.5 rounded-[2px] bg-[#E11D48]/20 border border-[#E11D48]/40 text-[#E11D48] flex items-center justify-center shrink-0 text-[7px] font-bold">
                      PDF
                    </div>
                    <span className="font-semibold truncate">security-incident-response.pdf</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] font-bold text-[var(--text-primary)]">
                    DOC-001
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
                  <span>Page 12 · Chunk 4</span>
                  <span className="text-[#15803D] dark:text-[#6ee7b7] font-bold">94.2% match</span>
                </div>

                <div className="p-3 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] font-serif italic text-xs leading-relaxed text-[var(--text-primary)]">
                  &ldquo;The initial detection and triage must be completed{' '}
                  <mark className="bg-[#D8F36A] text-[#151713] not-italic font-sans font-semibold px-1 rounded">
                    within 15 minutes
                  </mark>{' '}
                  of alert identification. Escalation to the security team shall occur{' '}
                  <mark className="bg-[#D8F36A] text-[#151713] not-italic font-sans font-semibold px-1 rounded">
                    within 1 hour
                  </mark>
                  …&rdquo;
                </div>
              </div>
            </div>

            {/* Desktop Connector Arrow 2 */}
            <div className="hidden lg:flex items-center justify-center px-1 text-[#4A554D]">
              <ArrowRight className="w-5 h-5 text-[#8E9387]" />
            </div>

            {/* Stage 3: Cited Answer */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A3A89D]">
                <span className="w-5 h-5 rounded-full border border-[#D8F36A] text-[#D8F36A] flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
                <span>Cited Answer</span>
              </div>

              <div className="p-4 rounded-[8px] border border-[#2E3B33] bg-[#18211D] space-y-3 shadow-md">
                <p className="text-xs text-[#F5F4EE] leading-relaxed">
                  The incident escalation timeline is defined in the security incident response policy. Initial detection and triage occurs within 15 minutes, followed by escalation to the security team within 1 hour. If the incident is critical, senior leadership is notified within 4 hours.{' '}
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold">
                    <span className="px-1 rounded bg-[#D8F36A] text-[#151713]">[1]</span>
                    <span className="px-1 rounded bg-[#D8F36A] text-[#151713]">[2]</span>
                  </span>
                </p>

                <div className="pt-2 border-t border-[#2E3B33] flex items-center justify-between text-[10px] font-mono text-[#8E9387]">
                  <span>2 sources</span>
                  <span>3.4k tokens · 42s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. SECURITY & VAULT ISOLATION SECTION ─── */}
      <section id="security" className="py-20 md:py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="max-w-xl space-y-3 mb-12">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            CONTROLLED ARCHITECTURE
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Private knowledge. <br />
            Controlled access.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            Document access, storage isolation, and vector retrieval are governed by Quellivox&rsquo;s verified multi-tenant authorization policies and database constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Spec 1: Row-Level Security */}
          <div className="p-6 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] dark:text-[#D8F36A]">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Row-Level Security (RLS)
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Every document record, conversation session, and audit event is secured by PostgreSQL Row-Level Security policies tied directly to verified tenant tokens.
            </p>
          </div>

          {/* Spec 2: Private Document Storage */}
          <div className="p-6 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] dark:text-[#D8F36A]">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Private Vault Storage
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Original research files reside in private Supabase Storage vaults. Downloads and previews require short-lived, authenticated cryptographic signatures.
            </p>
          </div>

          {/* Spec 3: Grounded Retrieval */}
          <div className="p-6 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] dark:text-[#D8F36A]">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Evidence-Grounded Retrieval
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Questions are synthesized only against retrieved passage chunks with similarity ranking. When evidence is missing, the system explicitly reports insufficient evidence.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. DOCUMENTATION ANCHOR / ARCHITECTURE OVERVIEW ─── */}
      <section id="documentation" className="py-16 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
              TECHNICAL DOCUMENTATION & STACK
            </div>
            <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
              Built on verified RAG fundamentals.
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-lg leading-relaxed">
              Dual-layer retrieval with Dify Knowledge Base dataset integration, local pgvector cosine similarity, 512-token chunk boundaries, and Supabase authentication.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] bg-[#20221D] text-[#FAF8F1] dark:bg-[#FAF8F1] dark:text-[#20221D] text-xs font-bold hover:bg-[#2F322B] dark:hover:bg-[#EAE8DF] transition-colors"
            >
              <span>Launch Evidence Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 6. CLOSING CTA SECTION ─── */}
      <section className="py-20 md:py-24 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Bring your knowledge into focus.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-lg mx-auto">
            Initialize your private workspace, index your documents, and start asking grounded questions with verifiable source evidence.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-[6px] bg-[#D8F36A] text-[#151713] text-xs font-bold hover:bg-[#cbe65e] active:scale-95 transition-all shadow-xs"
            >
              <span>Open workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center h-11 px-5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 7. ARCHIVAL FOOTER ─── */}
      <footer className="py-10 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-main)] text-xs font-mono text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" subtitle="The Evidence Desk" />

          <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider">
            <a href="#platform" className="hover:text-[var(--text-primary)] transition-colors">
              Platform
            </a>
            <a href="#evidence-chain" className="hover:text-[var(--text-primary)] transition-colors">
              Evidence Chain
            </a>
            <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">
              Security
            </a>
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
              Sign in
            </Link>
          </div>

          <div className="text-[11px] text-center sm:text-right">
            Grounded Retrieval-Augmented Generation Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
