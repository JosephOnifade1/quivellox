import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const pixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const px = pixelSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        {/* Outer evidence frame */}
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="10"
          className="fill-[var(--bg-surface)] stroke-[var(--border-subtle)]"
          strokeWidth="3"
        />

        {/* Technical index lines */}
        <path
          d="M16 18H48M16 26H36"
          className="stroke-[var(--border-subtle)]"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* The Q loop: Aperture Frame */}
        <circle
          cx="32"
          cy="38"
          r="13"
          className="stroke-[var(--accent-citron)] fill-[var(--bg-main)]"
          strokeWidth="3.5"
        />

        {/* Central retrieval focus node */}
        <circle cx="32" cy="38" r="4.5" className="fill-[var(--accent-citron)]" />

        {/* Q-index terminal spur */}
        <path
          d="M41 47L49 55"
          className="stroke-[var(--accent-citron)]"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-base leading-none text-[var(--text-primary)] font-mono-code">
            QUELLIVOX
          </span>
          <span className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] font-mono mt-0.5">
            EVIDENCE DESK
          </span>
        </div>
      )}
    </div>
  );
};
