/**
 * Multi-Node File Storage Utilities
 *
 * Implements file-based storage for Figma nodes in separate directories.
 * Each node gets its own directory: figma-data/{nodeId}/
 *
 * Structure:
 * figma-data/
 *   123-456/           (nodeId with : replaced by -)
 *     data.json        (FigmaNode data)
 *     metadata.json    (NodeMetadata)
 *     screenshot.png   (Thumbnail)
 */

import fs from 'fs/promises';
import path from 'path';
import type { FigmaNode } from '../types/figma';
import type { LibraryNode } from '../types/library';

const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');

/**
 * Convert node ID to file-system safe format
 * Replaces : with - for Windows compatibility
 *
 * @param nodeId - Figma node ID (format: "123:456")
 * @returns File-safe node ID (format: "123-456")
 */
function sanitizeNodeId(nodeId: string): string {
  return nodeId.replace(/:/g, '-');
}

/**
 * Save node data to file system
 *
 * Creates directory structure and saves:
 * - data.json (FigmaNode)
 * - metadata.json (NodeMetadata)
 * - screenshot.png (thumbnail)
 *
 * @param nodeId - Figma node ID
 * @param nodeData - FigmaNode data from API
 * @param fileKey - Figma file key
 * @param screenshot - Screenshot image buffer
 * @param fileName - Human-readable file name
 * @returns LibraryNode metadata for index
 */
export async function saveNodeData(
  nodeId: string,
  nodeData: FigmaNode,
  fileKey: string,
  screenshot: Buffer,
  fileName: string
): Promise<LibraryNode> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDirPath = path.join(FIGMA_DATA_DIR, safeNodeId);

  // Create directory
  await fs.mkdir(nodeDirPath, { recursive: true });

  // Save data.json
  await fs.writeFile(
    path.join(nodeDirPath, 'data.json'),
    JSON.stringify(nodeData, null, 2),
    'utf-8'
  );

  // Create LibraryNode metadata
  const now = new Date().toISOString();
  const libraryNode: LibraryNode = {
    id: `lib-${safeNodeId}`,
    figmaNodeId: nodeId,
    name: nodeData.name,
    altNode: null as any, // Will be populated by transformation engine (WP04)
    tags: [],
    category: undefined,
    description: undefined,
    addedAt: now,
    lastModified: now,
    usage: {
      viewCount: 0,
      exportCount: 0,
    },
    metadata: {
      fileKey,
      fileName,
      nodeUrl: `https://www.figma.com/file/${fileKey}?node-id=${nodeId}`,
    },
  };

  // Save metadata.json
  await fs.writeFile(
    path.join(nodeDirPath, 'metadata.json'),
    JSON.stringify(libraryNode, null, 2),
    'utf-8'
  );

  // Save screenshot.png
  await fs.writeFile(
    path.join(nodeDirPath, 'screenshot.png'),
    screenshot
  );

  return libraryNode;
}

/**
 * Load node data from file system
 *
 * @param nodeId - Figma node ID
 * @returns FigmaNode data or null if not found
 */
export async function loadNodeData(nodeId: string): Promise<FigmaNode | null> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDirPath = path.join(FIGMA_DATA_DIR, safeNodeId);
  const dataPath = path.join(nodeDirPath, 'data.json');

  try {
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(fileContent) as FigmaNode;
  } catch (error) {
    return null; // File not found
  }
}

/**
 * Load node metadata from file system
 *
 * @param nodeId - Figma node ID
 * @returns LibraryNode metadata or null if not found
 */
export async function loadNodeMetadata(nodeId: string): Promise<LibraryNode | null> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDirPath = path.join(FIGMA_DATA_DIR, safeNodeId);
  const metadataPath = path.join(nodeDirPath, 'metadata.json');

  try {
    const fileContent = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(fileContent) as LibraryNode;
  } catch (error) {
    return null; // File not found
  }
}

/**
 * Delete node data from file system
 *
 * Removes entire node directory including all files.
 *
 * @param nodeId - Figma node ID
 */
export async function deleteNodeData(nodeId: string): Promise<void> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDirPath = path.join(FIGMA_DATA_DIR, safeNodeId);
  await fs.rm(nodeDirPath, { recursive: true, force: true });
}

/**
 * Check if node data exists in file system
 *
 * @param nodeId - Figma node ID
 * @returns true if node directory and data.json exist
 */
export async function nodeDataExists(nodeId: string): Promise<boolean> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const dataPath = path.join(FIGMA_DATA_DIR, safeNodeId, 'data.json');

  try {
    await fs.access(dataPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all node IDs from file system
 *
 * Scans figma-data/ directory for all node folders.
 *
 * @returns Array of node IDs (in original format with colons)
 */
export async function getAllNodeIds(): Promise<string[]> {
  try {
    await fs.mkdir(FIGMA_DATA_DIR, { recursive: true });
    const entries = await fs.readdir(FIGMA_DATA_DIR, { withFileTypes: true });

    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name.replace(/-/g, ':')); // Convert back to original format
  } catch (error) {
    return [];
  }
}

/**
 * Update node metadata (for usage tracking, tags, etc.)
 *
 * @param nodeId - Figma node ID
 * @param updates - Partial LibraryNode updates
 */
export async function updateNodeMetadata(
  nodeId: string,
  updates: Partial<LibraryNode>
): Promise<void> {
  const metadata = await loadNodeMetadata(nodeId);
  if (!metadata) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const updated: LibraryNode = {
    ...metadata,
    ...updates,
    lastModified: new Date().toISOString(),
  };

  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDirPath = path.join(FIGMA_DATA_DIR, safeNodeId);
  const metadataPath = path.join(nodeDirPath, 'metadata.json');

  await fs.writeFile(metadataPath, JSON.stringify(updated, null, 2), 'utf-8');
}

/**
 * Get screenshot path for a node
 *
 * @param nodeId - Figma node ID
 * @returns Absolute path to screenshot.png
 */
export function getScreenshotPath(nodeId: string): string {
  const safeNodeId = sanitizeNodeId(nodeId);
  return path.join(FIGMA_DATA_DIR, safeNodeId, 'screenshot.png');
}
