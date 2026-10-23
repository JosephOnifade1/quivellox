'use client';

import React from 'react';
import { Citation } from '@/types';

export interface CitationBadgeProps {
  index: number;
  citation?: Citation;
  isActive?: boolean;
  onClick: (citation?: Citation) => void;
  className?: string;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  index,
  citation,
  isActive = false,
  onClick,
  className = '',
}) => {
  const label = citation
    ? `Citation [${index}]: ${citation.document_name}${
        citation.page_number ? ` (Page ${citation.page_number})` : ''
      }`
    : `Citation [${index}]`;

  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      className={`inline-flex items-center justify-center font-mono text-[11px] leading-tight px-1.5 py-0.5 rounded-[3px] border transition-all mx-0.5 align-baseline select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)] ${
        isActive
          ? 'bg-[var(--accent-citron)]/25 border-[var(--accent-citron)] text-[var(--text-primary)] font-semibold shadow-xs ring-1 ring-[var(--accent-citron)]'
          : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-citron-muted)] hover:bg-[var(--accent-citron)]/15 text-[var(--text-primary)] font-medium'
      } ${className}`}
    >
      <span className="text-[var(--text-muted)] text-[9px] mr-0.5">[</span>
      <span>{index}</span>
      <span className="text-[var(--text-muted)] text-[9px] ml-0.5">]</span>
    </button>
  );
};
