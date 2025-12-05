'use client';

/**
 * Breakpoint Toggle Component
 *
 * A toggle group for switching between mobile, tablet, and desktop preview modes.
 * Shows icons and labels for each breakpoint with active state highlighting.
 */

import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Breakpoint } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

interface BreakpointToggleProps {
  value: Breakpoint;
  onChange: (breakpoint: Breakpoint) => void;
  className?: string;
}

interface BreakpointOption {
  breakpoint: Breakpoint;
  label: string;
  icon: React.ReactNode;
  width: number;
}

// ============================================================================
// Constants
// ============================================================================

const BREAKPOINT_OPTIONS: BreakpointOption[] = [
  {
    breakpoint: 'mobile',
    label: 'Mobile',
    icon: <Smartphone className="h-4 w-4" />,
    width: 375,
  },
  {
    breakpoint: 'tablet',
    label: 'Tablet',
    icon: <Tablet className="h-4 w-4" />,
    width: 768,
  },
  {
    breakpoint: 'desktop',
    label: 'Desktop',
    icon: <Monitor className="h-4 w-4" />,
    width: 1280,
  },
];

// ============================================================================
// Component
// ============================================================================

export function BreakpointToggle({ value, onChange, className }: BreakpointToggleProps) {
  return (
    <div
      className={cn('flex gap-1 rounded-lg bg-muted p-1', className)}
      role="radiogroup"
      aria-label="Breakpoint selection"
    >
      {BREAKPOINT_OPTIONS.map((option) => (
        <button
          key={option.breakpoint}
          type="button"
          role="radio"
          aria-checked={value === option.breakpoint}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === option.breakpoint
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
          )}
          onClick={() => onChange(option.breakpoint)}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
          <span className="text-xs text-muted-foreground hidden md:inline">
            {option.width}px
          </span>
        </button>
      ))}
    </div>
  );
}
