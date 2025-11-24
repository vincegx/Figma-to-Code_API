import { useEffect } from 'react';
import { useUIStore } from '@/lib/store';

/**
 * Hook to load and access dashboard stats
 *
 * Wraps Zustand ui-store.loadStats() with automatic loading on mount.
 * Stats are cached with 5-minute TTL in ui-store.
 *
 * @returns Dashboard stats and loading state
 */
export function useLibraryStats() {
  const loadStats = useUIStore((state) => state.loadStats);
  const stats = useUIStore((state) => state.stats);
  const statsLastUpdated = useUIStore((state) => state.statsLastUpdated);

  // Load stats on mount (uses TTL cache in ui-store)
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Calculate if stats are stale (older than 5 minutes)
  const isStale = statsLastUpdated
    ? Date.now() - statsLastUpdated > 5 * 60 * 1000
    : true;

  return {
    stats,
    isStale,
    refresh: loadStats,
  };
}
