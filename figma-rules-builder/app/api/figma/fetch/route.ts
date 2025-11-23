/**
 * Figma Fetch API Route
 *
 * POST /api/figma/fetch
 * Fetches a Figma node and caches it locally
 *
 * Constitutional Principle III: Data Locality
 * - Fetches once from Figma API
 * - Caches to filesystem (figma-data/)
 * - Subsequent requests load from cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNode, fetchVariables, fetchScreenshot, parseFigmaUrl } from '@/lib/figma-client';
import {
  saveFigmaNode,
  loadFigmaNode,
  saveFigmaVariables,
  saveScreenshot,
} from '@/lib/utils/file-storage';

/**
 * Request body schema
 */
interface FetchRequest {
  /** Figma URL or file key */
  url?: string;
  fileKey?: string;
  /** Node ID (required if using fileKey) */
  nodeId?: string;
  /** Whether to fetch variables */
  includeVariables?: boolean;
  /** Whether to fetch screenshot */
  includeScreenshot?: boolean;
  /** Force refresh (ignore cache) */
  forceRefresh?: boolean;
}

/**
 * Response schema
 */
interface FetchResponse {
  success: boolean;
  nodeId: string;
  fileKey: string;
  cached: boolean;
  cachedAt?: string;
  error?: string;
}

/**
 * POST handler - Fetch and cache Figma node
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: FetchRequest = await request.json();

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

    // Check if already cached (unless force refresh)
    if (!body.forceRefresh) {
      const cached = await loadFigmaNode(nodeId);
      if (cached) {
        return NextResponse.json<FetchResponse>({
          success: true,
          nodeId,
          fileKey,
          cached: true,
          cachedAt: cached.cachedAt,
        });
      }
    }

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

    // Fetch from Figma API
    try {
      const document = await fetchNode(fileKey, nodeId, { accessToken });

      // Save to cache
      const now = new Date().toISOString();
      await saveFigmaNode(nodeId, fileKey, document, now);

      // Fetch variables if requested
      if (body.includeVariables) {
        try {
          const variablesData = await fetchVariables(fileKey, { accessToken });
          await saveFigmaVariables(
            fileKey,
            variablesData.meta.variables,
            variablesData.meta.variableCollections
          );
        } catch (error) {
          // Variables fetch failed, but continue (not critical)
          console.warn('Failed to fetch variables:', error);
        }
      }

      // Fetch screenshot if requested
      if (body.includeScreenshot) {
        try {
          const screenshotUrl = await fetchScreenshot(fileKey, nodeId, {
            accessToken,
          });
          await saveScreenshot(nodeId, screenshotUrl);
        } catch (error) {
          // Screenshot fetch failed, but continue (not critical)
          console.warn('Failed to fetch screenshot:', error);
        }
      }

      return NextResponse.json<FetchResponse>({
        success: true,
        nodeId,
        fileKey,
        cached: false,
        cachedAt: now,
      });
    } catch (error) {
      // Figma API error
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch from Figma API';

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
 * GET handler - Check cache status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

  const cached = await loadFigmaNode(nodeId);

  if (cached) {
    return NextResponse.json({
      success: true,
      nodeId,
      fileKey: cached.fileKey,
      cached: true,
      cachedAt: cached.cachedAt,
      lastModified: cached.lastModified,
    });
  }

  return NextResponse.json({
    success: true,
    nodeId,
    cached: false,
  });
}
