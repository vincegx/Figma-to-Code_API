/**
 * Merge Split Detection API Route
 *
 * GET /api/merges/[id]/split/detect
 *
 * Returns detected component candidates for a merge's unified tree.
 * Uses the Smart Detection algorithm to identify potential
 * component boundaries in the responsive merged structure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMerge } from '@/lib/store/merge-store';
import { detectComponentsUnified } from '@/lib/split';
import type { DetectedComponent } from '@/lib/types/split';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing merge ID' },
        { status: 400 }
      );
    }

    // Load the merge
    const merge = await getMerge(id);
    if (!merge) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    // Check merge status
    if (merge.status !== 'ready' || !merge.result) {
      return NextResponse.json(
        { success: false, error: 'Merge not ready' },
        { status: 400 }
      );
    }

    // Run detection algorithm on unified tree
    const detectedComponents: DetectedComponent[] = detectComponentsUnified(
      merge.result.unifiedTree
    );

    return NextResponse.json({
      success: true,
      components: detectedComponents,
      totalCount: detectedComponents.length,
    });

  } catch (error) {
    console.error('[Merge Split Detection] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Detection failed', details: String(error) },
      { status: 500 }
    );
  }
}
