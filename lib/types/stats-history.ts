/**
 * Stats History Types (WP44)
 *
 * Types for managing historical statistics with 90-day retention.
 * Aggregates TransformStats from all nodes for dashboard sparklines and trends.
 */

/**
 * Daily aggregated statistics
 * Aligns with TransformStats from library.ts (WP43)
 */
export interface DailyStats {
  /** ISO date string (YYYY-MM-DD) */
  readonly date: string;
  /** Number of nodes imported on this day */
  readonly nodesImported: number;

  // Aggregation of TransformStats across all nodes
  readonly totalNodes: number;
  readonly maxDepth: number;
  readonly nodesByType: Record<string, number>;
  readonly autoLayoutCount: number;
  readonly absolutePositionedCount: number;
  readonly groupsInlined: number;
  readonly imagesCount: number;
  readonly iconsCount: number;
  readonly gradientsCount: number;
  readonly semanticCount: number;
  readonly arbitraryCount: number;
  readonly variablesUsed: number;
}

/**
 * Stats history file structure
 */
export interface StatsHistory {
  /** Schema version for migrations */
  readonly version: number;
  /** Retention period in days (default: 90) */
  readonly retentionDays: number;
  /** Daily statistics entries */
  readonly dailyStats: DailyStats[];
}

/**
 * Default empty DailyStats for aggregation
 */
export const EMPTY_DAILY_STATS: Omit<DailyStats, 'date'> = {
  nodesImported: 0,
  totalNodes: 0,
  maxDepth: 0,
  nodesByType: {},
  autoLayoutCount: 0,
  absolutePositionedCount: 0,
  groupsInlined: 0,
  imagesCount: 0,
  iconsCount: 0,
  gradientsCount: 0,
  semanticCount: 0,
  arbitraryCount: 0,
  variablesUsed: 0,
};

/**
 * Default stats history structure
 */
export const DEFAULT_STATS_HISTORY: StatsHistory = {
  version: 1,
  retentionDays: 90,
  dailyStats: [],
};
