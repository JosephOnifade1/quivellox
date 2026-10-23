import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className = '',
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
    <table className={`w-full text-left border-collapse text-sm ${className}`} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  ...props
}) => (
  <thead
    className={`border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/50 ${className}`}
    {...props}
  />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  ...props
}) => (
  <tbody className={`divide-y divide-[var(--border-subtle)] ${className}`} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  ...props
}) => (
  <tr
    className={`transition-colors hover:bg-[var(--bg-surface-elevated)]/40 ${className}`}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => (
  <th
    className={`h-9 px-4 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-medium align-middle ${className}`}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => (
  <td
    className={`px-4 py-3 align-middle text-[var(--text-primary)] text-sm ${className}`}
    {...props}
  />
);
