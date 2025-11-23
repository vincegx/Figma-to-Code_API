/**
 * Figma REST API Client
 *
 * Server-side proxy for Figma API calls with authentication
 * Constitutional Principle III: Data Locality - fetch once, cache forever
 */

import type { FigmaNode } from './types/figma';

/**
 * Figma API base URL
 */
const FIGMA_API_BASE = 'https://api.figma.com/v1';

/**
 * Figma API error response
 */
export interface FigmaAPIError {
  status: number;
  err: string;
}

/**
 * Response from fetching Figma nodes
 */
export interface FigmaNodesResponse {
  nodes: Record<string, { document: FigmaNode }>;
  name: string;
  lastModified: string;
}

/**
 * Response from fetching Figma variables
 */
export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variableCollections: Record<string, unknown>;
    variables: Record<string, unknown>;
  };
}

/**
 * Response from fetching Figma images
 */
export interface FigmaImagesResponse {
  err: string | null;
  images: Record<string, string | null>;
}

/**
 * Configuration for Figma API requests
 */
interface FigmaRequestConfig {
  accessToken: string;
  timeout?: number;
}

/**
 * Fetch specific nodes from a Figma file
 *
 * @param fileKey - Figma file key (from URL)
 * @param nodeIds - Array of node IDs to fetch
 * @param config - Request configuration
 * @returns Node data with document tree
 */
export async function fetchNodes(
  fileKey: string,
  nodeIds: string[],
  config: FigmaRequestConfig
): Promise<FigmaNodesResponse> {
  const { accessToken, timeout = 10000 } = config;

  const ids = nodeIds.join(',');
  const url = `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${ids}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error: FigmaAPIError = await response.json();
      throw new Error(
        `Figma API error (${response.status}): ${error.err || 'Unknown error'}`
      );
    }

    const data: FigmaNodesResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Figma API request timed out after ${timeout}ms. Check your network connection.`
        );
      }
      throw error;
    }
    throw new Error('Unknown error fetching Figma nodes');
  }
}

/**
 * Fetch a single node from a Figma file
 *
 * Convenience wrapper around fetchNodes for single-node requests
 *
 * @param fileKey - Figma file key
 * @param nodeId - Single node ID
 * @param config - Request configuration
 * @returns Single node document
 */
export async function fetchNode(
  fileKey: string,
  nodeId: string,
  config: FigmaRequestConfig
): Promise<FigmaNode> {
  const response = await fetchNodes(fileKey, [nodeId], config);

  const nodeData = response.nodes[nodeId];
  if (!nodeData) {
    throw new Error(`Node ${nodeId} not found in Figma file ${fileKey}`);
  }

  return nodeData.document;
}

/**
 * Fetch design tokens/variables from a Figma file
 *
 * @param fileKey - Figma file key
 * @param config - Request configuration
 * @returns Variables metadata
 */
export async function fetchVariables(
  fileKey: string,
  config: FigmaRequestConfig
): Promise<FigmaVariablesResponse> {
  const { accessToken, timeout = 10000 } = config;

  const url = `${FIGMA_API_BASE}/files/${fileKey}/variables/local`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error: FigmaAPIError = await response.json();
      throw new Error(
        `Figma API error (${response.status}): ${error.err || 'Unknown error'}`
      );
    }

    const data: FigmaVariablesResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Figma API request timed out after ${timeout}ms. Check your network connection.`
        );
      }
      throw error;
    }
    throw new Error('Unknown error fetching Figma variables');
  }
}

/**
 * Fetch screenshot image URL for a node
 *
 * Note: Returns URL, not the image data. URL expires after 14 days.
 *
 * @param fileKey - Figma file key
 * @param nodeId - Node ID to screenshot
 * @param config - Request configuration
 * @returns Image URL (expires in 14 days)
 */
export async function fetchScreenshot(
  fileKey: string,
  nodeId: string,
  config: FigmaRequestConfig
): Promise<string> {
  const { accessToken, timeout = 10000 } = config;

  const url = `${FIGMA_API_BASE}/images/${fileKey}?ids=${nodeId}&format=png`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error: FigmaAPIError = await response.json();
      throw new Error(
        `Figma API error (${response.status}): ${error.err || 'Unknown error'}`
      );
    }

    const data: FigmaImagesResponse = await response.json();

    if (data.err) {
      throw new Error(`Figma API error: ${data.err}`);
    }

    const imageUrl = data.images[nodeId];
    if (!imageUrl) {
      throw new Error(`No image generated for node ${nodeId}`);
    }

    return imageUrl;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Figma API request timed out after ${timeout}ms. Check your network connection.`
        );
      }
      throw error;
    }
    throw new Error('Unknown error fetching Figma screenshot');
  }
}

/**
 * Parse Figma URL to extract file key and node ID
 *
 * Supported formats:
 * - https://www.figma.com/file/{fileKey}/{title}?node-id={nodeId}
 * - https://www.figma.com/design/{fileKey}/{title}?node-id={nodeId}
 *
 * @param url - Figma URL
 * @returns Parsed file key and node ID
 */
export function parseFigmaUrl(url: string): {
  fileKey: string;
  nodeId: string;
} {
  try {
    const parsedUrl = new URL(url);

    // Extract file key from path
    const pathMatch = parsedUrl.pathname.match(
      /\/(file|design)\/([a-zA-Z0-9]+)/
    );
    if (!pathMatch || !pathMatch[2]) {
      throw new Error('Invalid Figma URL: could not find file key');
    }
    const fileKey: string = pathMatch[2];

    // Extract node ID from query params
    const nodeIdParam = parsedUrl.searchParams.get('node-id');
    if (!nodeIdParam) {
      throw new Error('Invalid Figma URL: missing node-id parameter');
    }

    // Convert hyphenated format to colon format (123-456 → 123:456)
    const nodeId: string = nodeIdParam.replace('-', ':');

    return { fileKey, nodeId };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse Figma URL');
  }
}
