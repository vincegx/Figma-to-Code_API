'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useUIStore } from '@/lib/store';
import { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUIStore((state) => state.theme);

  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme={theme}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

// Sync Zustand theme state with next-themes
function ThemeSync() {
  const zustandTheme = useUIStore((state) => state.theme);

  useEffect(() => {
    const html = document.documentElement;

    if (zustandTheme === 'system') {
      // Let next-themes handle system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      html.setAttribute('data-theme', zustandTheme);
    }
  }, [zustandTheme]);

  return null;
}
