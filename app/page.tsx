'use client';

/**
 * Homepage: Dashboard (WP42 Redesign V2 + WP43 Transform Stats)
 *
 * Layout:
 *   [Header: "Dashboard" + API Indicator]
 *   [Import URL Input + Tip]
 *   [4 Metrics Cards - Nodes Imported, Semantic Score, Assets, Responsive]
 *   [Conversion Pipeline (2/3) | Health Score (1/3)]
 *   [Recent Imports Carousel]
 *
 * WP43: Cards now display real transformation statistics:
 * - Card 1: Nodes importés (total + sparkline 7 jours)
 * - Card 2: Semantic Score (% classes sémantiques + stacked bar)
 * - Card 3: Assets (total + bar chart images/icônes/gradients)
 * - Card 4: Responsive (% auto-layout + progress bar)
 */

import { useEffect, useState, useCallback } from 'react';
import { useUIStore, useNodesStore, useRulesStore } from '@/lib/store';
import { useWeeklyTrend } from '@/hooks/use-weekly-trend';
import { useImportHistory } from '@/hooks/use-import-history';
import { useAggregatedStats } from '@/hooks/use-aggregated-stats';
import { Layers, Sparkles, Image, LayoutGrid, Lightbulb, Upload, Loader2 } from 'lucide-react';
import { useFigmaProgress } from '@/hooks/use-figma-progress';
import { ImportProgress } from '@/components/import-progress';
import { ImportLogs } from '@/components/import-logs';
import { cn } from '@/lib/utils';

// Components
import { QuotaIndicator } from '@/components/quota/quota-indicator';
import { ConversionPipeline } from '@/components/conversion-pipeline';
import { HealthScore } from '@/components/health-score';
import { RecentImportsCarousel } from '@/components/recent-imports-carousel';

// WP43: Tooltip data type for hover info
interface TooltipData {
  label: string;
  value: number | string;
}

