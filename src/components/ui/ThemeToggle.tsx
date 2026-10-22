'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('quellivox_theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('quellivox_theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-[8px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'Light paper' : 'Dark ink'} theme`}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-[var(--accent-citron)] transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-[var(--text-primary)] transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};
