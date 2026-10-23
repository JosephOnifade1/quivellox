import React from 'react';
import { DocumentStatus } from '@/types';

export interface BadgeProps {
  status?: DocumentStatus;
  variant?: 'default' | 'citron' | 'outline' | 'mono';
  size?: 'xs' | 'sm' | 'md';
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
        return 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]';
      case 'failed':
        return 'bg-[var(--status-error-bg)] text-[var(--status-error)] border-[var(--status-error-border)]';
      case 'extracting':
      case 'chunking':
      case 'indexing':
        return 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]';
      case 'queued':
      default:
        return 'bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info-border)]';
    }
  };

  const getVariantStyles = () => {
    if (status) return getStatusStyles(status);

    switch (variant) {
      case 'citron':
        return 'bg-[var(--accent-citron)]/15 text-[var(--text-primary)] border-[var(--accent-citron-muted)]/50 font-medium';
      case 'outline':
        return 'bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)]';
      case 'mono':
        return 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)] font-mono text-[11px] tracking-tight uppercase';
      case 'default':
      default:
        return 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]';
    }
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[9px] rounded-[3px] gap-1',
    sm: 'px-1.5 py-0.5 text-[10px] rounded-[4px] gap-1.5',
    md: 'px-2 py-0.5 text-xs rounded-[4px] gap-1.5',
  };

  const formatStatus = (s: DocumentStatus) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <span
      className={`inline-flex items-center border font-medium leading-none select-none transition-colors ${getVariantStyles()} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
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
