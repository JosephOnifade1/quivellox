import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse rounded-[4px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]/40 ${className}`}
      {...props}
    />
  );
};
