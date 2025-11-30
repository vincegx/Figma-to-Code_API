'use client';

/**
 * Homepage: Mission Control Dashboard
 *
 * New layout with:
 *   [Command Center - Hero Section with Import]
 *   [Live Metrics - 4 Stats Cards with Trends]
 *   [Conversion Pipeline (2/3) | Health Score (1/3)]
 *   [Recent Imports Carousel with Quick Actions]
 */

import { useEffect } from 'react';
import { useUIStore, useNodesStore, useRulesStore } from '@/lib/store';
import { useWeeklyTrend } from '@/hooks/use-weekly-trend';
import { useConversionRate } from '@/hooks/use-conversion-rate';
import { Package, Zap, FileCode, Target } from 'lucide-react';

// New Mission Control Components
import { CommandCenter } from '@/components/command-center';
import { LiveMetricsCard } from '@/components/live-metrics-card';
import { ConversionPipeline } from '@/components/conversion-pipeline';
import { HealthScore } from '@/components/health-score';
import { RecentImportsCarousel } from '@/components/recent-imports-carousel';

export default function HomePage() {
  const loadStats = useUIStore((state) => state.loadStats);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const loadRules = useRulesStore((state) => state.loadRules);
  const nodes = useNodesStore((state) => state.nodes);
  const rules = useRulesStore((state) => state.rules);

  // Custom hooks for metrics
  const { trend, trendLabel } = useWeeklyTrend();
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

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Command Center (Hero Section) */}
        <section className="mb-8">
          <CommandCenter />
        </section>

        {/* Live Metrics - 4 Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <LiveMetricsCard
            title="Total Nodes"
            value={nodes.length}
            icon={Package}
            trend={trend !== 0 ? { value: trend, label: 'this week' } : undefined}
          />
          <LiveMetricsCard
            title="Conversion Rate"
            value={rate}
            suffix="%"
            icon={Zap}
            variant={rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'default'}
          />
          <LiveMetricsCard
            title="Lines Generated"
            value="—"
            icon={FileCode}
            variant="info"
          />
          <LiveMetricsCard
            title="Rules Active"
            value={activeRules}
            icon={Target}
            variant={activeRules > 0 ? 'success' : 'default'}
          />
        </section>

        {/* Pipeline + Health Score */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <ConversionPipeline />
          </div>
          <div>
            <HealthScore />
          </div>
        </section>

        {/* Recent Imports */}
        <section>
          <RecentImportsCarousel />
        </section>
      </div>
    </div>
  );
}
