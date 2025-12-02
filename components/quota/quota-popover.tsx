/**
 * Quota Popover (WP41 T358)
 *
 * Detailed popover with tier breakdown, endpoint stats, and 7-day chart.
 * Sections:
 * 1. Requests This Minute (2 progress bars)
 * 2. Endpoint Breakdown
 * 3. Today's Usage
 * 4. Last 7 Days (chart)
 * 5. Info Footer
 */

'use client';

import { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
import { Info } from 'lucide-react';

interface QuotaPopoverProps {
  children: ReactNode;
}

export function QuotaPopover({ children }: QuotaPopoverProps) {
  // Use store directly - no interval here, indicator handles refresh
  const tier1LastMinute = useQuotaStore((s) => s.tier1LastMinute);
  const tier2LastMinute = useQuotaStore((s) => s.tier2LastMinute);
  const todayTotal = useQuotaStore((s) => s.todayTotal);
  const weeklyData = useQuotaStore((s) => s.weeklyData);
  const endpointBreakdown = useQuotaStore((s) => s.endpointBreakdown);

  // Calculate tier percentages
  const tier1Percent = Math.round((tier1LastMinute / 15) * 100);
  const tier2Percent = Math.round((tier2LastMinute / 50) * 100);

  // Format date for chart (show day name)
  const formattedWeeklyData = weeklyData.map((d) => {
    const date = new Date(d.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      ...d,
      dayName,
    };
  });

  // Check if there's any data
  const hasData = weeklyData.some((d) => d.tier1 > 0 || d.tier2 > 0);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">API Quota</h3>
            <span className="text-xs text-text-muted">Figma Rate Limits</span>
          </div>

          <Separator />

          {/* Requests This Minute */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-secondary">
              Requests This Minute
            </h4>

            {/* Tier 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">
                  Tier 1 (Images)
                </span>
                <span className={tier1Percent >= 80 ? 'text-status-error-text' : tier1Percent >= 60 ? 'text-status-warning-text' : 'text-text-secondary'}>
                  {tier1LastMinute}/15
                </span>
              </div>
              <Progress
                value={tier1Percent}
                className="h-2"
              />
            </div>

            {/* Tier 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">
                  Tier 2 (Data)
                </span>
                <span className={tier2Percent >= 80 ? 'text-status-error-text' : tier2Percent >= 60 ? 'text-status-warning-text' : 'text-text-secondary'}>
                  {tier2LastMinute}/50
                </span>
              </div>
              <Progress
                value={tier2Percent}
                className="h-2"
              />
            </div>
          </div>

          <Separator />

          {/* Endpoint Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-secondary">
              Endpoint Breakdown (Today)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">fetchScreenshot</span>
                <span className="text-text-primary">{endpointBreakdown.fetchScreenshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">fetchSVGBatch</span>
                <span className="text-text-primary">{endpointBreakdown.fetchSVGBatch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">fetchNode</span>
                <span className="text-text-primary">{endpointBreakdown.fetchNode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">fetchFileMetadata</span>
                <span className="text-text-primary">{endpointBreakdown.fetchFileMetadata}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Today's Usage */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Today&apos;s Total</span>
            <div className="text-text-primary">
              <span className="text-accent-primary">{todayTotal.tier1}</span>
              <span className="text-text-muted mx-1">+</span>
              <span className="text-blue-500">{todayTotal.tier2}</span>
              <span className="text-text-muted ml-1">= {todayTotal.tier1 + todayTotal.tier2}</span>
            </div>
          </div>

          <Separator />

          {/* 7-Day Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-secondary">
              Last 7 Days
            </h4>
            {hasData ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedWeeklyData} barGap={2}>
                    <XAxis
                      dataKey="dayName"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                      contentStyle={{
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#fafafa',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
                      }}
                      labelStyle={{ color: '#d4d4d8', marginBottom: '4px' }}
                      itemStyle={{ color: '#fafafa', padding: '2px 0' }}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend
                      formatter={(value) => (value === 'tier1' ? 'Images' : 'Data')}
                      wrapperStyle={{ fontSize: '10px' }}
                    />
                    <Bar dataKey="tier1" fill="var(--accent-primary)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="tier2" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-text-muted text-sm">
                No API calls yet
              </div>
            )}
          </div>

          <Separator />

          {/* Info Footer */}
          <div className="flex items-start gap-2 text-xs text-text-muted">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <p>
              Tier 1: 15 req/min (images). Tier 2: 50 req/min (data).
              Data retained for 7 days.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
