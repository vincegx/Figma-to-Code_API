/**
 * Figma Node Versions API Route
 *
 * WP40 T344: GET /api/figma/node/[id]/versions
 * Returns version history for a specific Figma node.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readVersionsFile } from '@/lib/utils/file-storage';
import { listVersions, getCurrentVersion } from '@/lib/utils/history-manager';
import type { VersionsResponse } from '@/lib/types/versioning';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/figma/node/[id]/versions
 * Returns current version and history for a node
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const { id: nodeId } = await context.params;

    if (!nodeId) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 }
      );
    }

    // Decode the node ID (URL encoded) and remove lib- prefix if present
    let decodedNodeId = decodeURIComponent(nodeId);
    if (decodedNodeId.startsWith('lib-')) {
      decodedNodeId = decodedNodeId.slice(4); // Remove 'lib-' prefix
    }

    // Get versions file
    const versions = await readVersionsFile(decodedNodeId);

    if (!versions) {
      return NextResponse.json(
        { error: 'No version history found for this node' },
        { status: 404 }
      );
    }

    // Get current and history
    const current = await getCurrentVersion(decodedNodeId);
    const history = await listVersions(decodedNodeId);

    const response: VersionsResponse = {
      nodeId: decodedNodeId,
      current: current || {
        figmaLastModified: '',
        fetchedAt: '',
      },
      history,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}
