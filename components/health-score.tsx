'use client';

/**
 * HealthScore - Gamified Score Display (WP42 Redesign V2, WP44 Updates)
 *
 * Shows a circular gauge with:
 * - "Ideal" badge in pink/magenta
 * - Stats with colored bullets (Rules, Semantic %, Responsive %)
 * - Tooltip on circle showing score breakdown
 * - "Last 7 days" with real historical data
 */

import { useHealthScore } from '@/hooks/use-health-score';
import { useStatsHistory } from '@/hooks/use-stats-history';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const scoreConfig = {
  excellent: {
    color: 'text-graph-1',
    strokeColor: 'var(--graph-1)',
    label: 'Ideal',
    labelBg: 'bg-graph-5/20 text-graph-5',
  },
  good: {
    color: 'text-graph-1',
    strokeColor: 'var(--graph-1)',
    label: 'Good',
    labelBg: 'bg-graph-1/20 text-graph-1',
  },
  'needs-improvement': {
    color: 'text-graph-3',
    strokeColor: 'var(--graph-3)',
    label: 'Moderate',
    labelBg: 'bg-graph-3/20 text-graph-3',
  },
  poor: {
    color: 'text-graph-4',
    strokeColor: 'var(--graph-4)',
    label: 'Low',
    labelBg: 'bg-graph-4/20 text-graph-4',
  },
};

export function HealthScore() {
  const { score, level, details, breakdown } = useHealthScore();
  const { weeklyChange } = useStatsHistory(7);
  const config = scoreConfig[level];

  // SVG circle calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // WP44: Use real weekly change, fallback to "—" if no data
  const weeklyChangeDisplay = weeklyChange !== null ? weeklyChange : null;
  const weeklyChangeColor = weeklyChangeDisplay === null
    ? 'text-text-muted'
    : weeklyChangeDisplay >= 0
      ? 'text-graph-2'
      : 'text-graph-4';
  const weeklyChangeText = weeklyChangeDisplay === null
    ? '—'
    : `${weeklyChangeDisplay >= 0 ? '+' : ''}${weeklyChangeDisplay}%`;

  return (
    <TooltipProvider>
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

        {/* Circular Score with Tooltip */}
        <div className="flex items-center justify-center py-4 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative w-32 h-32 cursor-help">
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
            </TooltipTrigger>
            <TooltipContent side="right" className="w-56 p-3">
              <div className="space-y-2">
                <div className="font-semibold text-text-primary border-b border-border-primary pb-1 mb-2">
                  Score Breakdown
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Rules loaded</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {breakdown.rules.points}/{breakdown.rules.max} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Nodes imported</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {breakdown.nodes.points}/{breakdown.nodes.max} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    Semantic ({breakdown.semantic.percent}%)
                  </span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {breakdown.semantic.points}/{breakdown.semantic.max} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    Responsive ({breakdown.responsive.percent}%)
                  </span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {breakdown.responsive.points}/{breakdown.responsive.max} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-border-primary pt-2 mt-2">
                  <span className="font-semibold text-text-primary">Total</span>
                  <span className="font-bold text-text-primary tabular-nums">
                    {score}/100
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Stats with colored bullets (WP44: Updated metrics) */}
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-2 h-2 rounded-full',
                details.totalRules > 0 ? 'bg-graph-2' : 'bg-text-muted'
              )} />
              <span className="text-text-secondary">Rules loaded</span>
            </div>
            <span className="font-medium text-text-primary tabular-nums">{details.totalRules}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-2 h-2 rounded-full',
                breakdown.semantic.percent >= 50 ? 'bg-graph-2' : 'bg-graph-3'
              )} />
              <span className="text-text-secondary">Semantic score</span>
            </div>
            <span className="font-medium text-text-primary tabular-nums">
              {breakdown.semantic.percent}%
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-2 h-2 rounded-full',
                breakdown.responsive.percent >= 50 ? 'bg-graph-2' : 'bg-graph-3'
              )} />
              <span className="text-text-secondary">Responsive</span>
            </div>
            <span className="font-medium text-text-primary tabular-nums">
              {breakdown.responsive.percent}%
            </span>
          </div>
        </div>

        {/* Last 7 days progress (WP44: Real historical data) */}
        <div className="mt-4 pt-4 border-t border-border-primary">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-muted">Last 7 days</span>
            <span className={cn('font-medium', weeklyChangeColor)}>
              {weeklyChangeText}
            </span>
          </div>
          <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-graph-2 transition-all duration-700 ease-out"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
