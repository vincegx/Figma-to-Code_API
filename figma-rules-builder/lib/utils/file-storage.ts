/**
 * File Storage Utilities
 *
 * Filesystem-based caching for Figma data
 * Constitutional Principle III: Data Locality - fetch once, work offline
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { FigmaNode } from '../types/figma';

/**
 * Base directory for cached Figma data
 */
const CACHE_DIR = 'figma-data';

/**
 * Cached Figma node data
 */
export interface CachedFigmaNode {
  nodeId: string;
  fileKey: string;
  document: FigmaNode;
  cachedAt: string;
  lastModified: string;
}

/**
 * Cached Figma variables data
 */
export interface CachedFigmaVariables {
  fileKey: string;
  variables: Record<string, unknown>;
  variableCollections: Record<string, unknown>;
  cachedAt: string;
}

/**
 * Ensure cache directory exists
 *
 * Creates figma-data/ directory if it doesn't exist
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

/**
 * Save Figma node data to cache
 *
 * Saves to: figma-data/{nodeId}.json
 *
 * @param nodeId - Figma node ID
 * @param fileKey - Figma file key
 * @param document - Figma node document
 * @param lastModified - Last modification timestamp from Figma
 */
export async function saveFigmaNode(
  nodeId: string,
  fileKey: string,
  document: FigmaNode,
  lastModified: string
): Promise<void> {
  await ensureCacheDir();

  const cacheData: CachedFigmaNode = {
    nodeId,
    fileKey,
    document,
    cachedAt: new Date().toISOString(),
    lastModified,
  };

  const filePath = path.join(CACHE_DIR, `${nodeId}.json`);
  await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/**
 * Load Figma node data from cache
 *
 * Loads from: figma-data/{nodeId}.json
 *
 * @param nodeId - Figma node ID
 * @returns Cached node data, or null if not found
 */
export async function loadFigmaNode(
  nodeId: string
): Promise<CachedFigmaNode | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${nodeId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const cacheData: CachedFigmaNode = JSON.parse(fileContent);
    return cacheData;
  } catch (error) {
    // File doesn't exist or is invalid - return null
    return null;
  }
}

/**
 * Save Figma variables to cache
 *
 * Saves to: figma-data/{fileKey}-variables.json
 *
 * @param fileKey - Figma file key
 * @param variables - Variables data
 * @param variableCollections - Variable collections data
 */
export async function saveFigmaVariables(
  fileKey: string,
  variables: Record<string, unknown>,
  variableCollections: Record<string, unknown>
): Promise<void> {
  await ensureCacheDir();

  const cacheData: CachedFigmaVariables = {
    fileKey,
    variables,
    variableCollections,
    cachedAt: new Date().toISOString(),
  };

  const filePath = path.join(CACHE_DIR, `${fileKey}-variables.json`);
  await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/**
 * Load Figma variables from cache
 *
 * Loads from: figma-data/{fileKey}-variables.json
 *
 * @param fileKey - Figma file key
 * @returns Cached variables data, or null if not found
 */
export async function loadFigmaVariables(
  fileKey: string
): Promise<CachedFigmaVariables | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${fileKey}-variables.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const cacheData: CachedFigmaVariables = JSON.parse(fileContent);
    return cacheData;
  } catch (error) {
    // File doesn't exist or is invalid - return null
    return null;
  }
}

/**
 * Save screenshot image data to cache
 *
 * Saves to: figma-data/{nodeId}-screenshot.png
 *
 * @param nodeId - Figma node ID
 * @param imageUrl - Image URL from Figma API
 */
export async function saveScreenshot(
  nodeId: string,
  imageUrl: string
): Promise<void> {
  await ensureCacheDir();

  // Fetch the image from the URL
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download screenshot: ${response.statusText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const filePath = path.join(CACHE_DIR, `${nodeId}-screenshot.png`);
  await fs.writeFile(filePath, Buffer.from(imageBuffer));
}

/**
 * Load screenshot image path from cache
 *
 * Returns the file path if the screenshot exists
 *
 * @param nodeId - Figma node ID
 * @returns File path to screenshot, or null if not found
 */
export async function loadScreenshotPath(
  nodeId: string
): Promise<string | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${nodeId}-screenshot.png`);
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

/**
 * Delete cached data for a specific node
 *
 * Removes node JSON and screenshot from cache
 *
 * @param nodeId - Figma node ID
 */
export async function deleteCachedNode(nodeId: string): Promise<void> {
  const jsonPath = path.join(CACHE_DIR, `${nodeId}.json`);
  const screenshotPath = path.join(CACHE_DIR, `${nodeId}-screenshot.png`);

  try {
    await fs.unlink(jsonPath);
  } catch {
    // File might not exist, ignore
  }

  try {
    await fs.unlink(screenshotPath);
  } catch {
    // File might not exist, ignore
  }
}

/**
 * List all cached node IDs
 *
 * @returns Array of cached node IDs
 */
export async function listCachedNodes(): Promise<string[]> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);

    // Filter for node JSON files (not variables or screenshots)
    const nodeFiles = files.filter(
      (file) => file.endsWith('.json') && !file.includes('-variables')
    );

    // Extract node IDs from filenames
    return nodeFiles.map((file) => file.replace('.json', ''));
  } catch {
    return [];
  }
}

/**
 * Check if a node is cached
 *
 * @param nodeId - Figma node ID
 * @returns True if node is cached, false otherwise
 */
export async function isCached(nodeId: string): Promise<boolean> {
  const cached = await loadFigmaNode(nodeId);
  return cached !== null;
}

/**
 * Get cache statistics
 *
 * @returns Cache size and file count
 */
export async function getCacheStats(): Promise<{
  nodeCount: number;
  totalSize: number;
}> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);

    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    const nodeCount = files.filter(
      (file) => file.endsWith('.json') && !file.includes('-variables')
    ).length;

    return { nodeCount, totalSize };
  } catch {
    return { nodeCount: 0, totalSize: 0 };
  }
}
