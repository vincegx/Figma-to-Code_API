/**
 * Merges API Route
 *
 * GET /api/merges
 * Returns all merges with optional filtering and sorting.
 *
 * Query parameters:
 * - search: Search query string (optional)
 * - status: Filter by MergeStatus (optional)
 * - sort: Sort criteria (name|createdAt|updatedAt) (optional, default: updatedAt)
 * - order: Sort order (asc|desc) (optional, default: desc)
 *
 * POST /api/merges
 * Create a new merge from 3 source nodes.
 *
 * Request body:
 * {
 *   "name": "Hero Section Responsive",
 *   "sourceNodes": [
 *     { "breakpoint": "mobile", "nodeId": "lib-123" },
 *     { "breakpoint": "tablet", "nodeId": "lib-124" },
 *     { "breakpoint": "desktop", "nodeId": "lib-125" }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { listMerges } from '@/lib/store/merge-store';
import { createMerge } from '@/lib/merge/merge-engine';
import type { MergeStatus, CreateMergeRequest, ListMergesOptions, Breakpoint } from '@/lib/types/merge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const options: ListMergesOptions = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as MergeStatus) || undefined,
      sort: (searchParams.get('sort') as 'name' | 'createdAt' | 'updatedAt') || 'updatedAt',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    };

    // Fetch merges
    const merges = await listMerges(options);

    return NextResponse.json({
      success: true,
      merges,
      total: merges.length,
    });
  } catch (error) {
    console.error('Merges list error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list merges',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateMergeRequest;

    // Validate name
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (body.name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate source nodes
    if (!body.sourceNodes || body.sourceNodes.length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Exactly 3 source nodes required' },
        { status: 400 }
      );
    }

    // Validate unique breakpoints
    const breakpoints = new Set(body.sourceNodes.map((n) => n.breakpoint));
    if (breakpoints.size !== 3) {
      return NextResponse.json(
        { success: false, error: 'Each breakpoint (mobile, tablet, desktop) must be unique' },
        { status: 400 }
      );
    }

    // Validate required breakpoints
    const requiredBreakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop'];
    for (const bp of requiredBreakpoints) {
      if (!breakpoints.has(bp)) {
        return NextResponse.json(
          { success: false, error: `Missing ${bp} breakpoint` },
          { status: 400 }
        );
      }
    }

    // Validate node IDs
    for (const node of body.sourceNodes) {
      if (!node.nodeId || node.nodeId.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: `Missing node ID for ${node.breakpoint} breakpoint` },
          { status: 400 }
        );
      }
    }

    // Create the merge
    const merge = await createMerge(body);

    return NextResponse.json(
      { success: true, merge },
      { status: 201 }
    );
  } catch (error) {
    console.error('Merge creation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create merge',
      },
      { status: 500 }
    );
  }
}
