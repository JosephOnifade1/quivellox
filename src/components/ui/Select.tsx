import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      mono = false,
      children,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-9 pl-3 pr-8 rounded-[6px] border bg-[var(--bg-input,var(--bg-surface))] text-sm text-[var(--text-primary)] transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] cursor-pointer ${
              mono ? 'font-mono text-xs' : ''
            } ${
              error
                ? 'border-[var(--status-error)] focus:ring-[var(--status-error)]'
                : 'border-[var(--border-subtle)]'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-2.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
        </div>
        {error ? (
          <p className="text-[11px] text-[var(--status-error)] font-medium leading-none">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--text-muted)] leading-none">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
