/**
 * Hook: useWeeklyTrend
 *
 * Calculates the trend of nodes added this week vs last week.
 * Returns the trend value and a formatted label (↑12 / ↓5).
 */

import { useMemo } from 'react';
import { useNodesStore } from '@/lib/store';

export interface WeeklyTrendResult {
  /** Number of nodes added this week */
  thisWeek: number;
  /** Number of nodes added last week */
  lastWeek: number;
  /** Difference (positive = growth, negative = decline) */
  trend: number;
  /** Formatted label with arrow (↑12 / ↓5) */
  trendLabel: string;
  /** Percentage change */
  percentageChange: number;
}

export function useWeeklyTrend(): WeeklyTrendResult {
  const nodes = useNodesStore((s) => s.nodes);

  return useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = nodes.filter((n) => {
      const addedDate = new Date(n.addedAt);
      return addedDate >= oneWeekAgo;
    }).length;

    const lastWeek = nodes.filter((n) => {
      const addedDate = new Date(n.addedAt);
      return addedDate >= twoWeeksAgo && addedDate < oneWeekAgo;
    }).length;

    const trend = thisWeek - lastWeek;
    const isPositive = trend >= 0;
    const trendLabel = isPositive ? `↑${trend}` : `↓${Math.abs(trend)}`;

    // Calculate percentage change (avoid division by zero)
    const percentageChange = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : thisWeek > 0
        ? 100
        : 0;

    return {
      thisWeek,
      lastWeek,
      trend,
      trendLabel,
      percentageChange,
    };
  }, [nodes]);
}
