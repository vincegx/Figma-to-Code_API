/**
 * Split Detection API Route
 *
 * GET /api/split/detect/[nodeId]
 *
 * Returns detected component candidates for a given node.
 * Uses the Smart Detection algorithm to identify potential
 * component boundaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNode } from '@/lib/utils/library-index';
import { loadNodeData } from '@/lib/utils/file-storage';
import { detectComponents } from '@/lib/split';
import type { DetectedComponent } from '@/lib/types/split';
import type { FigmaNode } from '@/lib/types/figma';

interface RouteParams {
  params: {
    nodeId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { nodeId } = params;

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing node ID' },
        { status: 400 }
      );
    }

    // Load metadata from library index
    const metadata = await getNode(nodeId);
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: 'Node not found in library' },
        { status: 404 }
      );
    }

    // Load full node data
    const nodeData = await loadNodeData(metadata.figmaNodeId) as FigmaNode | null;
    if (!nodeData) {
      return NextResponse.json(
        { success: false, error: 'Node data file not found' },
        { status: 404 }
      );
    }

    // Run detection algorithm
    const detectedComponents: DetectedComponent[] = detectComponents(nodeData);

    return NextResponse.json({
      success: true,
      components: detectedComponents,
      totalCount: detectedComponents.length,
    });

  } catch (error) {
    console.error('[Split Detection] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Detection failed', details: String(error) },
      { status: 500 }
    );
  }
}
