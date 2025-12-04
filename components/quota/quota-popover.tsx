/**
 * Quota Popover (WP41 T358 + WP42 Polish)
 *
 * Detailed popover with tier breakdown, endpoint stats, and 7-day chart.
 * Updated with new dark mode design system colors.
 */

'use client';

import { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuotaStore } from '@/lib/store/quota-store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Info, Zap, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotaPopoverProps {
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function QuotaPopover({ children, side = 'bottom' }: QuotaPopoverProps) {
  const tier1LastMinute = useQuotaStore((s) => s.tier1LastMinute);
  const tier2LastMinute = useQuotaStore((s) => s.tier2LastMinute);
  const todayTotal = useQuotaStore((s) => s.todayTotal);
  const weeklyData = useQuotaStore((s) => s.weeklyData);
  const endpointBreakdown = useQuotaStore((s) => s.endpointBreakdown);

  const tier1Percent = Math.round((tier1LastMinute / 15) * 100);
  const tier2Percent = Math.round((tier2LastMinute / 50) * 100);

  const formattedWeeklyData = weeklyData.map((d) => {
    const date = new Date(d.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { ...d, dayName };
  });

  const hasData = weeklyData.some((d) => d.tier1 > 0 || d.tier2 > 0);

  const getStatusColor = (percent: number) => {
    if (percent >= 80) return 'text-quota-critical-text';
    if (percent >= 60) return 'text-quota-warning-text';
    return 'text-quota-ok-text';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-quota-critical-text';
    if (percent >= 60) return 'bg-quota-warning-text';
    return 'bg-quota-ok-text';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-bg-card border border-border-primary rounded-xl shadow-2xl"
        align={side === 'right' ? 'start' : 'end'}
        side={side}
        sideOffset={8}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">API Quota</h3>
            <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-bg-secondary">Figma Limits</span>
          </div>

          {/* Requests This Minute */}
          <div className="p-3 rounded-lg bg-bg-secondary space-y-3">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Requests / Minute
            </h4>

            {/* Tier 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Zap className="w-3 h-3 text-graph-1" />
                  Tier 1 (Images)
                </span>
                <span className={cn('font-mono font-medium', getStatusColor(tier1Percent))}>
                  {tier1LastMinute}/15
                </span>
              </div>
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', getProgressColor(tier1Percent))}
                  style={{ width: `${Math.min(tier1Percent, 100)}%` }}
                />
              </div>
            </div>

            {/* Tier 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Database className="w-3 h-3 text-graph-5" />
                  Tier 2 (Data)
                </span>
                <span className={cn('font-mono font-medium', getStatusColor(tier2Percent))}>
                  {tier2LastMinute}/50
                </span>
              </div>
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', getProgressColor(tier2Percent))}
                  style={{ width: `${Math.min(tier2Percent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Endpoint Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Endpoints (Today)
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Screenshot</span>
                <span className="text-text-primary font-mono">{endpointBreakdown.fetchScreenshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">SVG Batch</span>
                <span className="text-text-primary font-mono">{endpointBreakdown.fetchSVGBatch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Node</span>
                <span className="text-text-primary font-mono">{endpointBreakdown.fetchNode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Metadata</span>
                <span className="text-text-primary font-mono">{endpointBreakdown.fetchFileMetadata}</span>
              </div>
            </div>
          </div>

          {/* Today's Usage */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary">
            <span className="text-xs text-text-muted">Today&apos;s Total</span>
            <div className="text-xs font-mono">
              <span className="text-graph-1">{todayTotal.tier1}</span>
              <span className="text-text-muted mx-1">+</span>
              <span className="text-graph-5">{todayTotal.tier2}</span>
              <span className="text-text-muted ml-1">= </span>
              <span className="text-text-primary font-medium">{todayTotal.tier1 + todayTotal.tier2}</span>
            </div>
          </div>

          {/* 7-Day Chart */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Last 7 Days
            </h4>
            {hasData ? (
              <div className="h-28 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedWeeklyData} barGap={2}>
                    <XAxis
                      dataKey="dayName"
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      }}
                      labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-primary)', padding: '2px 0' }}
                    />
                    <Legend
                      formatter={(value) => (value === 'tier1' ? 'Images' : 'Data')}
                      wrapperStyle={{ fontSize: '10px' }}
                    />
                    <Bar dataKey="tier1" fill="var(--graph-1)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="tier2" fill="var(--graph-5)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-text-muted text-xs">
                No API calls yet
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="flex items-start gap-2 pt-2 border-t border-border-primary">
            <Info className="h-3 w-3 mt-0.5 shrink-0 text-text-muted" />
            <p className="text-xs text-text-muted leading-relaxed">
              Tier 1: 15/min (images) • Tier 2: 50/min (data)
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
