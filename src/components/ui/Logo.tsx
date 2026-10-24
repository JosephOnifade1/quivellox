import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  useWordmarkImage?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  subtitle = 'Evidence Desk',
  useWordmarkImage = false,
  className = '',
}) => {
  const pixelSizes = { sm: 28, md: 36, lg: 46, xl: 58 };
  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-lg', sub: 'text-[10px]' },
    lg: { title: 'text-xl', sub: 'text-xs' },
    xl: { title: 'text-2xl', sub: 'text-sm' },
  };
  const px = pixelSizes[size];
  const fontStyle = textSizes[size];

  if (useWordmarkImage) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/quivellox-wordmark-light-cropped.png"
          alt="Quivellox"
          style={{ height: px }}
          className="w-auto object-contain dark:hidden"
        />
        <img
          src="/quivellox-wordmark-dark-cropped.png"
          alt="Quivellox"
          style={{ height: px }}
          className="w-auto object-contain hidden dark:block"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Exact Generated Aperture Mark Image */}
      <img
        src="/quivellox-logo-mark-cropped.png"
        alt="Quivellox Logo"
        width={px}
        height={px}
        style={{ width: px, height: px }}
        className="shrink-0 rounded-[22%] object-contain shadow-sm transition-transform duration-200 group-hover:scale-105"
      />

      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <span
            className={`font-heading font-bold tracking-tight text-[var(--text-primary)] transition-colors ${fontStyle.title}`}
          >
            Quivellox
          </span>
          {subtitle && (
            <span
              className={`font-mono uppercase tracking-widest text-[var(--text-muted)] ${fontStyle.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
