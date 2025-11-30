'use client';

/**
 * LiveMetricsCard - Stats Card with Trend
 *
 * Displays a single metric with:
 * - Icon in colored background
 * - Large value with optional suffix
 * - Trend indicator (positive/negative)
 * - Hover effect
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface LiveMetricsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Trend data (optional) */
  trend?: {
    value: number;
    label: string;
  };
  /** Value suffix (e.g., %, K) */
  suffix?: string;
  /** Additional CSS classes */
  className?: string;
  /** Icon color variant */
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: {
    bg: 'bg-accent-primary/10',
    icon: 'text-accent-primary',
  },
  success: {
    bg: 'bg-status-success-bg',
    icon: 'text-status-success-text',
  },
  warning: {
    bg: 'bg-status-warning-bg',
    icon: 'text-status-warning-text',
  },
  info: {
    bg: 'bg-status-info-bg',
    icon: 'text-status-info-text',
  },
};

export function LiveMetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  suffix,
  className,
  variant = 'default',
}: LiveMetricsCardProps) {
  const isPositive = trend && trend.value >= 0;
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'p-6 rounded-xl bg-bg-card border border-border-primary',
        'hover:border-accent-primary/50 hover:shadow-md',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-muted mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-text-primary tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {suffix && (
              <span className="text-lg font-medium text-text-muted">{suffix}</span>
            )}
          </div>
          {trend !== undefined && (
            <p
              className={cn(
                'text-sm font-medium mt-2 flex items-center gap-1',
                isPositive ? 'text-status-success-text' : 'text-status-error-text'
              )}
            >
              <span className="text-base">{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}</span>
              <span className="text-text-muted font-normal">{trend.label}</span>
            </p>
          )}
        </div>

        {/* Icon */}
        <div className={cn('p-3 rounded-lg flex-shrink-0', styles.bg)}>
          <Icon className={cn('w-6 h-6', styles.icon)} />
        </div>
      </div>
    </div>
  );
}
