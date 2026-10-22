import React from 'react';
import { DocumentStatus } from '@/types';

interface BadgeProps {
  status?: DocumentStatus;
  variant?: 'default' | 'citron' | 'outline' | 'mono';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false,
}) => {
  const getStatusStyles = (st: DocumentStatus) => {
    switch (st) {
      case 'ready':
        return 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/30';
      case 'failed':
        return 'bg-[var(--status-error-bg)] text-[var(--status-error)] border-[var(--status-error)]/30';
      case 'extracting':
      case 'chunking':
      case 'indexing':
        return 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/30 animate-pulse';
      case 'queued':
      default:
        return 'bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/30';
    }
  };

  const getVariantStyles = () => {
    if (status) return getStatusStyles(status);

    switch (variant) {
      case 'citron':
        return 'bg-[var(--accent-citron)] text-[var(--accent-citron-text)] border-[var(--accent-citron-muted)] font-semibold';
      case 'outline':
        return 'bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)]';
      case 'mono':
        return 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)] font-mono text-[11px]';
      case 'default':
      default:
        return 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]';
    }
  };

  const sizeStyles = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  const formatStatus = (s: DocumentStatus) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border font-medium leading-none select-none transition-colors ${getVariantStyles()} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === 'ready'
              ? 'bg-[var(--status-success)]'
              : status === 'failed'
              ? 'bg-[var(--status-error)]'
              : status
              ? 'bg-[var(--status-warning)] animate-ping'
              : 'bg-current'
          }`}
        />
      )}
      {children || (status ? formatStatus(status) : null)}
    </span>
  );
};
