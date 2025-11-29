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
import { loadNodeData, loadNodeMetadata, saveNodeData, saveSvgAssets, saveImageAssets, loadVariables, saveVariables } from '@/lib/utils/file-storage';
import { fetchNode, fetchScreenshot, fetchWithRetry, fetchSVGBatch, fetchVariables } from '@/lib/figma-client';
import { transformToAltNode, resetNameCounters } from '@/lib/altnode-transform';
import { extractSvgContainers, generateSvgFilename, extractImageNodes, downloadFigmaImages } from '@/lib/utils/image-fetcher';
import { extractVariablesFromNode, formatExtractedVariablesForStorage } from '@/lib/utils/variable-extractor';
import { setCachedVariablesMap } from '@/lib/utils/variable-css';

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

    // WP31 T224: Load Figma variables for CSS variable resolution (per-node)
    const variables = await loadVariables(metadata.figmaNodeId);

    // WP31: Cache per-node variables for sync access during transform and code generation
    if (Object.keys(variables).length > 0) {
      setCachedVariablesMap({
        variables: variables as Record<string, any>,
        lastUpdated: new Date().toISOString(),
        version: 1
      });
    }

    // Transform to AltNode on-the-fly (Constitutional Principle III: don't persist)
    resetNameCounters(); // Reset for clean unique name generation
    const altNode = transformToAltNode(nodeData, 0, undefined, undefined, variables);

    return NextResponse.json({
      success: true,
      metadata,
      nodeData,
      altNode,
      variables, // WP31 T224: Include variables in response
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

    // WP31 T224: Fetch and save Figma variables at refresh time
    const variablesData = await fetchVariables(fileKey);
    console.log(`📦 Fetched ${Object.keys(variablesData).length > 0 ? 'variables' : 'no variables'} from Figma API`);
    if (Object.keys(variablesData).length > 0) {
      await saveVariables(figmaNodeId, variablesData);
      console.log(`✅ Saved Figma variables to disk`);
    }

    // WP31: Extract boundVariables from node tree and save per-node
    const extractedVars = extractVariablesFromNode(nodeData);
    if (Object.keys(extractedVars).length > 0) {
      const formattedVars = formatExtractedVariablesForStorage(extractedVars);
      await saveVariables(figmaNodeId, formattedVars);
      console.log(`📦 Extracted and saved ${Object.keys(extractedVars).length} variable references for node ${figmaNodeId}`);
    }

    // WP32: Detect and download SVG containers at refresh time
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
          const filename = generateSvgFilename(container.name, container.nodeId);
          const assetName = filename.replace('.svg', '');
          svgAssets[assetName] = svgContent[container.nodeId];
        }
      }
    }

    // Save updated data
    const updatedMetadata = await saveNodeData(
      figmaNodeId,
      nodeData,
      fileKey,
      screenshot,
      currentMetadata.metadata.fileName
    );

    // WP32: Save SVG assets if any
    if (Object.keys(svgAssets).length > 0) {
      await saveSvgAssets(figmaNodeId, svgAssets);
      console.log(`✅ Saved ${Object.keys(svgAssets).length} SVG assets to disk`);
    }

    // WP32: Detect and download PNG/JPG images at refresh time
    const imageNodes = altNode ? extractImageNodes(altNode) : [];
    if (imageNodes.length > 0) {
      console.log(`🖼️ Found ${imageNodes.length} image fills to download`);
      const imageRefs = imageNodes.map(n => n.imageRef);
      const accessToken = process.env.FIGMA_ACCESS_TOKEN || '';

      const imageAssets = await fetchWithRetry(() =>
        downloadFigmaImages(fileKey, imageRefs, figmaNodeId, accessToken)
      );

      if (Object.keys(imageAssets).length > 0) {
        await saveImageAssets(figmaNodeId, imageAssets);
        console.log(`✅ Saved ${Object.keys(imageAssets).length} image assets to disk`);
      }
    }

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
