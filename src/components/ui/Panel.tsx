import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  elevated = false,
  className = '',
  ...props
}) => (
  <div
    className={`rounded-[7px] border border-[var(--border-subtle)] transition-colors ${
      elevated ? 'bg-[var(--bg-surface-elevated)]' : 'bg-[var(--bg-surface)]'
    } shadow-xs ${className}`}
    {...props}
  />
);

export const PanelHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    className={`px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 ${className}`}
    {...props}
  />
);

export const PanelTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  ...props
}) => (
  <h3
    className={`font-heading font-medium text-sm text-[var(--text-primary)] tracking-tight ${className}`}
    {...props}
  />
);

export const PanelDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  ...props
}) => (
  <p
    className={`text-xs text-[var(--text-muted)] leading-relaxed ${className}`}
    {...props}
  />
);

export const PanelContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div className={`p-4 ${className}`} {...props} />
);

export const PanelFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    className={`px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/30 flex items-center justify-between gap-3 ${className}`}
    {...props}
  />
);
