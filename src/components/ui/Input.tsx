import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      mono = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-9 rounded-[6px] border bg-[var(--bg-input,var(--bg-surface))] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[var(--accent-citron)] ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightElement ? 'pr-9' : 'pr-3'} ${
              mono ? 'font-mono text-xs' : ''
            } ${
              error
                ? 'border-[var(--status-error)] focus:ring-[var(--status-error)]'
                : 'border-[var(--border-subtle)]'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 flex items-center text-[var(--text-muted)]">
              {rightElement}
            </div>
          )}
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

Input.displayName = 'Input';
