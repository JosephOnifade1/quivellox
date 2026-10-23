'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { X } from 'lucide-react';
import { DocumentUploadModal } from '@/components/rag/DocumentUploadModal';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  description,
  breadcrumbs,
  action,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-full">
        <React.Suspense fallback={<div className="w-64 h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]" />}>
          <Sidebar onAddDocumentClick={() => setUploadModalOpen(true)} />
        </React.Suspense>
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[var(--bg-surface)] z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-[6px] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
            <React.Suspense fallback={<div className="w-72 h-full bg-[var(--bg-surface)]" />}>
              <Sidebar
                onAddDocumentClick={() => {
                  setMobileOpen(false);
                  setUploadModalOpen(true);
                }}
                onCloseMobile={() => setMobileOpen(false)}
              />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Main Content Workspace Column */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Navbar
          onToggleMobileMenu={() => setMobileOpen(true)}
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          action={action}
        />

        <main className="flex-1 overflow-y-auto min-h-0 bg-[var(--bg-main)]">
          {children}
        </main>
      </div>

      {/* Global Document Ingestion Upload Modal */}
      {uploadModalOpen && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            // refresh data if needed
            window.dispatchEvent(new CustomEvent('document_uploaded'));
          }}
        />
      )}
    </div>
  );
};
