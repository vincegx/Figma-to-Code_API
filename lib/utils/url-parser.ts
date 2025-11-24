/**
 * Figma URL Parser
 *
 * Extracts file key and node ID from Figma URLs for API calls.
 *
 * Supported URL formats:
 * - https://www.figma.com/file/{fileKey}/...?node-id={nodeId}
 * - https://www.figma.com/design/{fileKey}/...?node-id={nodeId}
 * - https://www.figma.com/proto/{fileKey}/...?node-id={nodeId}
 */

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId: string;
}

/**
 * Parse Figma URL to extract file key and node ID
 *
 * @param url - Figma URL (e.g., https://www.figma.com/file/ABC123/...?node-id=1-2)
 * @returns Parsed file key and node ID
 * @throws Error if URL format is invalid
 */
export function parseFigmaUrl(url: string): ParsedFigmaUrl {
  try {
    const urlObj = new URL(url);

    // Validate domain (must be figma.com or subdomain)
    if (urlObj.hostname !== 'figma.com' && !urlObj.hostname.endsWith('.figma.com')) {
      throw new Error('URL must be from figma.com');
    }

    // Extract file key from pathname
    // Supports: /file/{key}, /design/{key}, /proto/{key}
    const pathMatch = urlObj.pathname.match(/\/(file|design|proto)\/([a-zA-Z0-9]+)/);
    if (!pathMatch) {
      throw new Error(
        'Invalid Figma URL format. Expected: figma.com/file/{fileKey}/...?node-id={nodeId}'
      );
    }
    const fileKey = pathMatch[2];

    // Extract node ID from query parameter
    const nodeId = urlObj.searchParams.get('node-id');
    if (!nodeId) {
      throw new Error('Missing node-id parameter in Figma URL');
    }

    // Normalize node ID format (both "123-456" and "123:456" are valid)
    const normalizedNodeId = nodeId.replace(/-/g, ':');

    // Validate node ID format (must be digits:digits)
    if (!/^\d+:\d+$/.test(normalizedNodeId)) {
      throw new Error(`Invalid node-id format: ${nodeId}. Expected format: 123:456 or 123-456`);
    }

    return {
      fileKey,
      nodeId: normalizedNodeId,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL: ${url}`);
    }
    throw error;
  }
}

/**
 * Validate a Figma URL
 *
 * @param url - URL string to validate
 * @returns true if valid Figma URL, false otherwise
 */
export function isValidFigmaUrl(url: string): boolean {
  try {
    parseFigmaUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract file key from Figma URL (without node ID requirement)
 *
 * @param url - Figma URL
 * @returns File key or null if invalid
 */
export function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Validate domain (must be figma.com or subdomain)
    if (urlObj.hostname !== 'figma.com' && !urlObj.hostname.endsWith('.figma.com')) {
      return null;
    }

    const pathMatch = urlObj.pathname.match(/\/(file|design|proto)\/([a-zA-Z0-9]+)/);
    return pathMatch ? pathMatch[2] : null;
  } catch {
    return null;
  }
}

/**
 * Build Figma URL from file key and node ID
 *
 * @param fileKey - Figma file key
 * @param nodeId - Node ID (format: "123:456")
 * @param fileName - Optional file name for URL slug
 * @returns Complete Figma URL
 */
export function buildFigmaUrl(
  fileKey: string,
  nodeId: string,
  fileName?: string
): string {
  const slug = fileName
    ? fileName.toLowerCase().replace(/\s+/g, '-')
    : 'untitled';

  const encodedNodeId = nodeId.replace(/:/g, '-');
  return `https://www.figma.com/file/${fileKey}/${slug}?node-id=${encodedNodeId}`;
}

/**
 * Validate node ID format
 *
 * @param nodeId - Node ID to validate
 * @returns true if valid format (digits:digits)
 */
export function isValidNodeId(nodeId: string): boolean {
  return /^\d+:\d+$/.test(nodeId);
}

/**
 * Normalize node ID to consistent format with colon
 *
 * @param nodeId - Node ID (can be "123:456" or "123-456")
 * @returns Normalized node ID with colon ("123:456")
 */
export function normalizeNodeId(nodeId: string): string {
  return nodeId.replace(/-/g, ':');
}
