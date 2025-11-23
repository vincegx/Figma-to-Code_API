/**
 * Figma Refresh API Route
 *
 * POST /api/figma/refresh
 * Invalidates cache and re-fetches from Figma API
 *
 * Constitutional Principle III: Data Locality
 * - Explicit refresh command required
 * - No automatic re-fetching
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNode, parseFigmaUrl } from '@/lib/figma-client';
import {
  saveFigmaNode,
  deleteCachedNode,
  loadFigmaNode,
} from '@/lib/utils/file-storage';

/**
 * Request body schema
 */
interface RefreshRequest {
  /** Figma URL or file key */
  url?: string;
  fileKey?: string;
  /** Node ID (required if using fileKey) */
  nodeId?: string;
}

/**
 * Response schema
 */
interface RefreshResponse {
  success: boolean;
  nodeId: string;
  fileKey: string;
  refreshed: boolean;
  previousCachedAt?: string;
  newCachedAt?: string;
  error?: string;
}

/**
 * POST handler - Invalidate cache and re-fetch
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RefreshRequest = await request.json();

    // Validate request
    let fileKey: string;
    let nodeId: string;

    if (body.url) {
      // Parse Figma URL
      try {
        const parsed = parseFigmaUrl(body.url);
        fileKey = parsed.fileKey;
        nodeId = parsed.nodeId;
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid Figma URL',
          },
          { status: 400 }
        );
      }
    } else if (body.fileKey && body.nodeId) {
      fileKey = body.fileKey;
      nodeId = body.nodeId;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either url or (fileKey + nodeId) is required',
        },
        { status: 400 }
      );
    }

    // Get previous cache timestamp (if exists)
    const previousCache = await loadFigmaNode(nodeId);
    const previousCachedAt = previousCache?.cachedAt;

    // Validate access token
    const accessToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'FIGMA_ACCESS_TOKEN not configured. Add it to .env.local',
        },
        { status: 500 }
      );
    }

    try {
      // Delete existing cache
      await deleteCachedNode(nodeId);

      // Fetch fresh data from Figma API
      const document = await fetchNode(fileKey, nodeId, { accessToken });

      // Save to cache with new timestamp
      const now = new Date().toISOString();
      await saveFigmaNode(nodeId, fileKey, document, now);

      const response: RefreshResponse = {
        success: true,
        nodeId,
        fileKey,
        refreshed: true,
        newCachedAt: now,
      };

      if (previousCachedAt !== undefined) {
        response.previousCachedAt = previousCachedAt;
      }

      return NextResponse.json(response);
    } catch (error) {
      // Figma API error
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh from Figma API';

      // Check for common error types
      if (errorMessage.includes('401')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid Figma access token. Check FIGMA_ACCESS_TOKEN in .env.local',
          },
          { status: 401 }
        );
      }

      if (errorMessage.includes('404')) {
        return NextResponse.json(
          {
            success: false,
            error: `Node ${nodeId} not found in file ${fileKey}. Check the URL.`,
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes('429')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Figma API rate limit exceeded. Please try again in a few minutes.',
          },
          { status: 429 }
        );
      }

      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request to Figma API timed out. Check your network connection.',
          },
          { status: 504 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Request parsing error
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
      },
      { status: 400 }
    );
  }
}

/**
 * DELETE handler - Clear cache for a node
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const nodeId = searchParams.get('nodeId');

  if (!nodeId) {
    return NextResponse.json(
      {
        success: false,
        error: 'nodeId parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    await deleteCachedNode(nodeId);

    return NextResponse.json({
      success: true,
      nodeId,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
      },
      { status: 500 }
    );
  }
}
