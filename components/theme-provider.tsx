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
      attribute="class"
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
  const setZustandTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    // Apply theme class to html element
    const html = document.documentElement;

    if (zustandTheme === 'system') {
      // Let next-themes handle system preference
      html.classList.remove('light', 'dark');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.add(systemPrefersDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        html.classList.remove('light', 'dark');
        html.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      html.classList.remove('light', 'dark');
      html.classList.add(zustandTheme);
    }
  }, [zustandTheme]);

  return null;
}
