/**
 * Figma Node Version Data API Route
 *
 * WP40 T345: GET /api/figma/node/[id]/version/[folder]
 * Returns data from a specific historical version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadVersion, versionExists, getHistoryScreenshotUrl } from '@/lib/utils/history-manager';
import { transformToAltNode, resetNameCounters } from '@/lib/altnode-transform';
import type { VersionDataResponse } from '@/lib/types/versioning';

interface RouteParams {
  params: Promise<{ id: string; folder: string }>;
}

/**
 * GET /api/figma/node/[id]/version/[folder]
 * Returns data from a specific historical version
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const { id: nodeId, folder } = await context.params;

    if (!nodeId || !folder) {
      return NextResponse.json(
        { error: 'Node ID and folder are required' },
        { status: 400 }
      );
    }

    // Decode the node ID (URL encoded) and remove lib- prefix if present
    let decodedNodeId = decodeURIComponent(nodeId);
    if (decodedNodeId.startsWith('lib-')) {
      decodedNodeId = decodedNodeId.slice(4); // Remove 'lib-' prefix
    }
    const decodedFolder = decodeURIComponent(folder);

    // Check if version exists
    const exists = await versionExists(decodedNodeId, decodedFolder);
    if (!exists) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Load version data
    const versionData = await loadVersion(decodedNodeId, decodedFolder);

    if (!versionData.data) {
      return NextResponse.json(
        { error: 'Version data is corrupted or missing' },
        { status: 500 }
      );
    }

    // Transform to AltNode for preview
    resetNameCounters();
    const altNode = transformToAltNode(versionData.data);

    const response: VersionDataResponse = {
      folder: decodedFolder,
      data: versionData.data,
      metadata: versionData.metadata,
      variables: versionData.variables,
      screenshotUrl: getHistoryScreenshotUrl(decodedNodeId, decodedFolder),
    };

    // Add altNode for viewer compatibility
    return NextResponse.json({
      ...response,
      altNode,
    });
  } catch (error) {
    console.error('Error loading version:', error);
    return NextResponse.json(
      { error: 'Failed to load version data' },
      { status: 500 }
    );
  }
}
