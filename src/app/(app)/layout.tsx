import { AppShell } from '@/components/layout/AppShell';
import { Suspense } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[var(--bg-main)] flex items-center justify-center text-sm font-mono text-[var(--text-muted)]">Loading workspace...</div>}>
      <AppShell>
        <Suspense fallback={<div className="p-8 text-sm font-mono text-[var(--text-muted)]">Loading view...</div>}>
          {children}
        </Suspense>
      </AppShell>
    </Suspense>
  );
}

