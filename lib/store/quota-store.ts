/**
 * Quota Store (WP41 T354)
 *
 * Zustand store for Figma API quota state management.
 * Client-side state with real-time updates via /api/quota endpoint.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { QuotaStats } from '../api-quota-tracker';

export interface QuotaState extends QuotaStats {
  /** Loading state */
  isLoading: boolean;
  /** Last refresh timestamp */
  lastRefresh: number | null;
  /** Error message if any */
  error: string | null;

  /** Actions */
  refreshQuota: () => Promise<void>;
  reset: () => void;
}

const initialState: Omit<QuotaState, 'refreshQuota' | 'reset'> = {
  tier1LastMinute: 0,
  tier2LastMinute: 0,
  todayTotal: { tier1: 0, tier2: 0 },
  weeklyData: [],
  endpointBreakdown: {
    fetchScreenshot: 0,
    fetchSVGBatch: 0,
    fetchNode: 0,
    fetchFileMetadata: 0,
  },
  criticalPercent: 0,
  status: 'ok',
  isLoading: false,
  lastRefresh: null,
  error: null,
};

export const useQuotaStore = create<QuotaState>()(
  devtools(
    (set) => ({
      ...initialState,

      refreshQuota: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/quota');
          if (!response.ok) {
            throw new Error(`Failed to fetch quota: ${response.status}`);
          }

          const stats: QuotaStats = await response.json();

          set({
            ...stats,
            isLoading: false,
            lastRefresh: Date.now(),
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to refresh quota:', message);
          set({ isLoading: false, error: message });
        }
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'QuotaStore' }
  )
);
