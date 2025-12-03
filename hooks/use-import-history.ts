/**
 * WP43: Hook for import history (sparkline data)
 *
 * Calculates imports per day for the last 7 days for dashboard sparkline.
 */

import { useMemo } from 'react';
import { useNodesStore } from '@/lib/store';

export interface DailyImport {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Number of imports on that day */
  count: number;
}

export interface ImportHistoryResult {
  /** Daily import counts for last 7 days */
  dailyImports: DailyImport[];
  /** Total imports in the period */
  totalImports: number;
  /** Array of just counts for sparkline rendering */
  sparklineData: number[];
}

/**
 * Calculate import history for the last 7 days
 *
 * @returns Import history data for sparkline visualization
 */
export function useImportHistory(): ImportHistoryResult {
  const nodes = useNodesStore((s) => s.nodes);

  return useMemo(() => {
    // Generate last 7 days (oldest to newest for sparkline)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i)); // Start from 6 days ago
      return date.toISOString().split('T')[0];
    });

    // Count imports per day
    const dailyImports = last7Days.map((date) => ({
      date,
      count: nodes.filter((n) => n.addedAt.startsWith(date)).length,
    }));

    const totalImports = dailyImports.reduce((sum, day) => sum + day.count, 0);
    const sparklineData = dailyImports.map((d) => d.count);

    return {
      dailyImports,
      totalImports,
      sparklineData,
    };
  }, [nodes]);
}

export default useImportHistory;
