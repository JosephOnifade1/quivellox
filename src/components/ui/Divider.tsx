import React from 'react';

export interface DividerProps {
  label?: string;
  mono?: boolean;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  mono = true,
  className = '',
}) => {
  if (!label) {
    return <hr className={`border-t border-[var(--border-subtle)] my-4 ${className}`} />;
  }

  return (
    <div className={`relative flex items-center my-4 ${className}`}>
      <div className="flex-grow border-t border-[var(--border-subtle)]" />
      <span
        className={`shrink-0 mx-3 text-[10px] uppercase tracking-wider text-[var(--text-faint)] select-none ${
          mono ? 'font-mono' : 'font-sans'
        }`}
      >
        {label}
      </span>
      <div className="flex-grow border-t border-[var(--border-subtle)]" />
    </div>
  );
};