// WP43: Metrics Card Component with tooltip support
function MetricsCard({
  icon: Icon,
  title,
  value,
  suffix,
  badge,
  variant = 'sparkline',
  chartData,
  tooltipData,
  noData,
  noDataMessage,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  suffix?: string;
  badge?: { value: number; positive: boolean };
  variant?: 'sparkline' | 'barchart' | 'stacked-bar' | 'progress';
  chartData?: number[];
  tooltipData?: TooltipData[];
  noData?: boolean;
  noDataMessage?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const data = chartData || [4, 6, 5, 8, 7, 9, 8];
  const maxVal = Math.max(...data, 1);

  const getChartColor = () => {
    if (title.includes('Semantic')) return '#22d3ee'; // cyan
    if (title.includes('Responsive')) return '#10b981'; // emerald
    return '#22d3ee'; // cyan default
  };

  // Asset bar colors (images=blue, icons=cyan, gradients=emerald)
  const barColors = ['#3b82f6', '#22d3ee', '#10b981'];

  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-primary relative h-full flex flex-col">
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
          {noData ? '—' : (typeof value === 'number' ? value.toLocaleString() : value)}
        </span>
        {suffix && !noData && <span className="text-lg text-text-muted">{suffix}</span>}
      </div>

      {/* Title */}
      <p className="text-sm text-text-muted">{title}</p>

      {/* Graph container - always at bottom */}
      <div className="mt-auto pt-3">
      {/* No data state */}
      {noData ? (
        <div className="h-10 flex items-end">
          <div className="w-full h-2 bg-border-primary rounded-full" />
        </div>
      ) : variant === 'stacked-bar' && data.length === 2 ? (
        /* Stacked horizontal bar (Semantic Score) */
        <div className="h-10 relative group flex items-end">
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-bg-secondary">
            <div
              className="bg-cyan-400 transition-all"
              style={{ width: `${data[0]}%` }}
            />
            <div
              className="bg-gray-600 transition-all"
              style={{ width: `${data[1]}%` }}
            />
          </div>
          {/* Tooltip on hover */}
          {tooltipData && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
              {tooltipData.map((t, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span className="text-text-muted">{t.label}:</span>
                  <span className={i === 0 ? 'text-cyan-400' : 'text-gray-400'}>{t.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : variant === 'barchart' ? (
        /* Vertical bar chart (Assets) */
        <div className="h-10 flex items-end gap-1 relative">
          {data.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all cursor-pointer relative group/bar"
              style={{
                height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
                minHeight: val > 0 ? '4px' : '0',
                backgroundColor: barColors[i % barColors.length],
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Individual bar tooltip */}
              {tooltipData && hoveredIndex === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-primary border border-border-primary rounded-lg px-2 py-1 text-xs whitespace-nowrap z-10 shadow-lg">
                  <span className="text-text-muted">{tooltipData[i]?.label}: </span>
                  <span className="text-text-primary font-medium">{tooltipData[i]?.value}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : variant === 'progress' ? (
        /* Progress bar (Responsive) */
        <div className="h-10 relative group flex items-end">
          <div className="h-3 w-full bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all rounded-full"
              style={{ width: `${data[0]}%` }}
            />
          </div>
          {/* Tooltip */}
          {tooltipData && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
              {tooltipData.map((t, i) => (
                <div key={i}>
                  <span className="text-text-muted">{t.label}: </span>
                  <span className="text-emerald-400">{t.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Sparkline (Nodes Imported) - fills entire container with gradient to bottom */
        <div className="h-10 relative group">
          {(() => {
            // Normalize sparkline: use padding so line doesn't touch edges
            const minVal = Math.min(...data);
            const range = maxVal - minVal;
            const effectiveRange = range > 0 ? range : 1;
            // Map values to y positions (5-25 range to leave padding)
            const getY = (val: number) => {
              const normalized = (val - minVal) / effectiveRange;
              return 25 - normalized * 20; // 25 at min, 5 at max
            };
            const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (data.length - 1)) * 100} ${getY(d)}`).join(' ');
            const fillPath = `${pathData} L 100 30 L 0 30 Z`;

            return (
              <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getChartColor()} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={getChartColor()} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={fillPath} fill={`url(#gradient-${title.replace(/\s/g, '')})`} />
                <path d={pathData} fill="none" stroke={getChartColor()} strokeWidth="2" />
              </svg>
            );
          })()}
          {/* Sparkline tooltip */}
          {tooltipData && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
              <div className="text-text-muted">Last 7 days</div>
              {tooltipData.map((t, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="text-text-muted">{t.label}:</span>
                  <span className="text-cyan-400">{t.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No data message */}
      {noData && noDataMessage && (
        <p className="text-xs text-text-muted mt-1">{noDataMessage}</p>
      )}
      </div>{/* End graph container */}
    </div>
  );
}


export default function HomePage() {
  const loadStats = useUIStore((state) => state.loadStats);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const loadRules = useRulesStore((state) => state.loadRules);
  const nodes = useNodesStore((state) => state.nodes);

  // Import state
  const [url, setUrl] = useState('');
  const { isRunning, steps, logs, error, result, startImport, cancel, reset } = useFigmaProgress();

  // WP43: Custom hooks for metrics
  const { trend } = useWeeklyTrend();
  const { sparklineData, dailyImports, totalImports } = useImportHistory();
  const aggregatedStats = useAggregatedStats();

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

        {/* WP43: 4 Metrics Cards with Transform Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Nodes Imported */}
          <MetricsCard
            icon={Layers}
            title="Nodes Imported"
            value={nodes.length}
            badge={trend !== 0 ? { value: trend, positive: trend > 0 } : undefined}
            variant="sparkline"
            chartData={sparklineData}
            tooltipData={dailyImports.map((d) => ({
              label: d.date.slice(5), // MM-DD
              value: d.count,
            }))}
          />

          {/* Card 2: Semantic Score */}
          <MetricsCard
            icon={Sparkles}
            title="Semantic Score"
            value={aggregatedStats.semanticScore}
            suffix="%"
            variant="stacked-bar"
            chartData={[aggregatedStats.semanticScore, 100 - aggregatedStats.semanticScore]}
            tooltipData={[
              { label: 'Semantic', value: `${aggregatedStats.semanticScore}%` },
              { label: 'Arbitrary', value: `${100 - aggregatedStats.semanticScore}%` },
            ]}
            noData={!aggregatedStats.hasCompleteData && aggregatedStats.nodesWithStats === 0}
            noDataMessage="Refetch nodes to generate stats"
          />

          {/* Card 3: Assets */}
          <MetricsCard
            icon={Image}
            title="Assets"
            value={aggregatedStats.totalAssets}
            variant="barchart"
            chartData={[
              aggregatedStats.assetBreakdown.images,
              aggregatedStats.assetBreakdown.icons,
              aggregatedStats.assetBreakdown.gradients,
            ]}
            tooltipData={[
              { label: 'Images', value: aggregatedStats.assetBreakdown.images },
              { label: 'Icons', value: aggregatedStats.assetBreakdown.icons },
              { label: 'Gradients', value: aggregatedStats.assetBreakdown.gradients },
            ]}
            noData={!aggregatedStats.hasCompleteData && aggregatedStats.nodesWithStats === 0}
            noDataMessage="Refetch nodes to generate stats"
          />

          {/* Card 4: Responsive */}
          <MetricsCard
            icon={LayoutGrid}
            title="Responsive"
            value={aggregatedStats.responsivePercent}
            suffix="%"
            variant="progress"
            chartData={[aggregatedStats.responsivePercent]}
            tooltipData={[
              {
                label: 'Auto-layout nodes',
                value: `${aggregatedStats.autoLayoutCount} of ${aggregatedStats.totalNodes}`,
              },
            ]}
            noData={!aggregatedStats.hasCompleteData && aggregatedStats.nodesWithStats === 0}
            noDataMessage="Refetch nodes to generate stats"
          />
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
