'use client';

/**
 * API Indicator - Badge showing API quota status
 *
 * Displays:
 * - Green dot + "API" label
 * - Progress bar (colored by status)
 * - Percentage text
 */

import { useApiQuota } from '@/hooks/use-api-quota';
import { cn } from '@/lib/utils';

interface ApiIndicatorProps {
  className?: string;
}

export function ApiIndicator({ className }: ApiIndicatorProps) {
  const { criticalPercent, status } = useApiQuota();

  const getBarColor = () => {
    switch (status) {
      case 'ok':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'ok':
        return 'text-cyan-400';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-cyan-400';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-bg-secondary border border-border-primary',
        className
      )}
    >
      {/* Green dot + API label */}
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-text-secondary">API</span>
      </span>

      {/* Progress bar */}
      <div className="w-24 h-1.5 bg-bg-primary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor())}
          style={{ width: `${criticalPercent}%` }}
        />
      </div>

      {/* Percentage */}
      <span className={cn('text-xs font-medium tabular-nums', getTextColor())}>
        {criticalPercent}%
      </span>
    </div>
  );
}
