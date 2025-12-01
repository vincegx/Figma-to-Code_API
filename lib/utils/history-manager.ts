/**
 * History Manager Utility
 *
 * WP40 T343: Manages version history for Figma nodes.
 * Handles creating snapshots, listing versions, and loading historical data.
 */

import fs from 'fs/promises';
import path from 'path';
import type { FigmaNode } from '../types/figma';
import type { LibraryNode } from '../types/library';
import type { VersionEntry, VersionsFile } from '../types/versioning';
import { MAX_HISTORY_VERSIONS } from '../types/versioning';
import {
  getNodeDirPath,
  getHistoryDirPath,
  readVersionsFile,
  writeVersionsFile,
  sanitizeNodeId,
} from './file-storage';

// ============================================================================
// Snapshot Management
// ============================================================================

/**
 * Create folder name from ISO timestamp
 * Converts "2025-11-28T10:30:00Z" to "figma_2025-11-28T10-30-00"
 */
function createFolderName(isoTimestamp: string): string {
  // Replace colons with hyphens for file system compatibility
  const safeTimestamp = isoTimestamp
    .replace(/:/g, '-')
    .replace(/\.\d+Z$/, '') // Remove milliseconds if present
    .replace(/Z$/, '');
  return `figma_${safeTimestamp}`;
}

/**
 * Create a history snapshot of the current node data
 *
 * Copies current data.json, metadata.json, variables.json, and screenshot.png
 * to a timestamped folder in history/
 *
 * @param nodeId - Figma node ID
 * @param figmaLastModified - ISO timestamp of the version being archived
 * @returns Folder name of the created snapshot
 */
