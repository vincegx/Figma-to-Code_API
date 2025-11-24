/**
 * Figma Node API Route
 *
 * GET /api/figma/node/[id]
 * Get a specific node's data and metadata
 *
 * POST /api/figma/node/[id]/refresh
 * Re-fetch and update a specific node's data from Figma API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNode, addNode } from '@/lib/utils/library-index';
import { loadNodeData, loadNodeMetadata, saveNodeData } from '@/lib/utils/file-storage';
import { fetchNode, fetchScreenshot, fetchWithRetry } from '@/lib/figma-client';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/figma/node/[id]
 * Retrieve node data and metadata from local storage
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing node ID' },
        { status: 400 }
      );
    }

    // Load metadata from library index
    const metadata = await getNode(id);
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    // Load full node data from filesystem
    const nodeData = await loadNodeData(metadata.figmaNodeId);
    if (!nodeData) {
      return NextResponse.json(
        { success: false, error: 'Node data file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata,
      nodeData,
    });
  } catch (error) {
    console.error('Node fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load node'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/figma/node/[id]
 * Refresh node data from Figma API (re-fetch and update cache)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing node ID' },
        { status: 400 }
      );
    }

    // Load current metadata
    const currentMetadata = await getNode(id);
    if (!currentMetadata) {
      return NextResponse.json(
        { success: false, error: 'Node not found in library' },
        { status: 404 }
      );
    }

    const { fileKey } = currentMetadata.metadata;
    const { figmaNodeId } = currentMetadata;

    // Re-fetch node data from Figma API
    const nodeData = await fetchWithRetry(() => fetchNode(fileKey, figmaNodeId));

    // Re-fetch screenshot
    const screenshot = await fetchWithRetry(() => fetchScreenshot(fileKey, figmaNodeId));

    // Save updated data
    const updatedMetadata = await saveNodeData(
      figmaNodeId,
      nodeData,
      fileKey,
      screenshot,
      currentMetadata.metadata.fileName
    );

    // Preserve existing metadata (tags, category, usage stats)
    const mergedMetadata = {
      ...updatedMetadata,
      tags: currentMetadata.tags,
      category: currentMetadata.category,
      description: currentMetadata.description,
      usage: currentMetadata.usage,
    };

    // Update library index
    await addNode(mergedMetadata);

    return NextResponse.json({
      success: true,
      metadata: mergedMetadata,
      updated: true,
    });
  } catch (error) {
    console.error('Node refresh error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to refresh node';

    // Determine appropriate status code
    let status = 500;
    if (errorMessage.includes('not found')) {
      status = 404;
    } else if (errorMessage.includes('rate limit')) {
      status = 429;
    } else if (errorMessage.includes('access token')) {
      status = 401;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

/**
 * PATCH /api/figma/node/[id]
 * Update node metadata (tags, category, description)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing node ID' },
        { status: 400 }
      );
    }

    const body = await request.json() as {
      tags?: string[];
      category?: string;
      description?: string;
    };

    // Load current metadata
    const currentMetadata = await getNode(id);
    if (!currentMetadata) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    // Merge updates
    const updatedMetadata = {
      ...currentMetadata,
      tags: body.tags ?? currentMetadata.tags,
      category: body.category ?? currentMetadata.category,
      description: body.description ?? currentMetadata.description,
      lastModified: new Date().toISOString(),
    };

    // Update library index
    await addNode(updatedMetadata);

    return NextResponse.json({
      success: true,
      metadata: updatedMetadata,
    });
  } catch (error) {
    console.error('Node update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update node'
      },
      { status: 500 }
    );
  }
}
