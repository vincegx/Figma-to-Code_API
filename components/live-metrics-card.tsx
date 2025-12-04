'use client';

/**
 * LiveMetricsCard - Stats Card with Sparkline (WP42 Redesign V2)
 *
 * Displays a single metric with:
 * - Icon indicator
 * - Large value with optional suffix
 * - Sparkline chart for trend visualization
 * - Badge for trend value
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

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
  /** Sparkline data (7 points for week) */
  sparklineData?: number[];
}

const variantStyles = {
  default: {
    bg: 'bg-graph-1/10',
    icon: 'text-graph-1',
    sparkline: 'var(--graph-1)',
    sparklineFill: 'rgba(96, 165, 250, 0.1)',
  },
  success: {
    bg: 'bg-graph-2/10',
    icon: 'text-graph-2',
    sparkline: 'var(--graph-2)',
    sparklineFill: 'rgba(52, 211, 153, 0.1)',
  },
  warning: {
    bg: 'bg-graph-3/10',
    icon: 'text-graph-3',
    sparkline: 'var(--graph-3)',
    sparklineFill: 'rgba(251, 191, 36, 0.1)',
  },
  info: {
    bg: 'bg-graph-1/10',
    icon: 'text-graph-1',
    sparkline: 'var(--graph-1)',
    sparklineFill: 'rgba(96, 165, 250, 0.1)',
  },
};

// Generate default sparkline data if not provided
const generateDefaultSparkline = () => [4, 6, 5, 8, 7, 9, 8];

export function LiveMetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  suffix,
  className,
  variant = 'default',
  sparklineData,
}: LiveMetricsCardProps) {
  const isPositive = trend && trend.value >= 0;
  const styles = variantStyles[variant];

  // Memoize chart data
  const chartData = useMemo(() => {
    const data = sparklineData || generateDefaultSparkline();
    return data.map((val, i) => ({ value: val, index: i }));
  }, [sparklineData]);

  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-bg-card border border-border-primary',
        'hover:border-border-secondary hover:shadow-lg',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header with Icon and Trend Badge */}
      <div className="flex items-center justify-between mb-3">
        <Icon className={cn('w-5 h-5', styles.icon)} />
        {trend !== undefined && (
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              isPositive
                ? 'text-graph-2 bg-graph-2/10'
                : 'text-graph-4 bg-graph-4/10'
            )}
          >
            {isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <p className="text-3xl font-bold text-text-primary tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {suffix && (
          <span className="text-lg font-medium text-text-muted">{suffix}</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm text-text-muted mb-3">{title}</p>

      {/* Sparkline */}
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${variant}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={styles.sparkline} stopOpacity={0.3} />
                <stop offset="100%" stopColor={styles.sparkline} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={styles.sparkline}
              strokeWidth={2}
              fill={`url(#gradient-${variant})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
