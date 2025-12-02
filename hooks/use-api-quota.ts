/**
 * Hook: useApiQuota (WP41 T355)
 *
 * React hook for components to consume Figma API quota state.
 * Auto-refreshes every 10 seconds when mounted.
 */

import { useEffect, useCallback } from 'react';
import { useQuotaStore } from '@/lib/store/quota-store';

const REFRESH_INTERVAL = 45 * 1000; // 45 seconds

export function useApiQuota() {
  const {
    tier1LastMinute,
    tier2LastMinute,
    todayTotal,
    weeklyData,
    endpointBreakdown,
    criticalPercent,
    status,
    isLoading,
    lastRefresh,
    error,
    refreshQuota,
  } = useQuotaStore();

  // Stable refresh callback
  const refresh = useCallback(() => {
    refreshQuota();
  }, [refreshQuota]);

  // Auto-refresh on mount and interval
  useEffect(() => {
    // Initial fetch
    refresh();

    // Set up interval
    const interval = setInterval(refresh, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refresh]);

  return {
    // Stats
    tier1LastMinute,
    tier2LastMinute,
    todayTotal,
    weeklyData,
    endpointBreakdown,
    criticalPercent,
    status,

    // Metadata
    isLoading,
    lastRefresh,
    error,

    // Actions
    refreshQuota: refresh,
  };
}
