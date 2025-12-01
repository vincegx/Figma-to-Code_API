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
import type { VersionsFile } from '../types/versioning';

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
    thumbnail: `/api/images/${safeNodeId}/screenshot.png`,
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

/**
 * WP32: Save image assets (PNG/JPG) for a node
 * Stores image files in figma-data/{nodeId}/img/
 *
 * @param nodeId - Figma node ID
 * @param imageAssets - Map of filename → image Buffer
 */
export async function saveImageAssets(
  nodeId: string,
  imageAssets: Record<string, Buffer>
): Promise<void> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const imgDir = path.join(FIGMA_DATA_DIR, safeNodeId, 'img');

  // Create img directory
  await fs.mkdir(imgDir, { recursive: true });

  // Save each image file
  for (const [filename, buffer] of Object.entries(imageAssets)) {
    await fs.writeFile(path.join(imgDir, filename), new Uint8Array(buffer));
  }
}

/**
 * WP32: Save SVG assets for a node
 * Stores SVG files in figma-data/{nodeId}/svg/
 *
 * @param nodeId - Figma node ID
 * @param svgAssets - Map of assetName → SVG content
 */
export async function saveSvgAssets(
  nodeId: string,
  svgAssets: Record<string, string>
): Promise<void> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const svgDir = path.join(FIGMA_DATA_DIR, safeNodeId, 'svg');

  // Create svg directory
  await fs.mkdir(svgDir, { recursive: true });

  // Save each SVG file
  for (const [assetName, svgContent] of Object.entries(svgAssets)) {
    const safeName = assetName.replace(/[^a-zA-Z0-9_-]/g, '_');
    await fs.writeFile(
      path.join(svgDir, `${safeName}.svg`),
      svgContent,
      'utf-8'
    );
  }
}

/**
 * WP31 T224: Save Figma variables to disk
 * Saves variables.json in figma-data/{nodeId}/
 *
 * @param nodeId - Figma node ID
 * @param variables - Variables data from Figma API
 */
export async function saveVariables(
  nodeId: string,
  variables: Record<string, unknown>
): Promise<void> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDir = path.join(FIGMA_DATA_DIR, safeNodeId);

  await fs.mkdir(nodeDir, { recursive: true });
  await fs.writeFile(
    path.join(nodeDir, 'variables.json'),
    JSON.stringify(variables, null, 2),
    'utf-8'
  );
}

/**
 * WP31 T224: Load Figma variables from disk
 * Reads variables.json from figma-data/{nodeId}/
 *
 * @param nodeId - Figma node ID
 * @returns Variables data (empty object if not found)
 */
export async function loadVariables(nodeId: string): Promise<Record<string, unknown>> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const variablesPath = path.join(FIGMA_DATA_DIR, safeNodeId, 'variables.json');

  try {
    const content = await fs.readFile(variablesPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {}; // No variables file
  }
}

/**
 * WP32: Load SVG assets for a node
 * Reads all SVG files from figma-data/{nodeId}/svg/
 *
 * @param nodeId - Figma node ID
 * @returns Map of assetName → SVG content (empty if no SVGs)
 */
export async function loadSvgAssets(nodeId: string): Promise<Record<string, string>> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const svgDir = path.join(FIGMA_DATA_DIR, safeNodeId, 'svg');

  try {
    const files = await fs.readdir(svgDir);
    const assets: Record<string, string> = {};

    for (const file of files) {
      if (file.endsWith('.svg')) {
        const content = await fs.readFile(path.join(svgDir, file), 'utf-8');
        const assetName = file.replace('.svg', '');
        assets[assetName] = content;
      }
    }

    return assets;
  } catch {
    return {}; // No SVG directory
  }
}

/**
 * WP32: Get SVG asset path for serving
 *
 * @param nodeId - Figma node ID
 * @param assetName - SVG asset name (without extension)
 * @returns Absolute path to SVG file
 */
export function getSvgAssetPath(nodeId: string, assetName: string): string {
  const safeNodeId = sanitizeNodeId(nodeId);
  const safeName = assetName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(FIGMA_DATA_DIR, safeNodeId, 'svg', `${safeName}.svg`);
}

/**
 * WP32: Check if SVG assets exist for a node
 *
 * @param nodeId - Figma node ID
 * @returns true if svg directory exists and has files
 */
export async function hasSvgAssets(nodeId: string): Promise<boolean> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const svgDir = path.join(FIGMA_DATA_DIR, safeNodeId, 'svg');

  try {
    const files = await fs.readdir(svgDir);
    return files.some(f => f.endsWith('.svg'));
  } catch {
    return false;
  }
}

// ============================================================================
// WP40: Versioning Functions
// ============================================================================

/**
 * WP40: Read versions.json from node directory
 *
 * @param nodeId - Figma node ID
 * @returns VersionsFile or null if not found
 */
export async function readVersionsFile(nodeId: string): Promise<VersionsFile | null> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const versionsPath = path.join(FIGMA_DATA_DIR, safeNodeId, 'versions.json');

  try {
    const content = await fs.readFile(versionsPath, 'utf-8');
    return JSON.parse(content) as VersionsFile;
  } catch {
    return null; // File not found
  }
}

/**
 * WP40: Write versions.json to node directory
 *
 * @param nodeId - Figma node ID
 * @param versions - VersionsFile to write
 */
export async function writeVersionsFile(
  nodeId: string,
  versions: VersionsFile
): Promise<void> {
  const safeNodeId = sanitizeNodeId(nodeId);
  const nodeDir = path.join(FIGMA_DATA_DIR, safeNodeId);
  const versionsPath = path.join(nodeDir, 'versions.json');

  await fs.mkdir(nodeDir, { recursive: true });
  await fs.writeFile(versionsPath, JSON.stringify(versions, null, 2), 'utf-8');
}

/**
 * WP40: Initialize versions.json for a new node
 *
 * @param nodeId - Figma node ID
 * @param figmaLastModified - ISO timestamp from Figma API
 */
export async function initVersionsFile(
  nodeId: string,
  figmaLastModified: string
): Promise<void> {
  const now = new Date().toISOString();
  const versions: VersionsFile = {
    current: {
      figmaLastModified,
      fetchedAt: now,
    },
    history: [],
  };

  await writeVersionsFile(nodeId, versions);
}

/**
 * WP40: Get node directory path
 *
 * @param nodeId - Figma node ID
 * @returns Absolute path to node directory
 */
export function getNodeDirPath(nodeId: string): string {
  const safeNodeId = sanitizeNodeId(nodeId);
  return path.join(FIGMA_DATA_DIR, safeNodeId);
}

/**
 * WP40: Get history directory path
 *
 * @param nodeId - Figma node ID
 * @returns Absolute path to history directory
 */
export function getHistoryDirPath(nodeId: string): string {
  return path.join(getNodeDirPath(nodeId), 'history');
}

/**
 * WP40: Check if history directory exists
 *
 * @param nodeId - Figma node ID
 * @returns true if history directory exists
 */
export async function hasHistory(nodeId: string): Promise<boolean> {
  const historyDir = getHistoryDirPath(nodeId);

  try {
    await fs.access(historyDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * WP40: Export sanitizeNodeId for use in other modules
 */
export { sanitizeNodeId };
