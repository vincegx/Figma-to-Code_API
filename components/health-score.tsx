'use client';

/**
 * HealthScore - Gamified Score Display (WP42 Redesign V2)
 *
 * Shows a circular gauge with:
 * - "Ideal" badge in pink/magenta
 * - Stats with colored bullets
 * - "Last 7 days" progress bar with +11%
 */

import { useHealthScore } from '@/hooks/use-health-score';
import { cn } from '@/lib/utils';

const scoreConfig = {
  excellent: {
    color: 'text-blue-400',
    strokeColor: '#60a5fa',
    label: 'Ideal',
    labelBg: 'bg-pink-500/20 text-pink-400',
  },
  good: {
    color: 'text-blue-400',
    strokeColor: '#60a5fa',
    label: 'Good',
    labelBg: 'bg-blue-500/20 text-blue-400',
  },
  'needs-improvement': {
    color: 'text-amber-400',
    strokeColor: '#fbbf24',
    label: 'Moderate',
    labelBg: 'bg-amber-500/20 text-amber-400',
  },
  poor: {
    color: 'text-red-400',
    strokeColor: '#f87171',
    label: 'Low',
    labelBg: 'bg-red-500/20 text-red-400',
  },
};

export function HealthScore() {
  const { score, level, details } = useHealthScore();
  const config = scoreConfig[level];

  // SVG circle calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Calculate a weekly improvement (simulated)
  const weeklyImprovement = 11;

  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-primary h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Health Score</h3>
        <span
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-full',
            config.labelBg
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Circular Score */}
      <div className="flex items-center justify-center py-4 flex-1">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="var(--bg-secondary)"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={config.strokeColor}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-4xl font-bold', config.color)}>{score}</span>
            <span className="text-sm text-text-muted">/ 100</span>
          </div>
        </div>
      </div>

      {/* Stats with colored bullets */}
      <div className="space-y-3 mt-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-text-secondary">Rules loaded</span>
          </div>
          <span className="font-medium text-text-primary tabular-nums">{details.totalRules}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-text-secondary">Nodes imported</span>
          </div>
          <span className="font-medium text-text-primary tabular-nums">{details.nodesCount}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-2 h-2 rounded-full',
              details.nodesViewed > 0 ? 'bg-emerald-400' : 'bg-gray-500'
            )} />
            <span className="text-text-secondary">Viewed</span>
          </div>
          <span className="font-medium text-text-primary tabular-nums">
            {details.nodesViewed}/{details.nodesCount}
          </span>
        </div>
      </div>

      {/* Last 7 days progress */}
      <div className="mt-4 pt-4 border-t border-border-primary">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-muted">Last 7 days</span>
          <span className="text-emerald-400 font-medium">+{weeklyImprovement}%</span>
        </div>
        <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, score + weeklyImprovement)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
