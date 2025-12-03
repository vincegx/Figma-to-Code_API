/**
 * Hook: useStatsHistory (WP44)
 *
 * Fetches stats history from the API for dashboard sparklines and trends.
 * Provides computed weekly change and sparkline data.
 */

import { useState, useEffect, useMemo } from 'react';
import type { DailyStats } from '@/lib/types/stats-history';

interface StatsHistoryResponse {
  success: boolean;
  dailyStats: DailyStats[];
  totals: Omit<DailyStats, 'date'>;
  daysRequested?: number;
}

export interface StatsHistoryResult {
  /** Daily stats for the requested period */
  data: DailyStats[];
  /** Aggregated totals */
  totals: Omit<DailyStats, 'date'> | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Weekly change percentage (null if not enough data) */
  weeklyChange: number | null;
  /** Sparkline data for a specific metric */
  getSparklineData: (metric: keyof Omit<DailyStats, 'date' | 'nodesByType'>) => number[];
}

/**
 * Hook to fetch and use stats history
 * @param days Number of days to fetch (default: 7)
 */
export function useStatsHistory(days: number = 7): StatsHistoryResult {
  const [data, setData] = useState<DailyStats[]>([]);
  const [totals, setTotals] = useState<Omit<DailyStats, 'date'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/stats-history?days=${days}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats history');
        }

        const result: StatsHistoryResponse = await response.json();

        if (isMounted) {
          setData(result.dailyStats || []);
          setTotals(result.totals || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [days]);

  // Calculate weekly change based on first and last day
  const weeklyChange = useMemo(() => {
    if (data.length < 2) return null;

    const first = data[0];
    const last = data[data.length - 1];

    // Use totalNodes as the primary metric for weekly change
    const firstValue = first.totalNodes;
    const lastValue = last.totalNodes;

    if (firstValue === 0) {
      return lastValue > 0 ? 100 : 0;
    }

    return Math.round(((lastValue - firstValue) / firstValue) * 100);
  }, [data]);

  // Function to extract sparkline data for a specific metric
  const getSparklineData = useMemo(() => {
    return (metric: keyof Omit<DailyStats, 'date' | 'nodesByType'>): number[] => {
      if (data.length === 0) {
        // Return flat line for empty data
        return Array(7).fill(0);
      }

      // Fill missing days with zeros to ensure consistent sparkline length
      const values = data.map((d) => d[metric] as number);

      // Pad to at least 7 points for smooth sparkline
      while (values.length < 7) {
        values.unshift(0);
      }

      return values;
    };
  }, [data]);

  return {
    data,
    totals,
    isLoading,
    error,
    weeklyChange,
    getSparklineData,
  };
}