export async function createHistorySnapshot(
  nodeId: string,
  figmaLastModified: string
): Promise<string> {
  const nodeDir = getNodeDirPath(nodeId);
  const historyDir = getHistoryDirPath(nodeId);
  const folderName = createFolderName(figmaLastModified);
  const snapshotDir = path.join(historyDir, folderName);

  // Create history directory if needed
  await fs.mkdir(snapshotDir, { recursive: true });

  // Files to copy
  const filesToCopy = [
    'data.json',
    'metadata.json',
    'variables.json',
    'screenshot.png',
  ];

  // Copy each file if it exists
  for (const file of filesToCopy) {
    const srcPath = path.join(nodeDir, file);
    const destPath = path.join(snapshotDir, file);

    try {
      await fs.copyFile(srcPath, destPath);
    } catch (error) {
      // File might not exist (e.g., variables.json), skip silently
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Failed to copy ${file} to history:`, error);
      }
    }
  }

  // Update versions.json
  const versions = await readVersionsFile(nodeId);
  if (versions) {
    // Add current version to history before it's replaced
    const historyEntry: VersionEntry = {
      figmaLastModified: versions.current.figmaLastModified,
      fetchedAt: versions.current.fetchedAt,
      folder: folderName,
    };

    versions.history.push(historyEntry);

    // Trim history if exceeds max
    if (versions.history.length > MAX_HISTORY_VERSIONS) {
      // Remove oldest versions
      const toRemove = versions.history.splice(0, versions.history.length - MAX_HISTORY_VERSIONS);

      // Delete old snapshot folders
      for (const entry of toRemove) {
        const oldDir = path.join(historyDir, entry.folder);
        try {
          await fs.rm(oldDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    await writeVersionsFile(nodeId, versions);
  }

  return folderName;
}

/**
 * Update current version after refetch
 *
 * @param nodeId - Figma node ID
 * @param figmaLastModified - New ISO timestamp from Figma API
 */
export async function updateCurrentVersion(
  nodeId: string,
  figmaLastModified: string
): Promise<void> {
  const versions = await readVersionsFile(nodeId);

  if (versions) {
    versions.current = {
      figmaLastModified,
      fetchedAt: new Date().toISOString(),
    };
    await writeVersionsFile(nodeId, versions);
  } else {
    // Initialize if doesn't exist
    const newVersions: VersionsFile = {
      current: {
        figmaLastModified,
        fetchedAt: new Date().toISOString(),
      },
      history: [],
    };
    await writeVersionsFile(nodeId, newVersions);
  }
}

// ============================================================================
// Version Listing
// ============================================================================

/**
 * List all available versions for a node
 *
 * @param nodeId - Figma node ID
 * @returns Array of version entries (sorted by date, newest first)
 */
export async function listVersions(nodeId: string): Promise<VersionEntry[]> {
  const versions = await readVersionsFile(nodeId);

  if (!versions) {
    return [];
  }

  // Return history in reverse order (newest first)
  return [...versions.history].reverse();
}

/**
 * Get current version info
 *
 * @param nodeId - Figma node ID
 * @returns Current version info or null
 */
export async function getCurrentVersion(
  nodeId: string
): Promise<{ figmaLastModified: string; fetchedAt: string } | null> {
  const versions = await readVersionsFile(nodeId);
  return versions?.current || null;
}

// ============================================================================
// Version Loading
// ============================================================================

/**
 * Load data from a specific historical version
 *
 * @param nodeId - Figma node ID
 * @param folder - History folder name
 * @returns Object with data, metadata, variables, and screenshot path
 */
export async function loadVersion(
  nodeId: string,
  folder: string
): Promise<{
  data: FigmaNode | null;
  metadata: LibraryNode | null;
  variables: Record<string, unknown>;
  screenshotPath: string;
}> {
  const historyDir = getHistoryDirPath(nodeId);
  const snapshotDir = path.join(historyDir, folder);

  let data: FigmaNode | null = null;
  let metadata: LibraryNode | null = null;
  let variables: Record<string, unknown> = {};

  // Load data.json
  try {
    const content = await fs.readFile(path.join(snapshotDir, 'data.json'), 'utf-8');
    data = JSON.parse(content) as FigmaNode;
  } catch {
    // File not found
  }

  // Load metadata.json
  try {
    const content = await fs.readFile(path.join(snapshotDir, 'metadata.json'), 'utf-8');
    metadata = JSON.parse(content) as LibraryNode;
  } catch {
    // File not found
  }

  // Load variables.json
  try {
    const content = await fs.readFile(path.join(snapshotDir, 'variables.json'), 'utf-8');
    variables = JSON.parse(content);
  } catch {
    // File not found, return empty
  }

  // Screenshot path
  const screenshotPath = path.join(snapshotDir, 'screenshot.png');

  return {
    data,
    metadata,
    variables,
    screenshotPath,
  };
}

/**
 * Check if a specific version exists
 *
 * @param nodeId - Figma node ID
 * @param folder - History folder name
 * @returns true if the version exists
 */
export async function versionExists(
  nodeId: string,
  folder: string
): Promise<boolean> {
  const historyDir = getHistoryDirPath(nodeId);
  const snapshotDir = path.join(historyDir, folder);

  try {
    await fs.access(snapshotDir);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Delete all history for a node
 *
 * @param nodeId - Figma node ID
 */
export async function clearHistory(nodeId: string): Promise<void> {
  const historyDir = getHistoryDirPath(nodeId);

  try {
    await fs.rm(historyDir, { recursive: true, force: true });
  } catch {
    // Directory might not exist
  }

  // Reset versions.json history
  const versions = await readVersionsFile(nodeId);
  if (versions) {
    versions.history = [];
    await writeVersionsFile(nodeId, versions);
  }
}

/**
 * Get screenshot URL for a historical version
 *
 * @param nodeId - Figma node ID
 * @param folder - History folder name
 * @returns API URL for serving the screenshot
 */
export function getHistoryScreenshotUrl(nodeId: string, folder: string): string {
  const safeNodeId = sanitizeNodeId(nodeId);
  return `/api/images/${safeNodeId}/history/${folder}/screenshot.png`;
}
