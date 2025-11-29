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
import { fetchNode, fetchScreenshot, fetchFileMetadata, fetchWithRetry, fetchSVGBatch, fetchVariables } from '@/lib/figma-client';
import { saveNodeData, saveSvgAssets, saveImageAssets, saveVariables } from '@/lib/utils/file-storage';
import { addNode } from '@/lib/utils/library-index';
import { extractSvgContainers, generateSvgFilename, extractImageNodes, downloadFigmaImages } from '@/lib/utils/image-fetcher';
import { transformToAltNode, resetNameCounters } from '@/lib/altnode-transform';
import { extractVariablesFromNode, formatExtractedVariablesForStorage } from '@/lib/utils/variable-extractor';

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

    // WP31 T224: Fetch Figma variables for CSS variable resolution (Enterprise only)
    const variablesData = await fetchVariables(fileKey);
    console.log(`📦 Fetched ${Object.keys(variablesData).length > 0 ? 'variables' : 'no variables'} from Figma API`);

    // WP31: Extract boundVariables from node tree and save per-node
    const extractedVars = extractVariablesFromNode(nodeData);
    if (Object.keys(extractedVars).length > 0) {
      const formattedVars = formatExtractedVariablesForStorage(extractedVars);
      await saveVariables(nodeId, formattedVars);
      console.log(`📦 Extracted and saved ${Object.keys(extractedVars).length} variable references for node ${nodeId}`);
    }

    // WP32: Detect and download SVG containers at import time
    // This ensures SVGs are available locally without API calls during viewing
    resetNameCounters();
    const altNode = transformToAltNode(nodeData);
    const svgContainers = altNode ? extractSvgContainers(altNode) : [];

    let svgAssets: Record<string, string> = {};
    if (svgContainers.length > 0) {
      console.log(`📦 Found ${svgContainers.length} SVG containers to download`);
      const containerIds = svgContainers.map(c => c.nodeId);

      // Fetch all SVG containers from Figma API
      const svgContent = await fetchWithRetry(() => fetchSVGBatch(fileKey, containerIds));

      // Map nodeId to unique filename for storage
      for (const container of svgContainers) {
        if (svgContent[container.nodeId]) {
          // Use name + nodeId for unique filename (avoids collision when same name)
          const filename = generateSvgFilename(container.name, container.nodeId);
          // Remove .svg extension for asset key (saveSvgAssets adds it back)
          const assetName = filename.replace('.svg', '');
          svgAssets[assetName] = svgContent[container.nodeId];
        }
      }
    }

    // Save to filesystem
    const libraryNode = await saveNodeData(
      nodeId,
      nodeData,
      fileKey,
      screenshot,
      fileMetadata.name
    );

    // WP32: Save SVG assets if any
    if (Object.keys(svgAssets).length > 0) {
      await saveSvgAssets(nodeId, svgAssets);
      console.log(`✅ Saved ${Object.keys(svgAssets).length} SVG assets to disk`);
    }

    // WP31 T224: Save Figma variables for CSS variable resolution
    if (Object.keys(variablesData).length > 0) {
      await saveVariables(nodeId, variablesData);
      console.log(`✅ Saved Figma variables to disk`);
    }

    // WP32: Detect and download PNG/JPG images at import time
    const imageNodes = altNode ? extractImageNodes(altNode) : [];
    if (imageNodes.length > 0) {
      console.log(`🖼️ Found ${imageNodes.length} image fills to download`);
      const imageRefs = imageNodes.map(n => n.imageRef);
      const accessToken = process.env.FIGMA_ACCESS_TOKEN || '';

      const imageAssets = await fetchWithRetry(() =>
        downloadFigmaImages(fileKey, imageRefs, nodeId, accessToken)
      );

      if (Object.keys(imageAssets).length > 0) {
        await saveImageAssets(nodeId, imageAssets);
        console.log(`✅ Saved ${Object.keys(imageAssets).length} image assets to disk`);
      }
    }

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
