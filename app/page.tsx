'use client';

import { useEffect } from 'react';
import { useUIStore, useNodesStore } from '@/lib/store';
import StatsCard from '@/components/stats-card';
import RecentNodes from '@/components/recent-nodes';
import RuleUsageChart from '@/components/rule-usage-chart';
import ImportDialog from '@/components/import-dialog';

/**
 * Homepage: Dashboard with stats, recent nodes, import field
 *
 * Layout:
 *   [Stats Cards (4 cols)]
 *   [Import Field (full width)]
 *   [Recent Nodes (left) | Rule Usage Chart (right)]
 *   [Quick Actions (bottom)]
 */
export default function HomePage() {
  const loadStats = useUIStore((state) => state.loadStats);
  const stats = useUIStore((state) => state.stats);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);

  // Load data on mount
  useEffect(() => {
    loadStats();
    loadLibrary();
  }, [loadStats, loadLibrary]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Nodes"
          value={stats?.overview.totalNodes || 0}
          icon="📦"
        />
        <StatsCard
          title="Total Rules"
          value={stats?.overview.totalRules || 0}
          icon="📏"
        />
        <StatsCard
          title="Collections"
          value={stats?.overview.totalCollections || 0}
          icon="📊"
        />
        <StatsCard
          title="Generated Files"
          value={stats?.overview.totalGeneratedFiles || 0}
          icon="📄"
        />
      </div>

      {/* Import Field */}
      <ImportDialog />

      {/* Recent Nodes + Rule Usage Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecentNodes />
        <RuleUsageChart />
      </div>

    </div>
  );
}
