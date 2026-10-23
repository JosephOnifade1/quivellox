import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  badge,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[7px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {badge && (
        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
          {badge}
        </span>
      )}
      {icon && (
        <div className="w-10 h-10 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-center text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <div className="max-w-sm space-y-1">
        <h4 className="font-heading font-medium text-sm text-[var(--text-primary)] tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {description}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
