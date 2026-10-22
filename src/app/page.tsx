import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  FileText, Search, BookOpen, ArrowRight, CheckCircle2,
  ShieldCheck, Layers, Code2, Briefcase, Users, ChevronRight,
} from 'lucide-react';

function ProductPreview() {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--panel-shadow)]">
      <div className="h-9 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)] flex items-center px-4 gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
        <span className="ml-4 text-[11px] font-mono text-[var(--text-muted)]">quellivox / ask / conversation-482</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-end">
          <div className="max-w-md px-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]">
            What is the refund window and does it apply to digital products?
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron)]" />
            Quellivox — 3 sources retrieved
          </div>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed">
            The refund window is <strong>14 calendar days</strong> from the date of purchase.{' '}
            <span className="evidence-badge">1</span> This policy applies to all physical goods, but{' '}
            <strong>digital products are explicitly excluded</strong> from the standard return window unless defective.{' '}
            <span className="evidence-badge">2</span> For defective digital items, customers must submit a claim
            within <strong>7 days</strong> of purchase with supporting evidence.{' '}
            <span className="evidence-badge">3</span>
          </div>
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Retrieved sources</div>
          {[
            { idx: '1', doc: 'DOC-004', name: 'Refund-Policy-v3.pdf', page: 'p. 2', excerpt: '…customers have 14 calendar days from purchase to initiate a return…' },
            { idx: '2', doc: 'DOC-004', name: 'Refund-Policy-v3.pdf', page: 'p. 3', excerpt: '…digital downloads are non-refundable under the standard policy…' },
            { idx: '3', doc: 'DOC-007', name: 'Customer-Terms-2024.pdf', page: 'p. 8', excerpt: '…defective digital goods must be reported within 7 days…' },
          ].map((s) => (
            <div key={s.idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)]">
              <span className="evidence-badge shrink-0">{s.idx}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)]">{s.doc}</span>
                  <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{s.name}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{s.page}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 italic">{s.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const useCases = [
  { icon: Code2, role: 'Developers', title: 'Query your technical docs', description: 'Upload API references, architecture guides, and spec sheets. Ask precise technical questions and trace every answer back to its source.' },
  { icon: Briefcase, role: 'Consultants & Freelancers', title: 'Work with client briefs', description: 'Load client briefing documents, contracts, and project specs. Ask questions and cite exact clauses without rereading entire files.' },
  { icon: Users, role: 'Small Teams', title: 'Centralize internal knowledge', description: 'Upload operating procedures, policies, and internal guides. Give your team a single reliable source for precise, evidence-backed answers.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Sign in</Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] text-sm font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors">Get started</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citron)]" />
              A knowledge workspace built on evidence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6 max-w-3xl mx-auto">
              Ask better questions of the{' '}
              <span className="text-[var(--accent-citron-muted)]">information you already have.</span>
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your documents. Ask anything in natural language. Receive concise AI answers{' '}
              <em>grounded in retrievable evidence</em> — with citations that link back to the exact supporting passage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm">
                Build your knowledge workspace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-surface-elevated)] transition-colors">
                Explore how it works
              </Link>
            </div>
          </div>
        </section>

        {/* Product preview */}
        <section className="py-8 px-6">
          <div className="max-w-6xl mx-auto"><ProductPreview /></div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-6 border-t border-[var(--border-subtle)] mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-3">Workflow</p>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Three steps to grounded answers</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: FileText, title: 'Add sources', description: 'Upload PDFs, Markdown, and text documents to your private workspace. Files are extracted, chunked, and embedded into a searchable vector index.' },
                { step: '02', icon: Search, title: 'Ask a question', description: 'Type any natural-language question. Quellivox retrieves the most relevant document passages from your workspace using semantic similarity search.' },
                { step: '03', icon: BookOpen, title: 'Inspect the evidence', description: 'Every answer includes numbered citations. Click any citation to open the exact retrieved passage — source, page number, and verbatim excerpt.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--accent-citron-muted)]" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] mb-1">{item.step}</div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Evidence inspector detail */}
        <section className="py-20 px-6 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-3">The evidence inspector</p>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">See why the AI said what it said.</h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-6">
                Citations are not decorative. Every numbered reference connects to a real retrieved passage, complete with source document, page location, and the exact excerpt that informed the answer.
              </p>
              <ul className="space-y-3">
                {[
                  'Numbered evidence markers linked to real chunks',
                  'Page numbers and section titles preserved from source',
                  'Collapsible retrieval inspector showing all sources',
                  'Deleted sources marked — not silently re-routed',
                  'Workspace-isolated — no cross-tenant data leakage',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">Evidence Inspector</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-citron)] text-[var(--accent-citron-text)]">3 sources</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { doc: 'DOC-004', name: 'Refund-Policy-v3.pdf', page: 'p. 2', excerpt: '…customers have 14 calendar days from purchase to initiate a return…' },
                  { doc: 'DOC-004', name: 'Refund-Policy-v3.pdf', page: 'p. 3', excerpt: '…digital downloads are non-refundable under the standard policy…' },
                  { doc: 'DOC-007', name: 'Customer-Terms-2024.pdf', page: 'p. 8', excerpt: '…defective digital goods must be reported within 7 days with evidence…' },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold text-[var(--accent-citron-muted)]">{s.doc}</span>
                      <span className="text-[11px] font-medium text-[var(--text-primary)]">{s.name}</span>
                      <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)]">{s.page}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">{s.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)] mb-3">Who it&apos;s for</p>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Built for people who work with documents</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {useCases.map((u) => {
                const Icon = u.icon;
                return (
                  <div key={u.role} className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-elevated)] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[var(--accent-citron-muted)]" />
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">{u.role}</div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">{u.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{u.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="py-16 px-6 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-[var(--accent-citron-muted)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Privacy by design</h2>
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Documents are stored in a private Supabase Storage bucket. Row-Level Security is enforced at the database layer — your workspace data is never accessible to other users or workspaces.
              </p>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Every retrieval query is scoped to your authorized workspace on the server. No AI model receives data from outside your document set.
              </p>
            </div>
            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
              {[
                { icon: ShieldCheck, label: 'RLS enforced', sub: 'Row-level security' },
                { icon: Layers, label: 'Private vault', sub: 'Supabase Storage' },
                { icon: Search, label: 'Scoped retrieval', sub: 'Workspace-isolated' },
                { icon: CheckCircle2, label: 'No fake metrics', sub: 'Real data only' },
              ].map((item) => {
                const I = item.icon;
                return (
                  <div key={item.label} className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-center">
                    <I className="w-4 h-4 mx-auto text-[var(--accent-citron-muted)] mb-1.5" />
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{item.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">Start with the documents you already trust.</h2>
            <p className="text-[var(--text-muted)] mb-10">Upload your first document and ask a question in minutes. No credit card required.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] font-semibold hover:bg-[var(--accent-citron-muted)] transition-colors shadow-sm text-base">
              Build your knowledge workspace <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-[11px] font-mono text-[var(--text-muted)] text-center">Answers grounded in evidence. Built for professionals who work with documents.</p>
          <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-[var(--text-primary)] transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
