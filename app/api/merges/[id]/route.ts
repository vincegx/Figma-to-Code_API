/**
 * Single Merge API Route
 *
 * GET /api/merges/[id]
 * Returns a single merge by ID.
 *
 * DELETE /api/merges/[id]
 * Deletes a merge by ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMerge, deleteMerge } from '@/lib/store/merge-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const merge = await getMerge(id);

    if (!merge) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, merge });
  } catch (error) {
    console.error('Merge fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch merge',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deleteMerge(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    // Return 204 No Content for successful deletion
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Merge delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete merge',
      },
      { status: 500 }
    );
  }
}
