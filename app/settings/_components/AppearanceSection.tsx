'use client';

/**
 * AppearanceSection Component
 *
 * Theme toggle (light, dark, system).
 * VERBATIM from settings/page.tsx - Phase 3 refactoring
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface AppearanceSectionProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function AppearanceSection({ theme, onThemeChange }: AppearanceSectionProps) {
  const themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: Sun },
    { value: 'dark' as Theme, label: 'Dark', icon: Moon },
    { value: 'system' as Theme, label: 'System', icon: Monitor },
  ];

  return (
    <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a7 7 0 0 0 0 14 7 7 0 0 0 0-14z" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
          <p className="text-sm text-text-muted">Customize the look and feel of the application</p>
        </div>
      </div>

      <div>
        <label className="text-sm text-text-muted mb-3 block">Theme</label>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onThemeChange(value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                theme === value
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-bg-secondary border-border-primary text-text-secondary hover:border-border-secondary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
