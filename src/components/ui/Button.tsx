import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'surface' | 'ghost' | 'danger' | 'citron';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      icon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-[#20221D] text-[#FAF8F1] hover:bg-[#2F322B] dark:bg-[#FAF8F1] dark:text-[#20221D] dark:hover:bg-[#EAE8DF] border border-transparent font-medium shadow-xs',
      secondary:
        'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-xs',
      surface:
        'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
      ghost:
        'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent',
      danger:
        'bg-[var(--status-error-bg)] text-[var(--status-error)] hover:opacity-90 border border-[var(--status-error-border)] font-medium',
      citron:
        'bg-[var(--accent-citron)] text-[var(--accent-citron-text)] hover:bg-[var(--accent-citron-muted)] border border-transparent font-semibold shadow-xs',
    };

    const sizeStyles = {
      xs: 'h-7 px-2 text-xs rounded-[4px] gap-1',
      sm: 'h-8 px-2.5 text-xs rounded-[5px] gap-1.5',
      md: 'h-9 px-3.5 text-sm rounded-[6px] gap-2',
      lg: 'h-10 px-4 text-sm rounded-[7px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-citron)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
