/**
 * API Route: /api/quota (WP41 T356)
 *
 * GET: Retrieve quota statistics
 * POST: Record an API call
 */

import { NextResponse } from 'next/server';
import {
  getQuotaStats,
  trackApiCall,
  type ApiTier,
  type Endpoint,
} from '@/lib/api-quota-tracker';

/**
 * GET /api/quota
 * Returns current quota statistics
 */
export async function GET() {
  try {
    const stats = await getQuotaStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get quota stats:', error);
    return NextResponse.json(
      { error: 'Failed to get quota stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quota
 * Records an API call
 *
 * Body: { tier: 'tier1' | 'tier2', endpoint: Endpoint }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, endpoint } = body as { tier: ApiTier; endpoint: Endpoint };

    // Validate input
    if (!tier || !['tier1', 'tier2'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "tier1" or "tier2"' },
        { status: 400 }
      );
    }

    const validEndpoints = ['fetchScreenshot', 'fetchSVGBatch', 'fetchNode', 'fetchFileMetadata'];
    if (!endpoint || !validEndpoints.includes(endpoint)) {
      return NextResponse.json(
        { error: `Invalid endpoint. Must be one of: ${validEndpoints.join(', ')}` },
        { status: 400 }
      );
    }

    await trackApiCall(tier, endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track API call:', error);
    return NextResponse.json(
      { error: 'Failed to track API call' },
      { status: 500 }
    );
  }
}
