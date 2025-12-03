/**
 * Quota Indicator (WP41 T357)
 *
 * Compact indicator showing critical tier percentage with status colors.
 * Responsive: icon only on mobile, full on desktop.
 */

'use client';

import { useApiQuota } from '@/hooks/use-api-quota';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { QuotaPopover } from './quota-popover';

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800',
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800',
  },
};

interface QuotaIndicatorProps {
  compact?: boolean; // Hide progress bar and percentage
  popoverSide?: 'top' | 'right' | 'bottom' | 'left'; // Popover position
}

export function QuotaIndicator({ compact = false, popoverSide = 'bottom' }: QuotaIndicatorProps) {
  const { criticalPercent, status, isLoading, error } = useApiQuota();

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // Show loading state
  if (isLoading && criticalPercent === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-hover">
        <Activity className="h-4 w-4 text-text-muted animate-pulse" />
        <span className="hidden sm:block text-sm text-text-muted">API</span>
      </div>
    );
  }

  // Show error state
  if (error && criticalPercent === 0) {
    return (
      <QuotaPopover side={popoverSide}>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
            'bg-bg-hover hover:bg-bg-card',
            'text-text-muted'
          )}
        >
          <Activity className="h-4 w-4" />
          <span className="hidden sm:block text-sm">API</span>
        </button>
      </QuotaPopover>
    );
  }

  return (
    <QuotaPopover side={popoverSide}>
      <button
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
          'hover:bg-bg-hover',
          config.bgColor
        )}
      >
        {/* Status Icon */}
        <StatusIcon className={cn('h-4 w-4', config.color)} />

        {/* Label (hidden on small screens) */}
        <span className="hidden sm:block text-sm text-text-secondary">
          API
        </span>

        {/* Progress bar (hidden on small screens or compact mode) */}
        {!compact && (
          <div className="hidden md:block w-16">
            <Progress
              value={criticalPercent}
              className="h-1.5"
            />
          </div>
        )}

        {/* Percentage (hidden on small screens or compact mode) */}
        {!compact && (
          <span
            className={cn(
              'hidden lg:block text-xs font-medium',
              config.color
            )}
          >
            {criticalPercent}%
          </span>
        )}
      </button>
    </QuotaPopover>
  );
}
