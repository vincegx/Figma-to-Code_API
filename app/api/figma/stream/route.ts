/**
 * Figma Stream API Route (SSE)
 *
 * POST /api/figma/stream
 * Server-Sent Events endpoint for real-time progress during import and refetch operations.
 *
 * Request body:
 * {
 *   "type": "import" | "refetch",
 *   "url": "https://www.figma.com/file/..." (for import)
 *   "nodeId": "123-456" (for refetch)
 * }
 *
 * SSE Events:
 * { "step": "parse", "status": "start" | "complete" | "error", "message"?: string, "data"?: any }
 */

import { NextRequest } from 'next/server';
import { parseFigmaUrl } from '@/lib/utils/url-parser';
import { fetchNode, fetchScreenshot, fetchFileMetadata, fetchWithRetry, fetchSVGBatch, fetchVariables } from '@/lib/figma-client';
import { saveNodeData, saveSvgAssets, saveImageAssets, saveVariables, loadNodeData } from '@/lib/utils/file-storage';
import { addNode, getNode } from '@/lib/utils/library-index';
import { extractSvgContainers, generateSvgFilename, extractImageNodes, downloadFigmaImages } from '@/lib/utils/image-fetcher';
import { transformToAltNode, resetNameCounters } from '@/lib/altnode-transform';
import { extractVariablesFromNode, formatExtractedVariablesForStorage } from '@/lib/utils/variable-extractor';

// Step definitions for import and refetch
const IMPORT_STEPS = ['parse', 'metadata', 'node', 'screenshot', 'variables', 'svg', 'images', 'save'] as const;
const REFETCH_STEPS = ['node', 'screenshot', 'variables', 'svg', 'images', 'save'] as const;

type ImportStep = typeof IMPORT_STEPS[number];
type RefetchStep = typeof REFETCH_STEPS[number];
type StepStatus = 'start' | 'complete' | 'error' | 'skip';

interface SSEMessage {
  step: string;
  status: StepStatus;
  message?: string;
  data?: unknown;
  progress?: { current: number; total: number };
}

