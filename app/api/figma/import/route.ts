/**
 * Figma Import API Route
 *
 * POST /api/figma/import
 * Imports a Figma node by URL, fetches data and screenshot, saves to filesystem.
 *
 * Request body:
 * {
 *   "url": "https://www.figma.com/file/{fileKey}/...?node-id={nodeId}"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "nodeId": "123:456",
 *   "metadata": { LibraryNode }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseFigmaUrl } from '@/lib/utils/url-parser';
import { fetchNode, fetchScreenshot, fetchFileMetadata, fetchWithRetry } from '@/lib/figma-client';
import { saveNodeData } from '@/lib/utils/file-storage';
import { addNode } from '@/lib/utils/library-index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: string };
    const { url } = body;

    // Validate request
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid URL parameter' },
        { status: 400 }
      );
    }

    // Parse Figma URL
    let fileKey: string;
    let nodeId: string;
    try {
      const parsed = parseFigmaUrl(url);
      fileKey = parsed.fileKey;
      nodeId = parsed.nodeId;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid Figma URL'
        },
        { status: 400 }
      );
    }

    // Fetch file metadata for file name
    const fileMetadata = await fetchWithRetry(() => fetchFileMetadata(fileKey));

    // Fetch node data with retry
    const nodeData = await fetchWithRetry(() => fetchNode(fileKey, nodeId));

    // Fetch screenshot with retry
    const screenshot = await fetchWithRetry(() => fetchScreenshot(fileKey, nodeId));

    // Save to filesystem
    const libraryNode = await saveNodeData(
      nodeId,
      nodeData,
      fileKey,
      screenshot,
      fileMetadata.name
    );

    // Update library index
    await addNode(libraryNode);

    return NextResponse.json({
      success: true,
      nodeId,
      metadata: libraryNode,
    });
  } catch (error) {
    console.error('Import error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Determine appropriate status code
    let status = 500;
    if (errorMessage.includes('Invalid') || errorMessage.includes('Missing')) {
      status = 400;
    } else if (errorMessage.includes('not found')) {
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
