/**
 * Stats History Service (WP44)
 *
 * Manages the stats-history.json file in figma-data/.
 * Provides functions to:
 * - Load history
 * - Record daily stats (aggregate from TransformStats)
 * - Get last N days of stats
 * - Clean entries older than retention period
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { StatsHistory, DailyStats } from './types/stats-history';
import { DEFAULT_STATS_HISTORY, EMPTY_DAILY_STATS } from './types/stats-history';
import type { TransformStats } from './types/library';

const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');
const STATS_HISTORY_FILE = path.join(FIGMA_DATA_DIR, 'stats-history.json');

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load stats history from filesystem
 */
export async function loadStatsHistory(): Promise<StatsHistory> {
  try {
    const content = await fs.readFile(STATS_HISTORY_FILE, 'utf-8');
    const history = JSON.parse(content) as StatsHistory;
    return history;
  } catch {
    // File doesn't exist or is invalid, return default
    return DEFAULT_STATS_HISTORY;
  }
}

/**
 * Save stats history to filesystem
 */
async function saveStatsHistory(history: StatsHistory): Promise<void> {
  // Ensure directory exists
  await fs.mkdir(FIGMA_DATA_DIR, { recursive: true });
  await fs.writeFile(STATS_HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Clean old entries beyond retention period
 */
function cleanOldEntries(history: StatsHistory): StatsHistory {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - history.retentionDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const filteredStats = history.dailyStats.filter(
    (stat) => stat.date >= cutoffStr
  );

  return {
    ...history,
    dailyStats: filteredStats,
  };
}

/**
 * Merge nodesByType records (sum values for matching keys)
 */
function mergeNodesByType(
  existing: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const result = { ...existing };
  for (const [type, count] of Object.entries(incoming)) {
    result[type] = (result[type] || 0) + count;
  }
  return result;
}

/**
 * Record daily stats from a TransformStats object
 * Called after import/refetch to update today's entry
 */
export async function recordDailyStats(
  transformStats: TransformStats | undefined,
  nodesImported: number = 1
): Promise<void> {
  if (!transformStats) return;

  const history = await loadStatsHistory();
  const today = getTodayDate();

  // Find or create today's entry
  const existingIndex = history.dailyStats.findIndex((s) => s.date === today);
  const existing = existingIndex >= 0 ? history.dailyStats[existingIndex] : null;

  const updatedEntry: DailyStats = {
    date: today,
    nodesImported: (existing?.nodesImported || 0) + nodesImported,
    totalNodes: (existing?.totalNodes || 0) + transformStats.totalNodes,
    maxDepth: Math.max(existing?.maxDepth || 0, transformStats.maxDepth),
    nodesByType: mergeNodesByType(
      existing?.nodesByType || {},
      transformStats.nodesByType
    ),
    autoLayoutCount:
      (existing?.autoLayoutCount || 0) + transformStats.autoLayoutCount,
    absolutePositionedCount:
      (existing?.absolutePositionedCount || 0) +
      transformStats.absolutePositionedCount,
    groupsInlined:
      (existing?.groupsInlined || 0) + transformStats.groupsInlined,
    imagesCount: (existing?.imagesCount || 0) + transformStats.imagesCount,
    iconsCount: (existing?.iconsCount || 0) + transformStats.iconsCount,
    gradientsCount:
      (existing?.gradientsCount || 0) + transformStats.gradientsCount,
    semanticCount:
      (existing?.semanticCount || 0) + transformStats.semanticCount,
    arbitraryCount:
      (existing?.arbitraryCount || 0) + transformStats.arbitraryCount,
    variablesUsed:
      (existing?.variablesUsed || 0) + transformStats.variablesUsed,
  };

  // Update or add entry
  let updatedStats: DailyStats[];
  if (existingIndex >= 0) {
    updatedStats = [...history.dailyStats];
    updatedStats[existingIndex] = updatedEntry;
  } else {
    updatedStats = [...history.dailyStats, updatedEntry];
  }

  // Sort by date
  updatedStats.sort((a, b) => a.date.localeCompare(b.date));

  // Clean old entries and save
  const updatedHistory = cleanOldEntries({
    ...history,
    dailyStats: updatedStats,
  });

  await saveStatsHistory(updatedHistory);
}

/**
 * Get the last N days of stats
 * Returns empty array if no data available
 */
export async function getLastNDays(days: number = 7): Promise<DailyStats[]> {
  const history = await loadStatsHistory();

  if (history.dailyStats.length === 0) {
    return [];
  }

  // Get date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Filter to date range
  return history.dailyStats.filter(
    (stat) => stat.date >= startStr && stat.date <= endStr
  );
}

/**
 * Calculate weekly change for a specific metric
 * Returns null if not enough data
 */
export async function calculateWeeklyChange(
  metric: keyof Omit<DailyStats, 'date' | 'nodesByType'>
): Promise<number | null> {
  const lastWeek = await getLastNDays(7);

  if (lastWeek.length < 2) {
    return null;
  }

  const first = lastWeek[0];
  const last = lastWeek[lastWeek.length - 1];

  const firstValue = first[metric] as number;
  const lastValue = last[metric] as number;

  if (firstValue === 0) {
    return lastValue > 0 ? 100 : 0;
  }

  return Math.round(((lastValue - firstValue) / firstValue) * 100);
}

/**
 * Get aggregated totals from all stored stats
 * Useful for dashboard overview
 */
export async function getAggregatedTotals(): Promise<Omit<DailyStats, 'date'>> {
  const history = await loadStatsHistory();

  if (history.dailyStats.length === 0) {
    return EMPTY_DAILY_STATS;
  }

  return history.dailyStats.reduce(
    (acc, stat) => ({
      nodesImported: acc.nodesImported + stat.nodesImported,
      totalNodes: acc.totalNodes + stat.totalNodes,
      maxDepth: Math.max(acc.maxDepth, stat.maxDepth),
      nodesByType: mergeNodesByType(acc.nodesByType, stat.nodesByType),
      autoLayoutCount: acc.autoLayoutCount + stat.autoLayoutCount,
      absolutePositionedCount:
        acc.absolutePositionedCount + stat.absolutePositionedCount,
      groupsInlined: acc.groupsInlined + stat.groupsInlined,
      imagesCount: acc.imagesCount + stat.imagesCount,
      iconsCount: acc.iconsCount + stat.iconsCount,
      gradientsCount: acc.gradientsCount + stat.gradientsCount,
      semanticCount: acc.semanticCount + stat.semanticCount,
      arbitraryCount: acc.arbitraryCount + stat.arbitraryCount,
      variablesUsed: acc.variablesUsed + stat.variablesUsed,
    }),
    { ...EMPTY_DAILY_STATS }
  );
}