function createSSEMessage(msg: SSEMessage): string {
  return `data: ${JSON.stringify(msg)}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json() as {
      type: 'import' | 'refetch';
      url?: string;
      nodeId?: string;
    };

    const { type, url, nodeId } = body;

    // Validate request
    if (type === 'import' && !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing URL for import' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'refetch' && !nodeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing nodeId for refetch' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (msg: SSEMessage) => {
          controller.enqueue(encoder.encode(createSSEMessage(msg)));
        };

        const steps = type === 'import' ? IMPORT_STEPS : REFETCH_STEPS;
        let currentStepIndex = 0;

        const sendProgress = (step: string, status: StepStatus, message?: string, data?: unknown) => {
          send({
            step,
            status,
            message,
            data,
            progress: { current: currentStepIndex + 1, total: steps.length }
          });
          if (status === 'complete' || status === 'skip') {
            currentStepIndex++;
          }
        };

        try {
          if (type === 'import') {
            await handleImport(url!, sendProgress);
          } else {
            await handleRefetch(nodeId!, sendProgress);
          }

          // Send completion
          send({ step: 'done', status: 'complete', message: 'Operation completed successfully' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          send({ step: 'error', status: 'error', message: errorMessage });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

type ProgressCallback = (step: string, status: StepStatus, message?: string, data?: unknown) => void;

async function handleImport(url: string, sendProgress: ProgressCallback) {
  // Step 1: Parse URL
  sendProgress('parse', 'start', 'Parsing Figma URL...');
  let fileKey: string;
  let nodeId: string;
  try {
    const parsed = parseFigmaUrl(url);
    fileKey = parsed.fileKey;
    nodeId = parsed.nodeId;
    sendProgress('parse', 'complete', `Parsed: ${fileKey}/${nodeId}`);
  } catch (error) {
    sendProgress('parse', 'error', error instanceof Error ? error.message : 'Invalid URL');
    throw error;
  }

  // Step 2: File Metadata
  sendProgress('metadata', 'start', 'Fetching file metadata...');
  let fileName: string;
  try {
    const fileMetadata = await fetchWithRetry(() => fetchFileMetadata(fileKey));
    fileName = fileMetadata.name;
    sendProgress('metadata', 'complete', `File: ${fileName}`);
  } catch (error) {
    sendProgress('metadata', 'error', error instanceof Error ? error.message : 'Failed to fetch metadata');
    throw error;
  }

  // Step 3: Node Data
  sendProgress('node', 'start', 'Fetching node data...');
  let nodeData: any;
  try {
    nodeData = await fetchWithRetry(() => fetchNode(fileKey, nodeId));
    sendProgress('node', 'complete', `Node: ${nodeData.name || nodeId}`);
  } catch (error) {
    sendProgress('node', 'error', error instanceof Error ? error.message : 'Failed to fetch node');
    throw error;
  }

  // Step 4: Screenshot
  sendProgress('screenshot', 'start', 'Capturing screenshot...');
  let screenshot: Buffer | null = null;
  try {
    screenshot = await fetchWithRetry(() => fetchScreenshot(fileKey, nodeId));
    sendProgress('screenshot', 'complete', 'Screenshot captured');
  } catch (error) {
    // Screenshot is non-critical, continue with warning
    sendProgress('screenshot', 'skip', 'Screenshot skipped (non-critical)');
  }

  // Step 5: Variables
  sendProgress('variables', 'start', 'Extracting variables...');
  try {
    const variablesData = await fetchVariables(fileKey);
    const extractedVars = extractVariablesFromNode(nodeData);
    if (Object.keys(extractedVars).length > 0) {
      const formattedVars = formatExtractedVariablesForStorage(extractedVars);
      await saveVariables(nodeId, formattedVars);
      sendProgress('variables', 'complete', `${Object.keys(extractedVars).length} variables extracted`);
    } else if (Object.keys(variablesData).length > 0) {
      await saveVariables(nodeId, variablesData);
      sendProgress('variables', 'complete', `${Object.keys(variablesData).length} API variables`);
    } else {
      sendProgress('variables', 'skip', 'No variables found');
    }
  } catch (error) {
    sendProgress('variables', 'skip', 'Variables extraction skipped');
  }

  // Step 6: SVG Assets
  sendProgress('svg', 'start', 'Downloading SVG assets...');
  resetNameCounters();
  const altNode = transformToAltNode(nodeData);
  const svgContainers = altNode ? extractSvgContainers(altNode) : [];
  let svgAssets: Record<string, string> = {};

  if (svgContainers.length > 0) {
    try {
      const containerIds = svgContainers.map(c => c.nodeId);
      const svgContent = await fetchWithRetry(() => fetchSVGBatch(fileKey, containerIds));

      for (const container of svgContainers) {
        if (svgContent[container.nodeId]) {
          const filename = generateSvgFilename(container.name, container.nodeId);
          const assetName = filename.replace('.svg', '');
          svgAssets[assetName] = svgContent[container.nodeId];
        }
      }
      sendProgress('svg', 'complete', `${Object.keys(svgAssets).length} SVGs downloaded`);
    } catch (error) {
      sendProgress('svg', 'skip', 'SVG download skipped');
    }
  } else {
    sendProgress('svg', 'skip', 'No SVG containers found');
  }

  // Step 7: Image Assets
  sendProgress('images', 'start', 'Downloading image assets...');
  const imageNodes = altNode ? extractImageNodes(altNode) : [];

  if (imageNodes.length > 0) {
    try {
      const imageRefs = imageNodes.map(n => n.imageRef);
      const accessToken = process.env.FIGMA_ACCESS_TOKEN || '';
      const imageAssets = await fetchWithRetry(() =>
        downloadFigmaImages(fileKey, imageRefs, nodeId, accessToken)
      );

      if (Object.keys(imageAssets).length > 0) {
        await saveImageAssets(nodeId, imageAssets);
        sendProgress('images', 'complete', `${Object.keys(imageAssets).length} images downloaded`);
      } else {
        sendProgress('images', 'skip', 'No images downloaded');
      }
    } catch (error) {
      sendProgress('images', 'skip', 'Image download skipped');
    }
  } else {
    sendProgress('images', 'skip', 'No image fills found');
  }

  // Step 8: Save & Index
  sendProgress('save', 'start', 'Saving to library...');
  try {
    const libraryNode = await saveNodeData(nodeId, nodeData, fileKey, screenshot ?? Buffer.from(''), fileName);

    if (Object.keys(svgAssets).length > 0) {
      await saveSvgAssets(nodeId, svgAssets);
    }

    await addNode(libraryNode);
    sendProgress('save', 'complete', 'Node saved to library', { nodeId, name: libraryNode.name });
  } catch (error) {
    sendProgress('save', 'error', error instanceof Error ? error.message : 'Failed to save');
    throw error;
  }
}

async function handleRefetch(nodeId: string, sendProgress: ProgressCallback) {
  // Load current metadata
  const currentMetadata = await getNode(nodeId);
  if (!currentMetadata) {
    sendProgress('node', 'error', 'Node not found in library');
    throw new Error('Node not found in library');
  }

  const { fileKey } = currentMetadata.metadata;
  const { figmaNodeId } = currentMetadata;

  // Step 1: Node Data
  sendProgress('node', 'start', 'Fetching node data...');
  let nodeData: any;
  try {
    nodeData = await fetchWithRetry(() => fetchNode(fileKey, figmaNodeId));
    sendProgress('node', 'complete', `Node: ${nodeData.name || figmaNodeId}`);
  } catch (error) {
    sendProgress('node', 'error', error instanceof Error ? error.message : 'Failed to fetch node');
    throw error;
  }

  // Step 2: Screenshot
  sendProgress('screenshot', 'start', 'Capturing screenshot...');
  let screenshot: Buffer | null = null;
  try {
    screenshot = await fetchWithRetry(() => fetchScreenshot(fileKey, figmaNodeId));
    sendProgress('screenshot', 'complete', 'Screenshot captured');
  } catch (error) {
    sendProgress('screenshot', 'skip', 'Screenshot skipped (non-critical)');
  }

  // Step 3: Variables
  sendProgress('variables', 'start', 'Extracting variables...');
  try {
    const variablesData = await fetchVariables(fileKey);
    const extractedVars = extractVariablesFromNode(nodeData);
    if (Object.keys(extractedVars).length > 0) {
      const formattedVars = formatExtractedVariablesForStorage(extractedVars);
      await saveVariables(figmaNodeId, formattedVars);
      sendProgress('variables', 'complete', `${Object.keys(extractedVars).length} variables extracted`);
    } else if (Object.keys(variablesData).length > 0) {
      await saveVariables(figmaNodeId, variablesData);
      sendProgress('variables', 'complete', `${Object.keys(variablesData).length} API variables`);
    } else {
      sendProgress('variables', 'skip', 'No variables found');
    }
  } catch (error) {
    sendProgress('variables', 'skip', 'Variables extraction skipped');
  }

  // Step 4: SVG Assets
  sendProgress('svg', 'start', 'Downloading SVG assets...');
  resetNameCounters();
  const altNode = transformToAltNode(nodeData);
  const svgContainers = altNode ? extractSvgContainers(altNode) : [];
  let svgAssets: Record<string, string> = {};

  if (svgContainers.length > 0) {
    try {
      const containerIds = svgContainers.map(c => c.nodeId);
      const svgContent = await fetchWithRetry(() => fetchSVGBatch(fileKey, containerIds));

      for (const container of svgContainers) {
        if (svgContent[container.nodeId]) {
          const filename = generateSvgFilename(container.name, container.nodeId);
          const assetName = filename.replace('.svg', '');
          svgAssets[assetName] = svgContent[container.nodeId];
        }
      }
      sendProgress('svg', 'complete', `${Object.keys(svgAssets).length} SVGs downloaded`);
    } catch (error) {
      sendProgress('svg', 'skip', 'SVG download skipped');
    }
  } else {
    sendProgress('svg', 'skip', 'No SVG containers found');
  }

  // Step 5: Image Assets
  sendProgress('images', 'start', 'Downloading image assets...');
  const imageNodes = altNode ? extractImageNodes(altNode) : [];

  if (imageNodes.length > 0) {
    try {
      const imageRefs = imageNodes.map(n => n.imageRef);
      const accessToken = process.env.FIGMA_ACCESS_TOKEN || '';
      const imageAssets = await fetchWithRetry(() =>
        downloadFigmaImages(fileKey, imageRefs, figmaNodeId, accessToken)
      );

      if (Object.keys(imageAssets).length > 0) {
        await saveImageAssets(figmaNodeId, imageAssets);
        sendProgress('images', 'complete', `${Object.keys(imageAssets).length} images downloaded`);
      } else {
        sendProgress('images', 'skip', 'No images downloaded');
      }
    } catch (error) {
      sendProgress('images', 'skip', 'Image download skipped');
    }
  } else {
    sendProgress('images', 'skip', 'No image fills found');
  }

  // Step 6: Save & Index
  sendProgress('save', 'start', 'Saving to library...');
  try {
    const updatedMetadata = await saveNodeData(
      figmaNodeId,
      nodeData,
      fileKey,
      screenshot ?? Buffer.from(''),
      currentMetadata.metadata.fileName
    );

    if (Object.keys(svgAssets).length > 0) {
      await saveSvgAssets(figmaNodeId, svgAssets);
    }

    // Preserve existing metadata
    const mergedMetadata = {
      ...updatedMetadata,
      tags: currentMetadata.tags,
      category: currentMetadata.category,
      description: currentMetadata.description,
      usage: currentMetadata.usage,
    };

    await addNode(mergedMetadata);
    sendProgress('save', 'complete', 'Node updated in library', { nodeId: figmaNodeId, name: mergedMetadata.name });
  } catch (error) {
    sendProgress('save', 'error', error instanceof Error ? error.message : 'Failed to save');
    throw error;
  }
}
