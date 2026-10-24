import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      mono = false,
      className = '',
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          rows={rows}
          className={`w-full p-2.5 rounded-[6px] border bg-[var(--bg-input,var(--bg-surface))] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] resize-y ${
            mono ? 'font-mono text-xs' : ''
          } ${
            error
              ? 'border-[var(--status-error)] focus:ring-[var(--status-error)]'
              : 'border-[var(--border-subtle)]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[11px] text-[var(--status-error)] font-medium leading-none">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--text-muted)] leading-none">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
