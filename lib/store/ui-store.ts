import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DashboardStats } from '../types/dashboard';

/**
 * UIState: Global UI preferences and transient state
 *
 * State:
 * - theme: 'light' | 'dark' | 'system' (persisted)
 * - isImporting: Flag for import loading state
 * - isLoadingRules: Flag for rule loading state
 * - stats: Cached dashboard stats (total nodes, rules, coverage)
 * - statsLastUpdated: Timestamp of last stats calculation (for TTL)
 */
export interface UIState {
  // Preferences (persisted in localStorage)
  theme: 'light' | 'dark' | 'system';

  // Transient state (NOT persisted)
  isImporting: boolean;
  isLoadingRules: boolean;
  stats: DashboardStats | null;
  statsLastUpdated: number | null; // Unix timestamp

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setImporting: (isImporting: boolean) => void;
  setLoadingRules: (isLoadingRules: boolean) => void;
  loadStats: () => Promise<void>;
  invalidateStats: () => void;
}

/**
 * Create UI store with DevTools and persistence
 */
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: 'system',
        isImporting: false,
        isLoadingRules: false,
        stats: null,
        statsLastUpdated: null,

        // Actions
        setTheme: (theme: 'light' | 'dark' | 'system') => {
          set({ theme });
        },

        setImporting: (isImporting: boolean) => {
          set({ isImporting });
        },

        setLoadingRules: (isLoadingRules: boolean) => {
          set({ isLoadingRules });
        },

        loadStats: async () => {
          const STATS_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
          const now = Date.now();
          const lastUpdated = get().statsLastUpdated;

          // Check TTL: if stats still valid, skip recalculation
          if (lastUpdated && now - lastUpdated < STATS_TTL) {
            console.log('Stats cache valid, skipping recalculation');
            return;
          }

          try {
            // Fetch stats from API route (WP03)
            const response = await fetch('/api/library/stats');
            if (!response.ok) {
              throw new Error('Failed to load stats');
            }

            const stats: DashboardStats = await response.json();

            set({
              stats,
              statsLastUpdated: now,
            });
          } catch (error) {
            console.error('Failed to load stats:', error);
            // TODO: Show toast error
          }
        },

        invalidateStats: () => {
          set({ stats: null, statsLastUpdated: null });
        },
      }),
      {
        name: 'ui-store', // localStorage key
        partialize: (state) => ({
          // Persist theme only, NOT transient state
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' } // DevTools name
  )
);
