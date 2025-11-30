'use client';

/**
 * HealthScore - Gamified Score Display
 *
 * Shows a circular gauge with:
 * - Animated SVG circle
 * - Color based on score level
 * - Breakdown details
 * - Improvement suggestions
 */

import { useHealthScore } from '@/hooks/use-health-score';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const scoreConfig = {
  excellent: {
    color: 'text-status-success-text',
    bgColor: 'text-status-success-text/20',
    strokeColor: '#22c55e',
    label: 'Excellent',
  },
  good: {
    color: 'text-accent-primary',
    bgColor: 'text-accent-primary/20',
    strokeColor: '#3b82f6',
    label: 'Good',
  },
  'needs-improvement': {
    color: 'text-status-warning-text',
    bgColor: 'text-status-warning-text/20',
    strokeColor: '#eab308',
    label: 'Needs Work',
  },
  poor: {
    color: 'text-status-error-text',
    bgColor: 'text-status-error-text/20',
    strokeColor: '#ef4444',
    label: 'Poor',
  },
};

export function HealthScore() {
  const { score, level, details, suggestions } = useHealthScore();
  const config = scoreConfig[level];

  // SVG circle calculations
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="p-6 rounded-xl bg-bg-card border border-border-primary h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Health Score</h3>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            level === 'excellent' && 'bg-status-success-bg text-status-success-text',
            level === 'good' && 'bg-accent-secondary text-accent-primary',
            level === 'needs-improvement' && 'bg-status-warning-bg text-status-warning-text',
            level === 'poor' && 'bg-status-error-bg text-status-error-text'
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Circular Score */}
      <div className="flex items-center justify-center py-4 flex-1">
        <div className="relative w-36 h-36">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="var(--bg-secondary)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={config.strokeColor}
              strokeWidth="12"
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

      {/* Breakdown */}
      <div className="space-y-2.5 mt-2">
        <div className="flex items-center gap-2 text-sm">
          {details.totalRules > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-status-success-text flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-status-warning-text flex-shrink-0" />
          )}
          <span className="text-text-secondary">
            {details.totalRules} rule{details.totalRules !== 1 ? 's' : ''} loaded
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {details.nodesCount > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-status-success-text flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-status-warning-text flex-shrink-0" />
          )}
          <span className="text-text-secondary">
            {details.nodesCount} node{details.nodesCount !== 1 ? 's' : ''} imported
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {details.nodesViewed > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-status-success-text flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-status-warning-text flex-shrink-0" />
          )}
          <span className="text-text-secondary">
            {details.nodesViewed}/{details.nodesCount} viewed
          </span>
        </div>
      </div>

      {/* Suggestion (show first one if available) */}
      {suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-primary">
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
            <span className="text-text-muted">{suggestions[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
