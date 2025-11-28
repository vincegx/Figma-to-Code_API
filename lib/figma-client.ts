/**
 * Figma REST API Client
 *
 * Implements Figma REST API v1 integration for fetching nodes, variables, and screenshots.
 * Server-side only - uses FIGMA_ACCESS_TOKEN from environment variables.
 *
 * @see https://www.figma.com/developers/api
 */

import type { FigmaNode, FigmaNodeResponse } from './types/figma';

/**
 * Fetch a specific node from a Figma file
 *
 * @param fileKey - Figma file key from URL
 * @param nodeId - Node ID (format: "123:456")
 * @returns The FigmaNode data
 * @throws Error if token missing, API error, or node not found
 */
export async function fetchNode(
  fileKey: string,
  nodeId: string
): Promise<FigmaNode> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN not set in .env.local');
  }

  // WP32: Add geometry=paths to get fillGeometry/strokeGeometry for VECTOR nodes
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}&geometry=paths`;
  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Figma access token. Check Settings.');
    }
    if (response.status === 429) {
      throw new Error('Figma API rate limit exceeded. Try again in 1 minute.');
    }
    if (response.status === 404) {
      throw new Error(`File or node not found: ${fileKey}/${nodeId}`);
    }
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as FigmaNodeResponse;
  const nodeData = data.nodes?.[nodeId]?.document;
  if (!nodeData) {
    throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
  }

  return nodeData as FigmaNode;
}

/**
 * Fetch local variables from a Figma file
 *
 * @param fileKey - Figma file key from URL
 * @returns Variables object (empty if not found or API error)
 */
export async function fetchVariables(fileKey: string): Promise<Record<string, unknown>> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return {}; // Variables are optional
  }

  const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`;

  try {
    const response = await fetch(url, {
      headers: { 'X-Figma-Token': token },
    });

    if (!response.ok) {
      return {}; // Variables optional, return empty if not found
    }

    return await response.json() as Record<string, unknown>;
  } catch (error) {
    console.warn('Failed to fetch variables:', error);
    return {};
  }
}

/**
 * Fetch a screenshot/thumbnail of a specific node
 *
 * @param fileKey - Figma file key from URL
 * @param nodeId - Node ID (format: "123:456")
 * @returns Screenshot image as Buffer
 * @throws Error if screenshot generation fails
 */
export async function fetchScreenshot(
  fileKey: string,
  nodeId: string
): Promise<Buffer> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN not set in .env.local');
  }

  // Request screenshot URL from Figma API
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token },
  });

  if (!response.ok) {
    throw new Error(`Screenshot request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { images?: Record<string, string> };
  const imageUrl = data.images?.[nodeId];
  if (!imageUrl) {
    throw new Error('Screenshot URL not returned by Figma API');
  }

  // Fetch actual image from the returned URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Screenshot download failed: ${imageResponse.status}`);
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Fetch with exponential backoff retry logic
 *
 * Automatically retries on rate limit errors with exponential backoff.
 *
 * @param fetcher - Function that returns a Promise
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Result of the fetcher function
 * @throws Error if max retries exceeded or non-retryable error
 */
export async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetcher();
    } catch (error) {
      const isRateLimit = error instanceof Error &&
        (error.message.includes('rate limit') || error.message.includes('429'));

      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Fetch SVG content for a specific node (WP25 T182)
 *
 * @param fileKey - Figma file key from URL
 * @param nodeId - Node ID (format: "123:456")
 * @returns SVG content as string, or null if fetch fails
 */
export async function fetchSVG(
  fileKey: string,
  nodeId: string
): Promise<string | null> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return null; // SVG optional
  }

  try {
    // Request SVG URL from Figma API
    const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=svg`;

    const response = await fetch(url, {
      headers: { 'X-Figma-Token': token },
    });

    if (!response.ok) {
      console.warn(`SVG request failed for ${nodeId}:`, response.status);
      return null;
    }

    const data = await response.json() as { images?: Record<string, string> };
    const svgUrl = data.images?.[nodeId];
    if (!svgUrl) {
      console.warn(`No SVG URL returned for ${nodeId}`);
      return null;
    }

    // Fetch actual SVG from the returned URL
    const svgResponse = await fetch(svgUrl);
    if (!svgResponse.ok) {
      console.warn(`SVG download failed for ${nodeId}:`, svgResponse.status);
      return null;
    }

    return await svgResponse.text();
  } catch (error) {
    console.warn('Failed to fetch SVG:', error);
    return null;
  }
}

/**
 * WP32: Fetch multiple nodes as SVG (batch)
 * Used for downloading SVG containers at import time
 *
 * @param fileKey - Figma file key from URL
 * @param nodeIds - Array of node IDs to fetch as SVG
 * @returns Map of nodeId → SVG content
 */
export async function fetchSVGBatch(
  fileKey: string,
  nodeIds: string[]
): Promise<Record<string, string>> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token || nodeIds.length === 0) {
    return {};
  }

  try {
    // Request SVG URLs for all nodes
    const idsParam = nodeIds.join(',');
    const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(idsParam)}&format=svg`;

    const response = await fetch(url, {
      headers: { 'X-Figma-Token': token },
    });

    if (!response.ok) {
      console.warn(`SVG batch request failed:`, response.status);
      return {};
    }

    const data = await response.json() as { images?: Record<string, string> };
    const svgUrls = data.images || {};

    // Fetch actual SVG content from each URL
    const result: Record<string, string> = {};

    await Promise.all(
      Object.entries(svgUrls).map(async ([nodeId, svgUrl]) => {
        if (svgUrl && typeof svgUrl === 'string') {
          try {
            const svgResponse = await fetch(svgUrl);
            if (svgResponse.ok) {
              result[nodeId] = await svgResponse.text();
            }
          } catch (err) {
            console.warn(`Failed to fetch SVG for ${nodeId}:`, err);
          }
        }
      })
    );

    console.log(`✅ Fetched ${Object.keys(result).length} SVGs from Figma API`);
    return result;
  } catch (error) {
    console.warn('Failed to fetch SVG batch:', error);
    return {};
  }
}

/**
 * Fetch file metadata from Figma API
 *
 * @param fileKey - Figma file key from URL
 * @returns File metadata including name and last modified date
 */
export async function fetchFileMetadata(fileKey: string): Promise<{
  name: string;
  lastModified: string;
  version: string;
}> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN not set in .env.local');
  }

  const url = `https://api.figma.com/v1/files/${fileKey}`;
  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Figma access token. Check Settings.');
    }
    if (response.status === 404) {
      throw new Error(`File not found: ${fileKey}`);
    }
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    name: string;
    lastModified: string;
    version: string;
  };

  return {
    name: data.name,
    lastModified: data.lastModified,
    version: data.version,
  };
}
