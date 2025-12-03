'use client';

/**
 * Homepage: Dashboard (WP42 Redesign V2)
 *
 * Layout:
 *   [Header: "Dashboard" + API Indicator]
 *   [Import URL Input + Tip]
 *   [4 Metrics Cards - Total Nodes, Conversion Rate, Links Deprecated, Rules Active]
 *   [Conversion Pipeline (2/3) | Health Score (1/3)]
 *   [Recent Imports Carousel]
 */

import { useEffect, useState, useCallback } from 'react';
import { useUIStore, useNodesStore, useRulesStore } from '@/lib/store';
import { useWeeklyTrend } from '@/hooks/use-weekly-trend';
import { useConversionRate } from '@/hooks/use-conversion-rate';
import { FileText, TrendingUp, Link2, Zap, Lightbulb, Upload, Loader2 } from 'lucide-react';
import { useFigmaProgress } from '@/hooks/use-figma-progress';
import { ImportProgress } from '@/components/import-progress';
import { ImportLogs } from '@/components/import-logs';
import { cn } from '@/lib/utils';

// Components
import { QuotaIndicator } from '@/components/quota/quota-indicator';
import { ConversionPipeline } from '@/components/conversion-pipeline';
import { HealthScore } from '@/components/health-score';
import { RecentImportsCarousel } from '@/components/recent-imports-carousel';

// Metrics Card Component (redesigned)
function MetricsCard({
  icon: Icon,
  title,
  value,
  suffix,
  badge,
  variant = 'sparkline',
  chartData,
  extraInfo,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  suffix?: string;
  badge?: { value: number; positive: boolean };
  variant?: 'sparkline' | 'barchart' | 'status';
  chartData?: number[];
  extraInfo?: { label: string; value: string; color: string };
}) {
  // Default chart data
  const data = chartData || [4, 6, 5, 8, 7, 9, 8];

  const getChartColor = () => {
    if (variant === 'barchart') return '#3b82f6'; // blue
    if (title.includes('Conversion')) return '#22c55e'; // green
    return '#22d3ee'; // cyan
  };

  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-primary">
      {/* Header: Icon + Badge */}
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-text-muted" />
        {badge && (
          <span
            className={cn(
              'text-xs font-medium',
              badge.positive ? 'text-cyan-400' : 'text-red-400'
            )}
          >
            {badge.positive ? '+' : ''}{badge.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-text-primary tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {suffix && <span className="text-lg text-text-muted">{suffix}</span>}
      </div>

      {/* Title */}
      <p className="text-sm text-text-muted mb-3">{title}</p>

      {/* Chart or Extra Info */}
      {variant === 'status' && extraInfo ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{extraInfo.label}</span>
          <span className={extraInfo.color}>{extraInfo.value}</span>
        </div>
      ) : variant === 'barchart' ? (
        <div className="h-10 flex items-end gap-1">
          {data.map((val, i) => (
            <div
              key={i}
              className="flex-1 bg-blue-500 rounded-sm transition-all"
              style={{ height: `${(val / Math.max(...data)) * 100}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="h-10">
          <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getChartColor()} stopOpacity="0.3" />
                <stop offset="100%" stopColor={getChartColor()} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0 ${30 - (data[0] / 10) * 30} ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${30 - (d / 10) * 30}`).join(' ')} L 100 30 L 0 30 Z`}
              fill={`url(#gradient-${title.replace(/\s/g, '')})`}
            />
            <path
              d={`M 0 ${30 - (data[0] / 10) * 30} ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${30 - (d / 10) * 30}`).join(' ')}`}
              fill="none"
              stroke={getChartColor()}
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// Rules Active Card (special variant with icon background)
function RulesActiveCard({ value, loaded }: { value: number; loaded: number }) {
  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-primary">
      {/* Header: Icon in colored circle */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-text-primary tabular-nums mb-1">
        {value}
      </div>

      {/* Title */}
      <p className="text-sm text-text-muted mb-3">Rules Active</p>

      {/* Loaded status */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-emerald-400">Loaded</span>
        <span className="text-emerald-400">{loaded}%</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const loadStats = useUIStore((state) => state.loadStats);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const loadRules = useRulesStore((state) => state.loadRules);
  const nodes = useNodesStore((state) => state.nodes);
  const rules = useRulesStore((state) => state.rules);

  // Import state
  const [url, setUrl] = useState('');
  const { isRunning, steps, logs, error, result, startImport, cancel, reset } = useFigmaProgress();

  // Custom hooks for metrics
  const { trend } = useWeeklyTrend();
  const { rate } = useConversionRate();

  // Calculate active rules
  const activeRules = rules.filter((r) => {
    const metadata = r.metadata || r;
    return metadata.enabled !== false;
  }).length;

  // Load data on mount
  useEffect(() => {
    loadStats();
    loadLibrary();
    loadRules();
  }, [loadStats, loadLibrary, loadRules]);

  const handleImport = useCallback(async () => {
    if (url.trim() && !isRunning) {
      await startImport(url);
    }
  }, [url, startImport, isRunning]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isRunning && url.trim()) {
        handleImport();
      }
    },
    [handleImport, isRunning, url]
  );

  const hasStarted = logs.length > 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-muted text-sm mt-1">
              Monitor your Figma imports and conversion pipeline
            </p>
          </div>
          <QuotaIndicator />
        </div>

        {/* Import Section */}
        <div className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste Figma URL here..."
              disabled={isRunning}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-lg',
                'bg-bg-card border border-border-primary',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent',
                'disabled:opacity-50'
              )}
            />
            <button
              onClick={isRunning ? cancel : handleImport}
              disabled={!url.trim() && !isRunning}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                'transition-colors',
                isRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancel
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          </div>

          {/* Tip */}
          {!hasStarted && (
            <div className="flex items-center gap-2 mt-3 text-sm text-text-muted">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>
                Tip: In Figma, right-click any element → Copy link to clipboard
              </span>
            </div>
          )}

          {/* Progress */}
          {hasStarted && (
            <div className="mt-4 p-4 bg-bg-card rounded-lg border border-border-primary">
              <ImportProgress
                steps={steps.map((s) => ({
                  id: s.id,
                  label: s.label,
                  status: s.status === 'skipped' ? 'skipped' : s.status,
                  message: s.message,
                }))}
              />
              <div className="mt-3 max-h-24 overflow-y-auto">
                <ImportLogs logs={logs} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isRunning && (
            <div className="mt-3 p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {result !== null && !error && (
            <div className="mt-3 p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-sm">
              Import successful! Your design has been added to the library.
            </div>
          )}
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            icon={FileText}
            title="Total Nodes"
            value={nodes.length}
            badge={trend !== 0 ? { value: trend, positive: trend > 0 } : undefined}
            variant="sparkline"
            chartData={[4, 6, 5, 7, 6, 8, nodes.length || 8]}
          />
          <MetricsCard
            icon={TrendingUp}
            title="Conversion Rate"
            value={rate}
            suffix="%"
            variant="sparkline"
            chartData={[20, 35, 30, 45, 40, 55, rate || 50]}
          />
          <MetricsCard
            icon={Link2}
            title="Links Deprecated"
            value="—"
            variant="barchart"
            chartData={[3, 5, 4, 6, 5, 7, 6, 8, 7]}
          />
          <RulesActiveCard value={activeRules} loaded={100} />
        </div>

        {/* Pipeline + Health Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <ConversionPipeline />
          </div>
          <div>
            <HealthScore />
          </div>
        </div>

        {/* Recent Imports */}
        <RecentImportsCarousel />
      </div>
    </div>
  );
}
