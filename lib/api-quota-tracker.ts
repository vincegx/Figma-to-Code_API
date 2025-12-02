/**
 * API Quota Tracker (WP41 T353)
 *
 * Tracks Figma API calls by tier with 7-day data retention.
 * Stores data in figma-data/api-quota.json.
 *
 * Figma Rate Limits (Pro account):
 * - Tier 1 (15/min): GET /images (fetchScreenshot, fetchSVGBatch)
 * - Tier 2 (50/min): GET /files, GET /nodes (fetchNode, fetchFileMetadata)
 */

import fs from 'fs/promises';
import path from 'path';

const QUOTA_FILE = path.join(process.cwd(), 'figma-data', 'api-quota.json');
const RETENTION_DAYS = 7;

export type ApiTier = 'tier1' | 'tier2';
export type Endpoint = 'fetchScreenshot' | 'fetchSVGBatch' | 'fetchNode' | 'fetchFileMetadata';

export interface ApiCall {
  ts: number; // Unix timestamp (milliseconds)
  endpoint: Endpoint;
}

export interface DailyUsage {
  tier1: ApiCall[];
  tier2: ApiCall[];
}

export interface QuotaData {
  [date: string]: DailyUsage; // "2025-12-01": { tier1: [...], tier2: [...] }
}

export interface QuotaStats {
  /** Calls in the last 60 seconds */
  tier1LastMinute: number;
  tier2LastMinute: number;
  /** Today's totals */
  todayTotal: { tier1: number; tier2: number };
  /** Weekly data for chart */
  weeklyData: { date: string; tier1: number; tier2: number }[];
  /** Endpoint breakdown (today) */
  endpointBreakdown: Record<Endpoint, number>;
  /** Computed stats */
  criticalPercent: number; // max(tier1/15, tier2/50) * 100
  status: 'ok' | 'warning' | 'critical';
}

/**
 * Map endpoints to their API tier
 */
const ENDPOINT_TIER: Record<Endpoint, ApiTier> = {
  fetchScreenshot: 'tier1',
  fetchSVGBatch: 'tier1',
  fetchNode: 'tier2',
  fetchFileMetadata: 'tier2',
};

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Clean data older than RETENTION_DAYS
 */
function cleanOldData(data: QuotaData): QuotaData {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffKey = cutoff.toISOString().split('T')[0];

  const cleaned: QuotaData = {};
  for (const [date, usage] of Object.entries(data)) {
    if (date >= cutoffKey) {
      cleaned[date] = usage;
    }
  }
  return cleaned;
}

/**
 * Ensure figma-data directory exists
 */
async function ensureDir(): Promise<void> {
  const dir = path.dirname(QUOTA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Load quota data from JSON file
 */
export async function loadQuotaData(): Promise<QuotaData> {
  try {
    const content = await fs.readFile(QUOTA_FILE, 'utf-8');
    const data = JSON.parse(content) as QuotaData;
    return cleanOldData(data);
  } catch {
    // File doesn't exist or is invalid - return empty
    return {};
  }
}

/**
 * Save quota data to JSON file
 */
async function saveQuotaData(data: QuotaData): Promise<void> {
  await ensureDir();
  const cleaned = cleanOldData(data);
  await fs.writeFile(QUOTA_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
}

/**
 * Track an API call
 */
export async function trackApiCall(tier: ApiTier, endpoint: Endpoint): Promise<void> {
  const data = await loadQuotaData();
  const today = getTodayKey();

  // Initialize today's data if needed
  if (!data[today]) {
    data[today] = { tier1: [], tier2: [] };
  }

  // Add the call
  data[today][tier].push({
    ts: Date.now(),
    endpoint,
  });

  await saveQuotaData(data);
}

/**
 * Track API call by endpoint name (convenience wrapper)
 */
export async function trackApiCallByEndpoint(endpoint: Endpoint): Promise<void> {
  const tier = ENDPOINT_TIER[endpoint];
  await trackApiCall(tier, endpoint);
}

/**
 * Get quota statistics for display
 */
export async function getQuotaStats(): Promise<QuotaStats> {
  const data = await loadQuotaData();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const today = getTodayKey();

  // Initialize defaults
  const todayData = data[today] || { tier1: [], tier2: [] };

  // Count calls in last 60 seconds
  const tier1LastMinute = todayData.tier1.filter((c) => c.ts >= oneMinuteAgo).length;
  const tier2LastMinute = todayData.tier2.filter((c) => c.ts >= oneMinuteAgo).length;

  // Today's totals
  const todayTotal = {
    tier1: todayData.tier1.length,
    tier2: todayData.tier2.length,
  };

  // Build weekly data (last 7 days)
  const weeklyData: { date: string; tier1: number; tier2: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayData = data[dateKey] || { tier1: [], tier2: [] };
    weeklyData.push({
      date: dateKey,
      tier1: dayData.tier1.length,
      tier2: dayData.tier2.length,
    });
  }

  // Endpoint breakdown (today only)
  const endpointBreakdown: Record<Endpoint, number> = {
    fetchScreenshot: 0,
    fetchSVGBatch: 0,
    fetchNode: 0,
    fetchFileMetadata: 0,
  };

  for (const call of [...todayData.tier1, ...todayData.tier2]) {
    endpointBreakdown[call.endpoint]++;
  }

  // Calculate critical percentage (max of tier percentages)
  const tier1Percent = (tier1LastMinute / 15) * 100;
  const tier2Percent = (tier2LastMinute / 50) * 100;
  const criticalPercent = Math.round(Math.max(tier1Percent, tier2Percent));

  // Determine status
  let status: QuotaStats['status'] = 'ok';
  if (criticalPercent >= 80) {
    status = 'critical';
  } else if (criticalPercent >= 60) {
    status = 'warning';
  }

  return {
    tier1LastMinute,
    tier2LastMinute,
    todayTotal,
    weeklyData,
    endpointBreakdown,
    criticalPercent,
    status,
  };
}
