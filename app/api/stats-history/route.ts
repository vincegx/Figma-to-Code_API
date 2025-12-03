/**
 * Stats History API Route (WP44)
 *
 * GET /api/stats-history
 * Returns the full stats history for dashboard display.
 *
 * Query params:
 * - days: number (optional) - Number of days to return (default: 90)
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadStatsHistory, getLastNDays, getAggregatedTotals } from '@/lib/stats-history-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : undefined;

    if (days !== undefined && days > 0) {
      // Return only last N days
      const dailyStats = await getLastNDays(days);
      const totals = await getAggregatedTotals();

      return NextResponse.json({
        success: true,
        dailyStats,
        totals,
        daysRequested: days,
      });
    }

    // Return full history
    const history = await loadStatsHistory();
    const totals = await getAggregatedTotals();

    return NextResponse.json({
      success: true,
      ...history,
      totals,
    });
  } catch (error) {
    console.error('Stats history fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load stats history',
      },
      { status: 500 }
    );
  }
}
